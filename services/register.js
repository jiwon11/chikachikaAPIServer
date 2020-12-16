const { phone } = require("../utils/verify");
const { Sequelize } = require("sequelize");
const ApiError = require("../utils/error");
const { User, Phone_verify, NotificationConfig } = require("../utils/models");
const jwt = require("jsonwebtoken");
const { Base64 } = require("js-base64");

const verifyPhoneNumberFunc = async function (userPhoneNumber, token) {
  const verifies = await Phone_verify.findOne({
    where: {
      phoneNumber: userPhoneNumber,
      token: token,
    },
  });
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
  console.log(verifies);
  if (verifies) {
    await verifies.destroy();
    let responseBody = { statusText: "Accepted", message: "인증되었습니다." };
    return {
      statusCode: 200,
      body: responseBody,
    };
  } else {
    let responseBody = { statusText: "Unaccepted", message: "인증번호가 틀립니다." };
    return {
      statusCode: 401,
      body: responseBody,
    };
  }
};

module.exports.verifyPhoneNumberFunc = verifyPhoneNumberFunc;
/**
 ### 사용자가 입력한 핸드폰 번호로 인증번호를 보내는 함수
 * @param {string} userPhoneNumber 사용자의 핸드폰 번호
 * @returns {JSON} Response NCP의 SENS - SMS를 사용한 문자 전송 성공 여부
 */
module.exports.sendTokenToPhoneNumber = async function sendTokenToPhoneNumber(event) {
  const body = JSON.parse(event.body);
  const userPhoneNumber = body.userPhoneNumber;
  const response = await phone(userPhoneNumber);
  return response;
};

/**
 ### sendTokenToPhoneNumber 함수에서 전송한 인증번호를 확인하는 함수
 * @param {string} userPhoneNumber 사용자의 핸드폰 번호
 * @param {string} token 사용자에게 보내진 문자 인증번호
 * @returns {JSON} Response 인증번호와 핸드폰 번호의 확인 여부
 */
module.exports.verifyPhoneNumber = async function verifyPhoneNumber(event) {
  const body = JSON.parse(event.body);
  const userPhoneNumber = body.userPhoneNumber;
  const token = body.token;
  console.log(`body: ${body}`);
  console.log(`userPhoneNumber: ${userPhoneNumber}`);
  console.log(`token: ${token}`);
  const response = verifyPhoneNumberFunc(userPhoneNumber, token);
  return response;
};

/**
 ### 로컬 회원가입(핸드폰 번호를 통해 인증) 함수
 * 해당 함수를 진행하기 위해서는 sendTokenToPhoneNumber를 반드시 먼저 수행하여야 함.
 * @param {string} userPhoneNumber 사용자의 핸드폰 번호
 * @param {string} nickname 사용자 닉네임(자동생성)
 * @param {string} fcmToken 푸시 알림을 위한 FCM token(자동생성)
 * @param {string} provider 회원가입을 위한 소셜 제공자(로컬)
 * @param {boolean} certifiedPhoneNumber 핸드폰 인증을 했는지 여부
 * @return {Object} Response 회원가입 성공 여부
 */
module.exports.handler = async function registerUser(event) {
  try {
    const { userPhoneNumber, nickname, fcmToken, provider, certifiedPhoneNumber } = JSON.parse(event.body);
    const overlapPhoneNumber = await User.findOne({
      where: {
        phoneNumber: userPhoneNumber,
      },
      attributes: ["phoneNumber"],
    });
    if (overlapPhoneNumber) {
      let responseBody = '{"statusText": "Unaccepted","message": "이미 가입 되어있는 전화번호입니다."}';
      return {
        statusCode: 403,
        body: responseBody,
      };
    }
    const user = await User.create({
      phoneNumber: userPhoneNumber,
      nickname: nickname,
      provider: provider,
      fcmToken: fcmToken,
      certifiedPhoneNumber: certifiedPhoneNumber,
    });
    await NotificationConfig.create({
      userId: user.id,
      like: true,
      comment: true,
      timer: true,
    });
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1y" });
    let responseBody = `{"statusText": "Accepted","message": "${user.nickname}님의 회원가입이 완료되었습니다.", "token": "${jwtToken}"}`;
    return {
      statusCode: 201,
      body: responseBody,
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};
