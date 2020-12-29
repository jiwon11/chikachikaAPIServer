const { User, NotificationConfig, City } = require("../utils/models");
const jwt = require("jsonwebtoken");

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
            as: "Cities",
            attributes: ["sido", "sigungu", "emdName"],
            through: {
              attributes: [],
            },
          },
        ],
      });
    }
    if (overlapSocialUser) {
      const token = jwt.sign({ id: overlapSocialUser.id }, process.env.JWT_SECRET, { expiresIn: "1y" });
      let responseBody = `{"token": "${token}","statusText": "Accepted","message": "사용자 토큰이 발급되었습니다.", "user":{"userId": "${user.id}", "userNickname":"${
        user.nickname
      }", "userProfileImg":"${user.profileImg}", "userPhoneNumber":"${user.phoneNumber}", "userGender":"${user.gender}", "userBirthdate":"${user.birthdate}", "userProvider":"${
        user.provider
      }","userResidences": ${JSON.stringify(user.Cities)}}}`;
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
      timer: true,
    });
    const city = await City.findOne({
      attributes: ["id", "emdName"],
      where: {
        id: cityId,
      },
    });
    await user.addCities(city);
    const token = jwt.sign(user.dataValues.id, process.env.JWT_SECRET, { expiresIn: "1y" });
    const userResidences = await user.getCities({
      attributes: ["sido", "sigungu", "emdName"],
      joinTableAttributes: [],
    });
    let responseBody = `{"token": "${token}","statusText": "Accepted","message": "사용자 토큰이 발급되었습니다.", "user":{"userId": "${user.id}", "userNickname":"${
      user.nickname
    }", "userProfileImg":"${user.profileImg}", "userPhoneNumber":"${user.phoneNumber}", "userGender":"${user.gender}", "userBirthdate":"${user.birthdate}", "userProvider":"${
      user.provider
    }","userResidences": ${JSON.stringify(userResidences)}}}`;
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
