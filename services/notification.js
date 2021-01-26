const db = require("../utils/models");
const moment = require("moment");
module.exports.getNotifications = async function getNotifications(event) {
  try {
    var timezoneDate = moment().tz(process.env.TZ);
    console.log(timezoneDate.day());
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
              attributes: ["id", "nickname", "profileImg"],
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
