const { User, NotificationConfig, City } = require("../utils/models");
const jwt = require("jsonwebtoken");
process.env.TZ = "Asia/Seoul";

module.exports.socialUserCheck = async function socialUserCheck(event) {
  try {
    const body = JSON.parse(event.body);
    const provider = body.provider;
    const email = body.email;
    const socialId = body.socialId;
    var overlapSocialUser;
    if (provider === "apple") {
      overlapSocialUser = await User.findOne({
        where: {
          socialId: socialId,
          provider: provider,
        },
        attributes: ["id", "email", "provider"],
      });
    } else {
      overlapSocialUser = await User.findOne({
        where: {
          email: email,
          provider: provider,
        },
        attributes: ["id", "email", "provider"],
        include: [
          {
            model: City,
            as: "Residences",
            attributes: ["id", "sido", "sigungu", "emdName"],
            through: {
              attributes: [],
            },
          },
        ],
      });
    }
    if (overlapSocialUser) {
      const token = jwt.sign({ id: overlapSocialUser.id }, process.env.JWT_SECRET, { expiresIn: "1y" });
      let responseBody = `{"token": "${token}","statusText": "Accepted","message": "사용자 토큰이 발급되었습니다.", "user":{"userId": "${overlapSocialUser.id}", "userNickname":"${
        overlapSocialUser.nickname
      }", "userProfileImg":"${overlapSocialUser.profileImg}", "userPhoneNumber":"${overlapSocialUser.phoneNumber}", "userGender":"${overlapSocialUser.gender}", "userBirthdate":"${
        overlapSocialUser.birthdate
      }", "userProvider":"${overlapSocialUser.provider}","userResidences": ${JSON.stringify(overlapSocialUser.Residences)}}}`;
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
      body: `{"statusText": "Server Error","message": "${error.message}"}`,
    };
  }
};

module.exports.handler = async function social_login(event) {
  console.log(event.body);
  const { phoneNumber, nickname, fcmToken, provider, certifiedPhoneNumber, email, socialId, profileImg, gender, cityId } = JSON.parse(event.body);
  const birthdate = event.body.birthdate | (event.body.birthdate !== "") ? event.body.birthdate : undefined;
  try {
    if (phoneNumber !== "") {
      const overlapPhoneNumber = await User.findOne({
        where: {
          phoneNumber: phoneNumber,
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
    }
    const user = await User.create({
      email: email,
      phoneNumber: phoneNumber,
      nickname: nickname,
      provider: provider,
      socialId: socialId,
      birthdate: birthdate,
      profileImg: profileImg,
      gender: gender,
      fcmToken: fcmToken,
      certifiedPhoneNumber: certifiedPhoneNumber === "true",
    });
    await NotificationConfig.create({
      userId: user.id,
      like: true,
      comment: true,
      event: true,
    });
    const city = await City.findOne({
      attributes: ["id", "emdName"],
      where: {
        id: cityId,
      },
    });
    await user.addResidences(city, {
      through: {
        now: true,
      },
    });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1y" });
    const userResidences = await user.getResidences({
      attributes: ["id", "sido", "sigungu", "emdName"],
      joinTableAttributes: [],
    });
    let responseBody = {
      statusText: "Accepted",
      message: `${user.nickname}님의 회원가입이 완료되었습니다.`,
      token: token,
      user: { userId: user.id, userNickname: user.nickname, userProfileImg: user.profileImg, userResidences: userResidences },
    };
    return {
      statusCode: 201,
      body: JSON.stringify(responseBody),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};
