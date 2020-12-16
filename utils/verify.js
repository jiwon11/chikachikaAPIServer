const axios = require("axios");
const crypto = require("crypto");
const ApiError = require("../utils/error");
const { Phone_verify, User } = require("../utils/models");

module.exports.phone = async function checkPhoneNumber(phoneNumber) {
  const token = Math.floor(Math.random() * 1000000);
  await Phone_verify.create({
    token: token,
    phoneNumber: phoneNumber,
  });
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
  try {
    const response = await axios.post(`https://sens.apigw.ntruss.com/sms/v2/services/${serviceID}/messages`, requestBody, axiosConfig);
    if (response.status === 202) {
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
      let responseBody = `{"statusText": "Accepted","message": "인증번호 문자를 발신하였습니다.", "exist": ${exist}}`;
      return {
        statusCode: 200,
        body: responseBody,
      };
    } else {
      let responseBody = `{"statusText": "Accepted","message": "${response.data}"}`;
      return {
        statusCode: 403,
        body: responseBody,
      };
    }
  } catch (error) {
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
