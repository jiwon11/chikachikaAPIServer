const express = require("express");
const { getUserInToken } = require("../middlewares");
const multer = require("multer");
//const firebase = require("firebase-admin");
const { User, Review, Review_comment, Community, Community_comment, NotificationConfig, Notification, Sequelize } = require("../../../utils/models");
const router = express.Router();

const multerBody = multer();
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
const pushNotification = async (type, commentOrReply, target, userId, targetType) => {
  const userNotifyConfig = await NotificationConfig.findOne({
    where: {
      userId: target.userId,
    },
  });
  if (type === "comment") {
    if (userNotifyConfig.comment === true) {
      var message;
      message = {
        notification: {
          title: targetType === "review" ? "리뷰 댓글" : "커뮤니티 댓글",
          body: targetType === "review" ? `리뷰에 새로운 댓글이 달렸습니다.` : `게시글에 새로운 댓글이 달렸습니다.`,
        },
        data: { targetType: `${targetType}`, targetId: `${target.id}`, commentId: `${commentOrReply.id}`, type: "comment" },
        token: target.user.fcmToken,
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
    if (targetType === "review") {
      await Notification.create({
        type: "Comment",
        message: `리뷰에 새로운 댓글이 달렸습니다.`,
        userId: target.user.id,
        notificatedUserId: target.user.id,
        senderId: userId,
        reviewId: target.id,
      });
    } else {
      await Notification.create({
        type: "Comment",
        message: `게시글에 새로운 댓글이 달렸습니다.`,
        userId: target.user.id,
        notificatedUserId: target.user.id,
        senderId: userId,
        communityId: target.id,
      });
    }
  } else if (type === "reply") {
    if (userNotifyConfig.comment === true) {
      var message = {
        notification: {
          title: "답글 알림",
          body: `댓글에 새로운 답글이 달렸습니다.`,
        },
        data: { targetType: `${targetType}`, targetId: `${target.reviewId}`, commentId: `${target.id}`, type: "reply" },
        token: target.user.fcmToken,
      };
      /*
      commentFcm
        .messaging()
        .send(message)
        .then((response) => {
          // Response is a message ID string.
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
        */
    }
    if (targetType === "review") {
      await Notification.create({
        type: "Reply",
        message: `댓글에 새로운 답글이 달렸습니다.`,
        notificatedUserId: target.user.id,
        senderId: userId,
        reviewId: target.review.id,
        reviewCommentId: target.id,
      });
    }
  } else {
    await Notification.create({
      type: "Reply",
      message: `댓글에 새로운 답글이 달렸습니다.`,
      notificatedUserId: target.user.id,
      senderId: userId,
      communityId: target.review.id,
      communityCommentId: target.id,
    });
  }
};

router.post("/", getUserInToken, multerBody.none(), async (req, res, next) => {
  //localhost:3000/comment?type=review&commentId=1
  try {
    const userId = req.user.id;
    const description = req.body.description;
    const type = req.query.type;
    if (type === "review") {
      const reviewId = req.query.reviewId;
      const review = await Review.findOne({
        where: {
          id: reviewId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
        include: [
          {
            model: User,
          },
        ],
      });
      if (review) {
        const comment = await Review_comment.create({
          userId: userId,
          reviewId: review.id,
          description: description,
        });
        await pushNotification("comment", comment, review, userId, "review"); //type, comment, target, userId
        const reviewComments = await Review_comment.findAll({
          where: {
            reviewId: reviewId,
          },
          attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Review_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "리뷰를 찾을 수 없습니다." },
        });
      }
    } else if (type === "community") {
      const postId = req.query.postId;
      const post = await Community.findOne({
        where: {
          id: postId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
        include: [
          {
            model: User,
          },
        ],
      });
      if (post) {
        const comment = await Community_comment.create({
          userId: userId,
          communityId: postId,
          description: description,
        });
        await pushNotification("comment", comment, post, userId, "community"); //type, comment, target, userId
        const communityComments = await Community_comment.findAll({
          where: {
            communityId: postId,
          },
          attributes: ["id", "description", "createdAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Community_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(201).json(communityComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "게시글을 찾을 수 없습니다." },
        });
      }
    } else {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 타입입니다." },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.put("/", getUserInToken, multerBody.none(), async (req, res, next) => {
  try {
    const commentId = req.query.commentId;
    const type = req.query.type;
    if (type === "review") {
      const comment = await Review_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await Review_comment.update(
          {
            description: req.body.description,
          },
          {
            where: {
              id: comment.id,
            },
          }
        );
        const reviewComments = await Review_comment.findAll({
          where: {
            reviewId: comment.reviewId,
          },
          attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Review_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "해당 ID를 가진 댓글이 없습니다." },
        });
      }
    } else if (type === "community") {
      const comment = await Community_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await Community_comment.update(
          {
            description: req.body.description,
          },
          {
            where: {
              id: comment.id,
            },
          }
        );
        const communityComments = await Community_comment.findAll({
          where: {
            communityId: comment.communityId,
          },
          attributes: ["id", "description", "createdAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Community_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(communityComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "해당 ID를 가진 댓글이 없습니다." },
        });
      }
    } else {
      return res.status(404).json({
        statusCode: 404,
        body: { statusText: "Not Found", message: "해당 ID를 가진 댓글이 없습니다." },
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.delete("/", getUserInToken, multerBody.none(), async (req, res, next) => {
  try {
    const commentId = req.query.commentId;
    const type = req.query.type;
    if (type === "review") {
      const comment = await Review_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await Review_comment.destroy({
          where: {
            id: comment.id,
          },
        });
        const reviewComments = await Review_comment.findAll({
          where: {
            reviewId: comment.reviewId,
          },
          attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Review_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "해당 ID를 가진 댓글이 없습니다." },
        });
      }
    } else if (type === "community") {
      const comment = await Community_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await Community_comment.destroy({
          where: {
            id: comment.id,
          },
        });
        const communityComments = await Community_comment.findAll({
          where: {
            communityId: comment.communityId,
          },
          attributes: ["id", "description", "createdAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Community_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(communityComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "해당 ID를 가진 댓글이 없습니다." },
        });
      }
    } else {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 타입입니다." },
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.post("/reply", getUserInToken, multerBody.none(), async (req, res, next) => {
  //localhost:8001/comment/reply?type=review&commentId=1
  try {
    const userId = req.user.id;
    const commentId = req.query.commentId;
    const description = req.body.description;
    const type = req.query.type;
    if (type === "review") {
      const comment = await Review_comment.findOne({
        where: {
          id: commentId,
        },
        include: [
          { model: User },
          {
            model: Review,
            include: [
              {
                model: User,
              },
            ],
          },
        ],
      });
      if (comment) {
        const reply = await Review_comment.create({
          userId: userId,
          description: description,
        });
        await comment.addReply(reply);
        await pushNotification("reply", reply, comment, userId, "review"); //type, comment, target, userId
        const reviewComments = await Review_comment.findAll({
          where: {
            reviewId: comment.reviewId,
          },
          attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Review_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "댓글을 찾을 수 없습니다." },
        });
      }
    } else if (type === "community") {
      const comment = await Community_comment.findOne({
        where: {
          id: commentId,
        },
        include: [
          { model: User },
          {
            model: Community,
            include: [
              {
                model: User,
              },
            ],
          },
        ],
      });
      if (comment) {
        const reply = await Community_comment.create({
          userId: userId,
          description: description,
        });
        await comment.addReply(reply);
        await pushNotification("reply", reply, comment, userId, "community"); //type, comment, target, userId
        const communityComments = await Community_comment.findAll({
          where: {
            communityId: comment.communityId,
          },
          attributes: ["id", "description", "createdAt", "userId"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname", "profileImg"],
            },
            {
              model: Community_comment,
              as: "Replys",
              attributes: ["id", "description", "createdAt", "userId"],
              through: {
                attributes: [],
              },
              include: [
                {
                  model: User,
                  attributes: ["id", "nickname", "profileImg"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        return res.status(200).json(communityComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "댓글을 찾을 수 없습니다." },
        });
      }
    } else {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 타입입니다." },
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/lists", getUserInToken, async (req, res, next) => {
  try {
    const type = req.query.type;
    if (type === "community") {
      const postId = req.query.postId;
      const communityComments = await Community_comment.findAll({
        where: {
          communityId: postId,
        },
        attributes: ["id", "description", "createdAt", "userId"],
        include: [
          {
            model: User,
            attributes: ["id", "nickname", "profileImg"],
          },
          {
            model: Community_comment,
            as: "Replys",
            attributes: ["id", "description", "createdAt", "userId"],
            through: {
              attributes: [],
            },
            include: [
              {
                model: User,
                attributes: ["id", "nickname", "profileImg"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return res.status(200).json(communityComments);
    } else if (type === "reviews") {
      const reviewId = req.query.reviewId;
      const reviewComments = await Review_comment.findAll({
        where: {
          reviewId: reviewId,
        },
        attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
        include: [
          {
            model: User,
            attributes: ["id", "nickname", "profileImg"],
          },
          {
            model: Review_comment,
            as: "Replys",
            attributes: ["id", "description", "createdAt", "updatedAt", "userId"],
            through: {
              attributes: [],
            },
            include: [
              {
                model: User,
                attributes: ["id", "nickname", "profileImg"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return res.status(200).json(reviewComments);
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

module.exports = router;
