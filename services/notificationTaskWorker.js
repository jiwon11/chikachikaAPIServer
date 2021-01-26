const db = require("../utils/models");
const AWS = require("aws-sdk");
const S3 = new AWS.S3();
const firebase = require("firebase-admin");
process.env.TZ = "Asia/Seoul";

AWS.config.update({
  accessKeyId: process.env.AWS_Access_Key_ID,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  region: "ap-northeast-1",
});
const s3getFile = async function (params) {
  try {
    const file = await S3.getObject(params).promise();
    var objectString = Buffer.from(file.Body);
    var serviceAccountJson = JSON.parse(objectString.toString());
    return serviceAccountJson;
  } catch (err) {
    console.log(err);
  }
};

const pushFcm = async function (message) {
  try {
    var serviceAccount = await s3getFile({
      Bucket: process.env.fcmBucketName, // your bucket name,
      Key: process.env.fcmkey, // path to the object you're looking for
    });
    var commentFcm;
    if (!firebase.apps.length) {
      commentFcm = firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: "https://chika-chika.firebaseio.com",
      });
    } else {
      commentFcm = firebase.app();
    }
    const response = await commentFcm.messaging().send(message);
    console.log("Successfully sent message:", response);
    return {
      statusCode: 200,
      body: `{"statusText": "OK","message": "Successfully sent message: ${response}"}`,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Server Error","message": "${error.message}"}`,
    };
  }
};

module.exports.comment = async function (event) {
  try {
    var timezoneDate = new Date(Date.now());
    console.log(timezoneDate.toISOString());
    const body = JSON.parse(event.Records[0].body);
    console.log(body);
    if (body.targetUserId !== body.writeCommentUserId) {
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
        console.log(message);
        const fcmResponse = await pushFcm(message);
        console.log(fcmResponse);
      }
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

module.exports.reply = async function (event) {
  try {
    var timezoneDate = new Date(Date.now());
    console.log(timezoneDate.toISOString());
    const body = JSON.parse(event.Records[0].body);
    console.log(body);
    const {
      replyId,
      commentId,
      communityCommentId,
      reviewId,
      communityId,
      writeCommentUserId,
      commentTargetUserId,
      postTargetUserId,
      commentTargetUserFcmToken,
      postTargetUserFcmToken,
      description,
      targetType,
    } = body;
    if (body.targetType === "review") {
      if (postTargetUserId !== writeCommentUserId) {
        await db.Notification.create({
          type: "Comment",
          message: `리뷰글에 새로운 답글이 달렸습니다.`,
          notificatedUserId: postTargetUserId,
          senderId: writeCommentUserId,
          reviewId: reviewId,
          reviewCommentId: commentId,
        });
      }
      if (commentTargetUserId !== writeCommentUserId) {
        await db.Notification.create({
          type: "Comment",
          message: `리뷰글에 작성한 댓글에 새로운 답글이 달렸습니다.`,
          notificatedUserId: commentTargetUserId,
          senderId: writeCommentUserId,
          reviewId: reviewId,
          reviewCommentId: commentId,
        });
      }
    } else {
      if (postTargetUserId !== writeCommentUserId) {
        await db.Notification.create({
          type: "Comment",
          message: `수다방 게시글에 새로운 댓글이 달렸습니다.`,
          notificatedUserId: postTargetUserId,
          senderId: writeCommentUserId,
          communityId: communityId,
          communityCommentId: commentId,
        });
      }
      if (postTargetUserId !== writeCommentUserId) {
        await db.Notification.create({
          type: "Comment",
          message: `수다방 글에 작성한 댓글에 새로운 답글이 달렸습니다.`,
          notificatedUserId: postTargetUserId,
          senderId: writeCommentUserId,
          communityId: communityId,
          communityCommentId: commentId,
        });
      }
    }
    if (postTargetUserId !== postTargetUserId) {
      const postTargetUser = await db.NotificationConfig.findOne({
        where: {
          userId: postTargetUserId,
        },
      });
      if (postTargetUser.comment === true) {
        const targetId = targetType === "review" ? reviewId : communityId;
        const message = {
          notification: {
            title: targetType === "review" ? "리뷰 댓글" : "커뮤니티 댓글",
            body: targetType === "review" ? `리뷰에 새로운 댓글이 달렸습니다.` : `게시글에 새로운 댓글이 달렸습니다.`,
          },
          data: { targetType: `${targetType}`, targetId: `${targetId}`, commentId: `${commentId}`, replyId: `${replyId}`, type: "comment" },
          token: postTargetUserFcmToken,
        };
        console.log(message);
        const fcmResponse = await pushFcm(message);
        console.log(fcmResponse);
      }
    }
    if (commentTargetUserId !== writeCommentUserId) {
      const commentTargetUser = await db.NotificationConfig.findOne({
        where: {
          userId: commentTargetUserId,
        },
      });
      if (commentTargetUser.comment === true) {
        const targetId = targetType === "review" ? reviewId : communityId;
        const message = {
          notification: {
            title: targetType === "review" ? "리뷰 답글" : "수다방 답글",
            body: targetType === "review" ? `리뷰글에 작성한 댓글에 새로운 답글이 달렸습니다.` : `수다방 글에 작성한 댓글에 새로운 답글이 달렸습니다.`,
          },
          data: { targetType: `${body.targetType}`, targetId: `${targetId}`, commentId: `${body.commentId}`, replyId: `${body.replyId}`, type: "comment" },
          token: commentTargetUserFcmToken,
        };
        console.log(message);
        const fcmResponse = await pushFcm(message);
        console.log(fcmResponse);
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Task Worker PULL successfully",
        input: event,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
