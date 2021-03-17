const { verifyPhoneNumberFunc } = require("../utils/verify");
const { User, NotificationConfig, City } = require("../utils/models");
const jwt = require("jsonwebtoken");
const cloudFrontUrl = process.env.cloudFrontUrl;

/**
 ### 핸드폰 번호 인증을 통해 로그인(로컬)을 진행하는 함수
 * 해당 함수를 진행하기 위해서는 sendTokenToPhoneNumber를 반드시 먼저 수행하여야 함.
 * @param {string} userPhoneNumber 사용자의 핸드폰 번호
 * @param {string} token 사용자에게 보내진 문자 인증번호
 * @returns {JSON} Response 인증번호와 핸드폰 번호의 확인 여부
 */
module.exports.handler = async function signInUser(event) {
  const { userPhoneNumber, token, fcmToken } = JSON.parse(event.body);
  try {
    const user = await User.findOne({
      where: {
        phoneNumber: userPhoneNumber,
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
    const isValidPhoneNumber = await verifyPhoneNumberFunc(userPhoneNumber, token);
    if (isValidPhoneNumber.statusCode === 200) {
      console.log(user.dataValues.id);
      await user.update({
        fcmToken: fcmToken,
      });
      const token = jwt.sign({ id: user.dataValues.id }, process.env.JWT_SECRET, { expiresIn: "1y" });
      let responseBody = {
        statusText: "Accepted",
        message: "사용자 토큰이 발급되었습니다.",
        token: token,
        user: {
          userId: user.id,
          userNickname: user.nickname,
          userProfileImg: user.profileImg,
          img_thumbNail: user.userProfileImgKeyValue === null ? null : `${cloudFrontUrl}${user.userProfileImgKeyValue}?w=140&h=140&f=jpeg&q=100`,
          userResidences: user.Residences,
        },
      };
      return {
        statusCode: 200,
        body: JSON.stringify(responseBody),
      };
    } else {
      let responseBody = `{"statusText": "Unaccepted","message": "인증번호가 틀립니다."}`;
      return {
        statusCode: 401,
        body: responseBody,
      };
    }
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};
