const { City, User, NewTown, Dental_clinic } = require("../utils/models");
const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");

module.exports.getUserInfo = async function getUserInfo(event) {
  try {
    const user = event.requestContext.authorizer;
    const userId = user.id;
    const userInfo = await User.findOne({
      where: {
        id: userId,
      },
      attributes: ["id", "nickname", "profileImg", "phoneNumber", "gender", "birthdate", "provider"],
      include: [
        {
          model: City,
          as: "Residences",
          attributes: [
            "id",
            "sido",
            "sigungu",
            "emdName",
            [Sequelize.literal("IF(emdName = adCity, CONCAT(sido,' ',sigungu,' ',emdName),CONCAT(sido,' ',sigungu,' ',emdName,'(',adCity,')'))"), "fullCityName"],
          ],
          through: {
            attributes: ["now"],
          },
          include: [
            {
              model: NewTown,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });
    return {
      statusCode: 200,
      body: JSON.stringify(userInfo),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};

module.exports.getUserProfile = async function getUserProfile(event) {
  try {
    const user = event.requestContext.authorizer;
    const userId = user.id;
    const targetUserId = event.queryStringParameters.userId;
    var attributes;
    if (userId === targetUserId) {
      attributes = [
        "id",
        "nickname",
        "profileImg",
        [Sequelize.literal(`IF(user.id="${userId}",true, false)`), "self"],
        [Sequelize.literal(`(SELECT COUNT(*) FROM UserScrapClinics where userId="${userId}")`), "scrapClinicsNum"],
      ];
    } else {
      attributes = ["id", "nickname", "profileImg", [Sequelize.literal(`IF(user.id="${userId}",true, false)`), "self"]];
    }
    const userProfile = await User.findOne({
      where: {
        id: targetUserId,
      },
      attributes: attributes,
      include: [
        {
          model: City,
          as: "Residences",
          attributes: [
            "id",
            "sido",
            "sigungu",
            "emdName",
            [Sequelize.literal("IF(emdName = adCity, CONCAT(sido,' ',sigungu,' ',emdName),CONCAT(sido,' ',sigungu,' ',emdName,'(',adCity,')'))"), "fullCityName"],
          ],
          through: {
            attributes: ["now"],
          },
          include: [
            {
              model: NewTown,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });
    return {
      statusCode: 200,
      body: JSON.stringify(userProfile),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.deleteUser = async function deleteUser(event) {
  try {
    const user = event.requestContext.authorizer;
    const userId = user.id;
    await User.destroy({
      where: {
        id: userId,
      },
      force: true,
      individualHooks: true,
    });
    return {
      statusCode: 204,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
