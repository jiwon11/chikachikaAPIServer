const db = require("../utils/models");
//const firebase = require("firebase-admin");
/*
var serviceAccount = require("../hooging-f33b0-firebase-adminsdk-82err-5e26adea5b.json");
var commentFcm;
if (!firebase.apps.length) {
  commentFcm = firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://hooging-f33b0.firebaseio.com",
  });
} else {
  commentFcm = firebase.app();
}
*/
module.exports.comment = async function (event) {
  try {
    const body = JSON.parse(event.Records[0].body);
    console.log(body);
    if (body.targetType === "review") {
      await db.Notification.create({
        type: "Comment",
        message: `리뷰에 새로운 댓글이 달렸습니다.`,
        notificatedUserId: body.targetUserId,
        senderId: body.writeCommentUserId,
        reviewId: body.reviewId,
        reviewCommentId: body.commentId,
      });
    } else {
      await db.Notification.create({
        type: "Comment",
        message: `수다방 게시글에 새로운 댓글이 달렸습니다.`,
        notificatedUserId: body.targetUserId,
        senderId: body.writeCommentUserId,
        communityId: body.communityId,
        communityCommentId: body.commentId,
      });
    }
    const userNotifyConfig = await db.NotificationConfig.findOne({
      where: {
        userId: body.targetUserId,
      },
    });
    if (userNotifyConfig.comment === true) {
      const targetId = body.targetType === "review" ? body.reviewId : body.communityId;
      const message = {
        notification: {
          title: body.targetType === "review" ? "리뷰 댓글" : "커뮤니티 댓글",
          body: body.targetType === "review" ? `리뷰에 새로운 댓글이 달렸습니다.` : `게시글에 새로운 댓글이 달렸습니다.`,
        },
        data: { targetType: `${body.targetType}`, targetId: `${targetId}`, commentId: `${body.commentId}`, type: "comment" },
        token: body.targetUserFcmToken,
      };
      /*
      commentFcm
        .messaging()
        .send(message)
        .then((response) => {
          // Response is a message ID string.
          console.log("Successfully sent message:", response);
        })
        .catch(async (error) => {
          console.log("Error sending message:", error);
          return res.status(404).json({
            message: "Comment FCM Post Error",
            error: error.message,
          });
        });
        */
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Task Worker PULL successfully",
        input: event,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};
