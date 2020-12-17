const { User } = require("../utils/models");
const jwt = require("jsonwebtoken");

module.exports.socialUserCheck = async function socialUserCheck(event) {
  try {
    const { provider, email } = JSON.parse(event.body);
    const overlapSocialUser = await User.findOne({
      where: {
        email: email,
        provider: provider,
      },
      attributes: ["id", "email", "provider"],
    });
    if (overlapSocialUser) {
      const token = jwt.sign(overlapSocialUser.dataValues.id, process.env.JWT_SECRET, { expiresIn: "1y" });
      let responseBody = `{"token": "${token}","statusText": "Accepted","message": "소셜 로그인되었습니다."}`;
      return {
        statusCode: 200,
        body: responseBody,
      };
    } else {
      let responseBody = `{"statusText": "Unaccepted","message": "가압된 소셜 회원이 없습니다."}`;
      return {
        statusCode: 401,
        body: responseBody,
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};

module.exports.handler = async function social_login(event) {
  console.log(event.body);
  const { phoneNumber, nickname, fcmToken, provider, certifiedPhoneNumber, email, socialId, birthdate, profileImg, gender } = JSON.parse(event.body);
  try {
    const user = await User.create({
      email: email,
      phoneNumber: phoneNumber,
      nickname: nickname,
      provider: provider,
      socialId: socialId,
      birthdate: new Date(birthdate),
      profileImg: profileImg,
      gender: gender,
      fcmToken: fcmToken,
      certifiedPhoneNumber: certifiedPhoneNumber === "true",
    });
    const token = jwt.sign(user.dataValues.id, process.env.JWT_SECRET, { expiresIn: "1y" });
    let responseBody = `{"token": "${token}","statusText": "Accepted","message": "소셜 계정으로 회원가입 후, 사용자 토큰이 발급되었습니다."}`;
    return {
      statusCode: 201,
      body: responseBody,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};
