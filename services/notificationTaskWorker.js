const db = require("../utils/models");
const AWS = require("aws-sdk");
const S3 = new AWS.S3();
const firebase = require("firebase-admin");
const p = require("phin");
const reviewQueryClass = require("../utils/Class/review");
const Sequelize = require("sequelize");

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
        databaseURL: process.env.FbDBURL,
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
module.exports.pushFcm = pushFcm;
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
    if (postTargetUserId !== writeCommentUserId) {
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

module.exports.like = async function (event) {
  try {
    const body = JSON.parse(event.Records[0].body);
    console.log(body);
    const { targetId, likeUserId, likeUserNickname, targetUserId, targetUserFcmToken, targetType } = body;
    if (likeUserId !== targetUserId) {
      if (targetType === "review") {
        await db.Notification.create({
          type: "Like",
          message: `회원님의 글을 좋아합니다.`,
          notificatedUserId: targetUserId,
          senderId: likeUserId,
          reviewId: targetId,
        });
      } else {
        await db.Notification.create({
          type: "Like",
          message: `회원님의 글을 좋아합니다.`,
          notificatedUserId: targetUserId,
          senderId: likeUserId,
          communityId: targetId,
        });
      }
      const targetUser = await db.NotificationConfig.findOne({
        where: {
          userId: targetUserId,
        },
      });
      if (targetUser.like === true) {
        const message = {
          notification: {
            title: "",
            body: `${likeUserNickname}님이 회원님의 게시물을 좋아합니다.`,
          },
          data: { targetType: `${targetType}`, targetId: `${targetId}` },
          token: targetUserFcmToken,
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

module.exports.report = async function (event) {
  try {
    const reportMessage = JSON.parse(event.Records[0].body);
    const webhookUri = reportMessage.webhookUri;
    const body = reportMessage.messageBody;
    console.log(webhookUri);
    console.log(body);
    const slackResponse = await p({
      url: webhookUri,
      method: "POST",
      data: body,
    });
    const response = {
      message: "Task Worker PULL successfully",
      input: event,
    };
    console.log(response);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.billsVerify = async function billsVerify(event) {
  try {
    const message = JSON.parse(event.Records[0].body);
    const reviewId = message.reviewId;
    const review = await db.Review.findOne({
      where: {
        id: reviewId,
        userId: {
          [Sequelize.Op.not]: null,
        },
      },
      attributes: { include: reviewQueryClass.reviewIncludeAttributes("") },
      include: reviewQueryClass.reviewIncludeModels(db, "detail", null, null, {
        model: db.ReviewBills,
      }),
      order: [
        ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
        ["review_contents", "index", "ASC"],
      ],
    });
    const apiUrl = process.env.apiUrl;
    const slackMessage = {
      attachments: [
        {
          fallback: `새로운 영수증 리뷰 인증 요청이 접수 되었습니다.`,
          color: "#D00000",
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `새로운 영수증 리뷰 인증 요청이 접수 되었습니다.`,
                emoji: true,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*추천 여부* : ${review.dataValues.recommend} \n *총금액* : ${review.dataValues.totalCost}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*치료항목* : ${review.dataValues.reviewTreatmentTags}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*내용* : ${review.dataValues.reviewDescriptions}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*병원 이름* : ${review.dental_clinic.originalName}, *병원 ID* : ${review.dataValues.dentalClinicId}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*작성자 닉네임* : ${review.user.nickname}, , *작성자 ID* : ${review.dataValues.userId}`,
              },
            },
            {
              type: "image",
              image_url: review.reviewBills ? review.reviewBills[0].dataValues.img_url : null,
              alt_text: "inspiration",
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "승인",
                    emoji: true,
                  },
                  value: "permission",
                  //url: `http://localhost:3000/dev/admin/verifyBills/permission?reviewId=${review.id}`,
                  url: `${apiUrl}/admin/verifyBills/permission?reviewId=${review.id}`,
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "반려",
                    emoji: true,
                  },
                  value: "return",
                  //url: `http://localhost:3000/dev/admin/verifyBills/return?reviewId=${review.id}`,
                  url: `${apiUrl}/admin/verifyBills/return?reviewId=${review.id}`,
                },
              ],
            },
          ],
        },
      ],
    };
    if (review.review_contents.length > 0) {
      review.review_contents.forEach((review_content) => {
        if (review_content.img_url !== null) {
          slackMessage.attachments[0].blocks.push({
            type: "image",
            image_url: review_content.img_url,
            alt_text: "inspiration",
          });
        }
      });
    }
    const slackResponse = await p({
      url: "https://hooks.slack.com/services/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",
      method: "POST",
      data: slackMessage,
    });
    console.log(slackResponse);
    const response = {
      message: "Task Worker PULL successfully",
      input: JSON.stringify(event),
    };
    console.log(response);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.deleteSQSMessage = async function deleteSQSMessage(event) {
  try {
    console.log(event);
    var params = {
      QueueUrl: "STRING_VALUE" /* required */,
      ReceiptHandle: "STRING_VALUE" /* required */,
    };
    sqs.deleteMessage(params, function (err, data) {
      if (err) console.log(err, err.stack);
      // an error occurred
      else console.log(data); // successful response
    });
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
module.exports.deleteFifoSQSMessage = async function deleteFifoSQSMessage(event) {
  try {
    console.log(event);
    var params = {
      QueueUrl: "STRING_VALUE" /* required */,
      ReceiptHandle: "STRING_VALUE" /* required */,
    };
    sqs.deleteMessage(params, function (err, data) {
      if (err) console.log(err, err.stack);
      // an error occurred
      else console.log(data); // successful response
    });
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
