const { City, User, NewTown, Dental_clinic, NotificationConfig } = require("../utils/models");
const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const cloudFrontUrl = "https://d1lkvafdh6ugy5.cloudfront.net/";

module.exports.getUserInfo = async function getUserInfo(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const userInfo = await User.findOne({
        where: {
          id: userId,
        },
        attributes: [
          "id",
          "nickname",
          "profileImg",
          "phoneNumber",
          "gender",
          "birthdate",
          "provider",
          "userProfileImgKeyValue",
          [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("userProfileImgKeyValue"), "?w=140&h=140&f=jpeg&q=100"), "img_thumbNail"],
        ],
        include: [
          {
            model: NotificationConfig,
            attributes: [
              [Sequelize.literal("(SELECT IF((notificationConfig.like = TRUE) OR (notificationConfig.comment = TRUE) OR (notificationConfig.event = TRUE),true, false))"), "ALOTrue"],
              "like",
              "comment",
              "event",
            ],
          },
          {
            model: City,
            as: "Residences",
            attributes: ["id", "sido", "sigungu", "emdName", "fullCityName"],
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
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
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
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const targetUserId = event.queryStringParameters.userId;
      var attributes;
      if (userId === targetUserId) {
        attributes = [
          "id",
          "nickname",
          "profileImg",
          [Sequelize.literal(`IF(user.id="${userId}",true, false)`), "self"],
          [Sequelize.literal(`(SELECT COUNT(*) FROM appointments where userId="${userId}" AND deletedAt IS NULL)`), "appointmentsNum"],
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
            attributes: ["id", "sido", "sigungu", "emdName", "fullCityName"],
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
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
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
    const userId = event.requestContext.authorizer.principalId;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
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
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
