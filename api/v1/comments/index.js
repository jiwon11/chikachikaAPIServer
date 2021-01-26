const express = require("express");
const { getUserInToken } = require("../middlewares");
const multer = require("multer");
const db = require("../../../utils/models");
const commentConsumer = require("../../../utils/Class/SQSconsumer").comment;
const replyConsumer = require("../../../utils/Class/SQSconsumer").reply;
const Sequelize = require("sequelize");
const router = express.Router();

const multerBody = multer();

router.post("/", getUserInToken, multerBody.none(), async (req, res, next) => {
  //localhost:3000/comment?type=review&commentId=1
  try {
    const userId = req.user.id;
    const description = req.body.description;
    const type = req.query.type;
    if (type === "review") {
      const reviewId = req.query.reviewId;
      const review = await db.Review.findOne({
        where: {
          id: reviewId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
        include: [
          {
            model: db.User,
          },
        ],
      });
      if (review) {
        const comment = await db.Review_comment.create({
          userId: userId,
          reviewId: review.id,
          description: description,
        });
        //await pushNotification("comment", comment, review, userId, "review"); //type, comment, target, userId
        const commentConsumerBody = {
          commentId: comment.id,
          reviewId: review.id,
          writeCommentUserId: userId,
          targetUserId: review.user.id,
          targetUserFcmToken: review.user.fcmToken,
          description: description,
          targetType: type,
        };
        const pushCommentNotification = await commentConsumer(commentConsumerBody);
        if (pushCommentNotification.statusCode === 200) {
          console.log(JSON.parse(pushCommentNotification.body));
        }
        const reviewComments = await db.Review_comment.getAll(db, "review", reviewId);
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "리뷰를 찾을 수 없습니다." },
        });
      }
    } else if (type === "community") {
      const postId = req.query.postId;
      const post = await db.Community.findOne({
        where: {
          id: postId,
          userId: {
            [Sequelize.Op.not]: null,
          },
        },
        include: [
          {
            model: db.User,
          },
        ],
      });
      if (post) {
        const comment = await db.Community_comment.create({
          userId: userId,
          communityId: postId,
          description: description,
        });
        //await pushNotification("comment", comment, post, userId, "community"); //type, comment, target, userId
        const commentConsumerBody = {
          commentId: comment.id,
          communityId: post.id,
          writeCommentUserId: userId,
          targetUserId: post.user.id,
          targetUserFcmToken: post.user.fcmToken,
          description: description,
          targetType: type,
        };
        const pushCommentNotification = await commentConsumer(commentConsumerBody);
        if (pushCommentNotification.statusCode === 200) {
          console.log(JSON.parse(pushCommentNotification.body));
        }
        const communityComments = await db.Community_comment.getAll(db, "community", postId);
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
      const reviewId = req.query.reviewId;
      const comment = await db.Review_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await db.Review_comment.update(
          {
            description: req.body.description,
          },
          {
            where: {
              id: comment.id,
            },
          }
        );
        const reviewComments = await db.Review_comment.getAll(db, "review", reviewId);
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "해당 ID를 가진 댓글이 없습니다." },
        });
      }
    } else if (type === "community") {
      const postId = req.query.postId;
      const comment = await db.Community_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await db.Community_comment.update(
          {
            description: req.body.description,
          },
          {
            where: {
              id: comment.id,
            },
          }
        );
        const communityComments = await db.Community_comment.getAll(db, "community", postId);
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
      const reviewId = req.query.reviewId;
      const comment = await db.Review_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await db.Review_comment.destroy({
          where: {
            id: comment.id,
          },
        });
        const reviewComments = await db.Review_comment.getAll(db, "review", reviewId);
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "해당 ID를 가진 댓글이 없습니다." },
        });
      }
    } else if (type === "community") {
      const postId = req.query.postId;
      const comment = await db.Community_comment.findOne({
        where: {
          id: commentId,
        },
      });
      if (comment) {
        await db.Community_comment.destroy({
          where: {
            id: comment.id,
          },
        });
        const communityComments = await db.Community_comment.getAll(db, "community", postId);
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
    const targetUserNickname = req.body.targetUserNickname;
    const type = req.query.type;
    if (type === "review") {
      const reviewId = req.query.reviewId;
      const comment = await db.Review_comment.findOne({
        where: {
          id: commentId,
        },
        include: [
          { model: db.User },
          {
            model: db.Review,
            include: [
              {
                model: db.User,
              },
            ],
          },
        ],
      });
      if (comment) {
        const reply = await db.Review_comment.create({
          //reviewId: reviewId,
          userId: userId,
          description: description,
        });
        const targetUser = await db.User.findOne({
          where: {
            nickname: targetUserNickname,
          },
        });
        await comment.addReply(reply, {
          through: {
            targetUserId: targetUser.id,
          },
        });
        //await pushNotification("reply", reply, comment, userId, "review"); //type, comment, target, userId
        const replyConsumerBody = {
          replyId: reply.id,
          commentId: comment.id,
          reviewId: reviewId,
          writeCommentUserId: userId,
          commentTargetUserId: comment.user.id,
          postTargetUserId: comment.review.user.id,
          commentTargetUserFcmToken: comment.user.fcmToken,
          postTargetUserFcmToken: comment.review.user.fcmToken,
          description: description,
          targetType: type,
        };
        const pushReplyNotification = await replyConsumer(replyConsumerBody);
        if (pushReplyNotification.statusCode === 200) {
          console.log(JSON.parse(pushReplyNotification.body));
        }
        const reviewComments = await db.Review_comment.getAll(db, "review", reviewId);
        return res.status(200).json(reviewComments);
      } else {
        return res.status(404).json({
          statusCode: 404,
          body: { statusText: "Not Found", message: "댓글을 찾을 수 없습니다." },
        });
      }
    } else if (type === "community") {
      const postId = req.query.postId;
      const comment = await db.Community_comment.findOne({
        where: {
          id: commentId,
        },
        include: [
          { model: db.User },
          {
            model: db.Community,
            include: [
              {
                model: db.User,
              },
            ],
          },
        ],
      });
      if (comment) {
        const reply = await db.Community_comment.create({
          //communityId: postId,
          userId: userId,
          description: description,
        });
        const targetUser = await db.User.findOne({
          where: {
            nickname: targetUserNickname,
          },
        });
        await comment.addReply(reply, {
          through: {
            targetUserId: targetUser.id,
          },
        });
        //await pushNotification("reply", reply, comment, userId, "community"); //type, comment, target, userId
        const replyConsumerBody = {
          replyId: reply.id,
          commentId: comment.id,
          communityId: postId,
          writeCommentUserId: userId,
          commentTargetUserId: comment.user.id,
          postTargetUserId: comment.community.user.id,
          commentTargetUserFcmToken: comment.user.fcmToken,
          postTargetUserFcmToken: comment.community.user.fcmToken,
          description: description,
          targetType: type,
        };
        const pushReplyNotification = await replyConsumer(replyConsumerBody);
        if (pushReplyNotification.statusCode === 200) {
          console.log(JSON.parse(pushReplyNotification.body));
        }
        const communityComments = await db.Community_comment.getAll(db, "community", postId);
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
    console.log(error);
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
      const communityComments = await db.Community_comment.getAll(db, "community", postId);
      return res.status(200).json(communityComments);
    } else if (type === "review") {
      const reviewId = req.query.reviewId;
      const reviewComments = await db.Review_comment.getAll(db, "review", reviewId);
      return res.status(200).json(reviewComments);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

module.exports = router;
