const { User, NotificationConfig } = require("../utils/models");
const jwt = require("jsonwebtoken");

module.exports.updateNotificationConfig = async function updateNotificationConfig(event) {
  try {
    const user = event.requestContext.authorizer;
    const requestBody = JSON.parse(event.body);
    const likeValue = requestBody.like;
    const commentValue = requestBody.comment;
    const eventValue = requestBody.event;
    if (user) {
      await NotificationConfig.update(
        {
          like: likeValue === "true",
          comment: commentValue === "true",
          event: eventValue === "true",
        },
        {
          where: {
            userId: user.id,
          },
        }
      );
      return {
        statusCode: 200,
        body: `{"statusText": "OK", "message": "${user.nickname}님의 알림설정을 수정하였습니다."}`,
      };
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized", "message": "해당 아이디의 사용자를 찾을 수 없습니다."}`,
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
