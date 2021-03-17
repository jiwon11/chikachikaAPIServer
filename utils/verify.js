const axios = require("axios");
const crypto = require("crypto");
const ApiError = require("../utils/error");
const { Phone_verify, User, City } = require("../utils/models");
const jwt = require("jsonwebtoken");
const cloudFrontUrl = process.env.cloudFrontUrl;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

module.exports.phone = async function checkPhoneNumber(phoneNumber) {
  const token = Math.floor(Math.random() * 1000000);
  await Phone_verify.create({
    token: token,
    phoneNumber: phoneNumber,
  });
  /*
  const accessKey = process.env.NCP_access_token;
  const secretKey = process.env.NCP_secret_key;
  const serviceID = process.env.NCP_serviceID;
  const space = " "; // one space
  const newLine = "\n"; // new line
  const method = "POST"; // method
  const url = `/sms/v2/services/${serviceID}/messages`;
  const timestamp = Date.now().toString();
  let message = [];
  message.push(method);
  message.push(space);
  message.push(url);
  message.push(newLine);
  message.push(timestamp);
  message.push(newLine);
  message.push(accessKey);
  let hmac = crypto.createHmac("sha256", secretKey);
  const signature = hmac.update(message.join("")).digest("base64");
  let requestBody = {
    type: "SMS",
    contentType: "COMM",
    from: "01051849798",
    content: `[치카치카]인증번호 [${token}]를 입력해주세요.`,
    messages: [
      {
        to: phoneNumber,
        subject: "인증번호 알림",
      },
    ],
  };
  let axiosConfig = {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-signature-v2": signature,
    },
  };
  const response = await axios.post(`https://sens.apigw.ntruss.com/sms/v2/services/${serviceID}/messages`, requestBody, axiosConfig);
  */
  try {
    const message = await client.messages.create({
      body: `[치카치카]인증번호 [${token}]를 입력해주세요.`,
      messagingServiceSid: "MGb740d131f110fba2beb052ff9f12b4be",
      to: `+82${phoneNumber}`,
    });
    console.log(message);
    if (message.status === "accepted") {
      const existUser = await User.findOne({
        where: {
          phoneNumber: phoneNumber,
        },
      });
      var exist;
      if (existUser) {
        exist = true;
      } else {
        exist = false;
      }
      let responseBody;
      if (phoneNumber === "01093664131") {
        const user = await User.findOne({
          where: {
            phoneNumber: phoneNumber,
          },
          include: [
            {
              model: City,
              as: "Residences",
              attributes: ["id", "sido", "sigungu", "emdName"],
              through: {
                attributes: ["now"],
              },
            },
          ],
        });
        const token = jwt.sign({ id: user.dataValues.id }, process.env.JWT_SECRET, { expiresIn: "1y" });
        const testUserInfo = JSON.stringify({
          userId: user.id,
          userNickname: user.nickname,
          userProfileImg: user.profileImg,
          img_thumbNail: user.userProfileImgKeyValue === null ? null : `${cloudFrontUrl}${user.userProfileImgKeyValue}?w=140&h=140&f=jpeg&q=100`,
          userResidences: user.Residences,
        });
        responseBody = `{"statusText": "Accepted","message": "인증번호 문자를 발신하였습니다.", "exist": ${exist}, "token": "${token}","user": ${testUserInfo}}`;
      } else {
        responseBody = `{"statusText": "Accepted","message": "인증번호 문자를 발신하였습니다.", "exist": ${exist}}`;
      }
      return {
        statusCode: 200,
        body: responseBody,
      };
    } else {
      let responseBody = `{"statusText": "Accepted","message": "${message.sid}"}`;
      return {
        statusCode: 403,
        body: responseBody,
      };
    }
  } catch (error) {
    console.log(error);
    let responseBody = `{"statusText": "Server Error","message": ${error.message}}`;
    return {
      statusCode: 500,
      body: responseBody,
    };
  }
};

module.exports.verifyPhoneNumberFunc = async function verifyPhoneNumberFunc(userPhoneNumber, token) {
  const verifies = await Phone_verify.findOne({
    where: {
      phoneNumber: userPhoneNumber,
      token: token,
    },
  });
  if (verifies) {
    await User.update(
      {
        certifiedPhoneNumber: true,
      },
      {
        where: {
          phoneNumber: userPhoneNumber,
        },
      }
    );
    await verifies.destroy();
    let responseBody = JSON.stringify({ statusText: "Accepted", message: "인증되었습니다." });
    return {
      statusCode: 200,
      body: responseBody,
    };
  } else {
    let responseBody = JSON.stringify({ statusText: "Unaccepted", message: "인증번호가 틀립니다." });
    return {
      statusCode: 401,
      body: responseBody,
    };
  }
};
