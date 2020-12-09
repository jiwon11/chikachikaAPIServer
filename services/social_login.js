const { User } = require("../utils/models");
const jwt = require("jsonwebtoken");

module.exports.handler = async function social_login(event) {
  const { phoneNumber, nickname, fcmToken, provider, certifiedPhoneNumber, email, socialId, birthdate, profileImg, gender } = JSON.parse(event.body);
  try {
    const overlapSocialUser = await User.findOne({
      where: {
        email: email,
        provider: provider,
      },
      attributes: ["email", "provider"],
    });
    if (overlapSocialUser) {
      let responseBody = `{"statusText": "Unaccepted","message": "${provider}로 이미 가입 되어있는 이메일입니다."}`;
      return {
        statusCode: 403,
        body: responseBody,
      };
    }
    const user = await User.create({
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
    let responseBody = `{"token": "${token}","statusText": "Accepted","message": "사용자 토큰이 발급되었습니다."}`;
    return {
      statusCode: 200,
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
