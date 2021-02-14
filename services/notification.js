const db = require("../utils/models");
const Sequelize = require("sequelize");
module.exports.getNotifications = async function getNotifications(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const type = event.pathParameters.type; //Comment,Like,Event
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      var notifications;
      if (type !== "Event") {
        notifications = await db.Notification.findAll({
          where: {
            notificatedUserId: userId,
            type: type,
          },
          include: [
            {
              model: db.User,
              as: "senders",
              attributes: [
                "id",
                "nickname",
                "profileImg",
                [
                  Sequelize.literal(`CONCAT((SELECT REPLACE(senders.profileImg,'https://s3-ap-northeast-2.amazonaws.com','https://d1lkvafdh6ugy5.cloudfront.net')),'?w=140&h=140&f=jpeg&q=100')`),
                  "img_thumbNail",
                ],
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
      }
      return {
        statusCode: 200,
        body: JSON.stringify(notifications),
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

module.exports.delNotifications = async function delNotifications(event) {
  try {
    const body = JSON.parse(event.body);
    const notificationIds = body.notificationIds;
    console.log(notificationIds);
    await db.Notification.destroy({
      where: {
        id: notificationIds,
      },
    });
    return {
      statusCode: 204,
      body: `{"statusText": "No Content","message": "알림을 삭제하였습니다."}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
