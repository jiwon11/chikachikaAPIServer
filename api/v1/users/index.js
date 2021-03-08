const express = require("express");
const multer = require("multer");
const moment = require("moment");
const Sequelize = require("sequelize");
const db = require("../../../utils/models");
const { getUserInToken } = require("../middlewares");
const reviewQueryClass = require("../../../utils/Class/review");
const communityQueryClass = require("../../../utils/Class/community");
const router = express.Router();

const userProfileUpload = multer();
// CRUD example
router.get("/", getUserInToken, async (req, res, next) => {
  console.log(req.user);
  res.send("get all users");
});

router.get("/:userId/reviews", getUserInToken, async (req, res, next) => {
  try {
    const viewUserId = req.user.id;
    const targetUserId = req.params.userId;
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    //const order = req.query.order === "createdAt" ? "createdAt" : "popular";
    const userWroteReviews = await db.Review.getUserReviewsAll(db, targetUserId, viewUserId, limit, offset);
    return res.status(200).json(userWroteReviews);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/:userId/communities", getUserInToken, async (req, res, next) => {
  try {
    const viewUserId = req.user.id;
    const targetUserId = req.params.userId;
    const type = req.query.type === "All" ? ["Question", "FreeTalk"] : [req.query.type];
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const order = req.query.order === "createdAt" ? "createdAt" : "popular";
    const userWrotecommunityPosts = await db.Community.getUserCommunityPostAll(db, type, viewUserId, targetUserId, offset, limit, order);
    return res.status(200).json(userWrotecommunityPosts);
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.put("/", getUserInToken, userProfileUpload.none(), async (req, res, next) => {
  try {
    console.log(req.body);
    const userId = req.user.id;
    const nickname = req.body.nickname | (req.body.nickname !== "") ? req.body.nickname : undefined;
    const gender = req.body.gender | (req.body.gender !== "") ? req.body.gender : undefined;
    const birthdate = req.body.birthdate | (req.body.birthdate !== "") ? req.body.birthdate : undefined;
    const profileImg = req.body.profileImg | (req.body.profileImg !== "") ? req.body.profileImg : null;
    const userProfileImgKeyValue = req.body.userProfileImgKeyValue | (req.body.userProfileImgKeyValue !== "") ? req.body.userProfileImgKeyValue : null;
    if (nickname) {
      const uniqNickname = await db.User.findOne({
        where: {
          nickname: nickname,
        },
        attributes: ["id", "nickname"],
      });
      if (uniqNickname) {
        return res.status(403).json({
          statusCode: 403,
          body: { statusText: "Unaccepted", message: "이미 있는 닉네임입니다." },
        });
      }
    }
    await db.User.update(
      {
        nickname: nickname,
        gender: gender,
        birthdate: birthdate,
        profileImg: profileImg,
        userProfileImgKeyValue: userProfileImgKeyValue,
      },
      {
        where: {
          id: userId,
        },
      }
    );
    return res.status(200).json({
      statusCode: 200,
      body: { statusText: "Accepted", message: "프로필을 업데이트하였습니다." },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/likes", getUserInToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const type = req.query.type;
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (type === "review") {
      const userLikeReviews = await user.getLikeReviews({
        attributes: {
          include: reviewQueryClass.reviewIncludeAttributes(userId),
        },
        include: reviewQueryClass.reviewIncludeModels(db, "list"),
        limit: limit,
        offset: offset,
        order: [
          [Sequelize.literal("`Like_Review.createdAt`"), "DESC"],
          ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
        ],
      });
      return res.status(200).json(userLikeReviews);
    } else if (type === "community") {
      const userLikeCommunityPosts = await user.getLikeCommunities({
        attributes: {
          include: communityQueryClass.communityIncludeAttributes(userId),
        },
        include: communityQueryClass.communityIncludeModels(db),
        limit: limit,
        offset: offset,
        order: [[Sequelize.literal("`Like_Community.createdAt`"), "DESC"]],
      });
      return res.status(200).json(userLikeCommunityPosts);
    } else {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 글의 타입입니다." },
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

router.get("/scraps", getUserInToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const type = req.query.type;
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (type === "review") {
      const userScrapReviews = await user.getScrapReviews({
        attributes: {
          include: reviewQueryClass.reviewIncludeAttributes(userId),
        },
        include: reviewQueryClass.reviewIncludeModels(db, "list"),
        limit: limit,
        offset: offset,
        order: [
          [Sequelize.literal("`Scrap.createdAt`"), "DESC"],
          ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
        ],
      });
      return res.status(200).json(userScrapReviews);
    } else if (type === "community") {
      const userScrapCommunityPosts = await user.getScrapCommunities({
        attributes: {
          include: communityQueryClass.communityIncludeAttributes(userId),
        },
        include: communityQueryClass.communityIncludeModels(db),
        limit: limit,
        offset: offset,
        order: [[Sequelize.literal("`Scrap_Community.createdAt`"), "DESC"]],
      });
      return res.status(200).json(userScrapCommunityPosts);
    } else {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 글의 타입입니다." },
      });
    }
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/wroteCommentPosts", getUserInToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const type = req.query.type;
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    if (type === "review") {
      const userWroteCommentReviews = await db.Review.findAll({
        where: {
          userId: {
            [Sequelize.Op.not]: null,
          },
          [Sequelize.Op.or]: [
            {
              ["$review_comments.userId$"]: { [Sequelize.Op.eq]: userId },
            },
            { ["$review_comments.Replys.userId$"]: { [Sequelize.Op.eq]: userId } },
          ],
        },
        attributes: {
          include: reviewQueryClass.reviewIncludeAttributes(userId),
        },
        include: reviewQueryClass.reviewIncludeModels(db, "list", undefined, undefined, undefined, undefined, {
          model: db.Review_comment,
          include: [
            {
              model: db.Review_comment,
              as: "Replys",
              attributes: ["id", "userId"],
              through: {
                attributes: [],
              },
            },
          ],
        }),
        limit: limit,
        offset: offset,
        group: ["id", "TreatmentItems.id"],
        order: [
          [{ model: db.Review_comment }, "createdAt", "DESC"],
          ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
        ],
        subQuery: false,
      });
      return res.status(200).json(userWroteCommentReviews);
    } else if (type === "community") {
      const userWroteCommentPosts = await db.Community.findAll({
        where: {
          userId: {
            [Sequelize.Op.not]: null,
          },
          [Sequelize.Op.or]: [
            {
              ["$community_comments.userId$"]: { [Sequelize.Op.eq]: userId },
            },
            { ["$community_comments.Replys.userId$"]: { [Sequelize.Op.eq]: userId } },
          ],
        },
        attributes: {
          include: communityQueryClass.communityIncludeAttributes(userId),
        },
        include: communityQueryClass.communityIncludeModels(db, undefined, undefined, undefined, undefined, {
          model: db.Community_comment,
          attributes: ["id", "userId", "createdAt"],
          include: [
            {
              model: db.Community_comment,
              as: "Replys",
              attributes: ["id", "userId", "createdAt"],
              through: {
                attributes: [],
              },
            },
          ],
        }),
        limit: limit,
        offset: offset,
        group: ["id", "TreatmentItems.id", "GeneralTags.id", "CityTags.id"],
        order: [[{ model: db.Community_comment }, "createdAt", "DESC"]],
        subQuery: false,
      });
      return res.status(200).json(userWroteCommentPosts);
    } else {
      return res.status(400).json({
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 글의 타입입니다." },
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
module.exports = router;
