const express = require("express");
const multer = require("multer");
const moment = require("moment");
const sequelize = require("sequelize");
const { User, Review, Review_content, Dental_clinic, Treatment_item, Community, Community_img, Symptom_item, GeneralTag } = require("../../../utils/models");
const { getUserInToken } = require("../middlewares");

const router = express.Router();

const userProfileUpload = multer();
// CRUD example
router.get("/", getUserInToken, async (req, res, next) => {
  console.log(req.user);
  res.send("get all users");
});

router.get("/:nickname/reviews", getUserInToken, async (req, res, next) => {
  try {
    const viewUserId = req.user.id;
    const targetUserNickname = req.params.nickname;
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const order = req.query.order === "createdAt" ? "createdAt" : "popular";
    const userWroteReviews = await Review.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM review_comments WHERE review_comments.reviewId = review.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Review_reply LEFT JOIN review_comments ON (review_comments.id = Review_reply.commentId) WHERE review_comments.reviewId = review.id)"
            ),
            "reviewCommentsNum",
          ],
          [sequelize.literal("(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)"), "reviewLikeNum"],
          [sequelize.literal(`(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id AND Like_Review.likerId = "${req.user.id}")`), "viewerLikedReview"],
          [sequelize.literal("(SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)"), "reviewViewNum"],
          [
            sequelize.literal("(SELECT GROUP_CONCAT(description ORDER BY review_contents.index ASC SEPARATOR ' ') FROM review_contents WHERE review_contents.reviewId = review.id)"),
            "reviewDescriptions",
          ],
        ],
      },
      include: [
        {
          model: User,
          attributes: ["nickname", "profileImg"],
          where: {
            nickname: targetUserNickname,
          },
        },
        {
          model: Review_content,
          attributes: ["id", "img_url", "index", "img_before_after"],
          required: false,
          where: {
            img_url: {
              [sequelize.Op.not]: null,
            },
          },
        },
        {
          model: Dental_clinic,
          attributes: ["id", "name"],
        },
        {
          model: Treatment_item,
          as: "TreatmentItems",
          attributes: ["name"],
          through: {
            attributes: ["cost"],
          },
        },
      ],
      limit: limit,
      offset: offset,
      order: [
        [order, "DESC"],
        ["review_contents", "index", "ASC"],
      ],
    });
    return res.status(200).json(userWroteReviews);
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

router.get("/:nickname/communities", getUserInToken, async (req, res, next) => {
  try {
    const viewUserId = req.user.id;
    const targetUserNickname = req.params.nickname;
    const type = req.query.type === "All" ? ["Question", "FreeTalk"] : [req.query.type];
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    const order = req.query.order === "createdAt" ? "createdAt" : "popular";
    const userWrotecommunityPosts = await Community.findAll({
      where: {
        type: type,
      },
      attributes: {
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Community_reply LEFT JOIN community_comments ON (community_comments.id = Community_reply.commentId) WHERE community_comments.communityId = community.id)"
            ),
            "postCommentsNum",
          ],
          //[sequelize.literal("(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null)"), "postCommentsCount"],
          [sequelize.literal("(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)"), "postLikeNum"],
          [sequelize.literal(`(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id AND Like_Community.likerId = "${req.user.id}")`), "viewerLikeCommunityPost"],
          [sequelize.literal("(SELECT COUNT(*) FROM ViewCommunities WHERE ViewCommunities.viewedCommunityId = community.id)"), "postViewNum"],
        ],
      },
      include: [
        {
          model: User,
          attributes: ["nickname", "profileImg"],
          where: {
            nickname: targetUserNickname,
          },
        },
        {
          model: Community_img,
          attributes: ["id", "img_originalname", "img_mimetype", "img_filename", "img_url", "img_size", "img_index"],
        },
        {
          model: Dental_clinic,
          as: "Clinics",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
        {
          model: Treatment_item,
          as: "TreatmentItems",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
        {
          model: Symptom_item,
          as: "SymptomItems",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
        {
          model: GeneralTag,
          as: "GeneralTags",
          attributes: ["name"],
          through: {
            attributes: ["index"],
          },
        },
      ],
      order: [
        [order, "DESC"],
        ["community_imgs", "img_index", "ASC"],
      ],
      offset: offset,
      limit: limit,
    });
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
    const profileImg = req.body.profileImg | (req.body.birthdate !== "") ? req.body.profileImg : undefined;
    if (nickname) {
      const uniqNickname = await User.findOne({
        where: {
          nickname: nickname,
        },
        attributes: ["id", "nickname"],
      });
      if (uniqNickname.id !== userId) {
        return res.status(403).json({
          statusCode: 403,
          body: { statusText: "Unaccepted", message: "이미 있는 닉네임입니다." },
        });
      }
    }
    await User.update(
      {
        nickname: nickname,
        gender: gender,
        birthdate: birthdate,
        profileImg: profileImg,
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
    return res.status(500).json({
      statusCode: 500,
      body: { statusText: "Server Error", message: error.message },
    });
  }
});

module.exports = router;
