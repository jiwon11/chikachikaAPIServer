const Sequelize = require("sequelize");

const reviewIncludeAttributes = function (userId) {
  return [
    [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.updatedAt,NOW()))`), "createdDiff(second)"],
    [
      Sequelize.literal(
        "(SELECT COUNT(*) FROM review_comments WHERE review_comments.reviewId = review.id AND review_comments.deletedAt IS null) + (SELECT COUNT(*) FROM Review_reply LEFT JOIN review_comments AS replys ON replys.id = Review_reply.replyId LEFT JOIN review_comments AS comments ON comments.id = Review_reply.commentId where comments.reviewId=review.id AND replys.deletedAt IS NULL AND comments.deletedAt IS NULL)"
      ),
      "reviewCommentsNum",
    ],
    [Sequelize.literal("(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)"), "reviewLikeNum"],
    [Sequelize.literal(`(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id AND Like_Review.likerId = "${userId}")`), "viewerLikedReview"],
    [Sequelize.literal(`(SELECT COUNT(*) FROM Scrap WHERE Scrap.scrapedReviewId = review.id AND Scrap.scraperId = "${userId}")`), "viewerScrapedReview"],
    [Sequelize.literal("(SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)"), "reviewViewNum"],
    [
      Sequelize.literal(
        "(SELECT GROUP_CONCAT(description ORDER BY review_contents.index ASC SEPARATOR ' ') FROM review_contents WHERE review_contents.reviewId = review.id AND review_contents.deletedAt IS NULL)"
      ),
      "reviewDescriptions",
    ],
  ];
};
module.exports.reviewIncludeAttributes = reviewIncludeAttributes;

const reviewIncludeModels = function (db, viewType, appendModels) {
  var includeModels;
  if (viewType === "list") {
    includeModels = [
      {
        model: db.User,
        attributes: ["nickname", "profileImg"],
      },
      {
        model: db.Review_content,
        attributes: ["id", "img_url", "index", "img_before_after"],
        required: false,
        where: {
          img_url: {
            [Sequelize.Op.not]: null,
          },
        },
      },
      {
        model: db.Dental_clinic,
        attributes: ["id", "name", "originalName"],
      },
      {
        model: db.Treatment_item,
        as: "TreatmentItems",
        attributes: ["id", "name"],
        order: [["index", "ASC"]],
        through: {
          model: db.Review_treatment_item,
          attributes: ["cost", "index"],
        },
      },
    ];
    if (appendModels) {
      includeModels.push(appendModels);
    }
  } else if (viewType === "detail") {
    includeModels = [
      {
        model: db.User,
        attributes: ["nickname", "profileImg"],
      },
      {
        model: db.Dental_clinic,
        attributes: ["name", "address", "originalName"],
      },
      {
        model: db.Review_content,
      },
      {
        model: db.Treatment_item,
        as: "TreatmentItems",
        attributes: ["id", "name"],
        through: {
          model: db.Review_treatment_item,
          attributes: ["cost", "index"],
        },
      },
    ];
  }
  return includeModels;
};
module.exports.reviewIncludeModels = reviewIncludeModels;

module.exports.getOne = async function (db, reviewId, userId) {
  const review = await this.findOne({
    where: {
      id: reviewId,
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: [
        [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.updatedAt,NOW()))`), "createdDiff(second)"],
        [
          Sequelize.literal(
            "(SELECT COUNT(*) FROM review_comments WHERE review_comments.reviewId = review.id AND review_comments.deletedAt IS null) + (SELECT COUNT(*) FROM Review_reply LEFT JOIN review_comments AS replys ON replys.id = Review_reply.replyId LEFT JOIN review_comments AS comments ON comments.id = Review_reply.commentId where comments.reviewId=review.id AND replys.deletedAt IS NULL AND comments.deletedAt IS NULL)"
          ),
          "reviewCommentsNum",
        ],
      ],
    },
    include: reviewIncludeModels(db, "detail"),
    order: [
      ["review_contents", "index", "ASC"],
      ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
    ],
  });
  if (review) {
    const reviewComments = await review.getReview_comments({
      attributes: ["id", "description", "createdAt", "updatedAt", "userId", [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review_comment.updatedAt,NOW()))`), "createdDiff(second)"]],
      include: [
        {
          model: db.User,
          attributes: ["id", "nickname", "profileImg"],
        },
        {
          model: db.Review_comment,
          as: "Replys",
          attributes: ["id", "description", "createdAt", "updatedAt", "userId", [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review_comment.updatedAt,NOW()))`), "createdDiff(second)"]],
          include: [
            {
              model: db.User,
              attributes: ["id", "nickname", "profileImg"],
            },
          ],
        },
      ],
    });
    const reviewLikeNum = await review.countLikers();
    const reviewViewerNum = await review.countViewers();
    const viewer = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (viewer.id !== review.userId) {
      await review.addViewer(viewer);
    }
    const viewerLikeReview = await review.hasLikers(viewer);
    const viewerScrapReview = await review.hasScrapers(viewer);
    const result = {
      reviewBody: review,
      reviewViewerNum: reviewViewerNum,
      reviewComments: reviewComments,
      reviewLikeNum: reviewLikeNum,
      viewerLikeReview: viewerLikeReview,
      viewerScrapReview: viewerScrapReview,
    };
    return result;
  } else {
    return null;
  }
};

module.exports.getAll = async function (db, userId, order, limit, offset) {
  var orderQuery;
  if (order === "createdAt") {
    orderQuery = ["createdAt", "DESC"];
  } else {
    orderQuery = [
      Sequelize.literal("(((SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)*3)+ (SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)) DESC"),
    ];
  }
  return await this.findAll({
    where: {
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: reviewIncludeAttributes(userId),
    },
    include: reviewIncludeModels(db, "list"),
    limit: limit,
    offset: offset,
    order: [orderQuery, ["TreatmentItems", db.Review_treatment_item, "index", "ASC"], ["review_contents", "index", "ASC"]],
  });
};

module.exports.getClinicReviewsAll = async function (db, clinicId, userId, limitQuery, offsetQuery) {
  return await this.findAll({
    where: {
      dentalClinicId: clinicId,
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: reviewIncludeAttributes(userId),
    },
    include: reviewIncludeModels(db, "list"),
    order: [
      ["createdAt", "DESC"],
      ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
      ["review_contents", "index", "ASC"],
    ],
    limit: limitQuery,
    offset: offsetQuery,
  });
};

module.exports.getUserReviewsAll = async function (db, targetUserId, userId, limitQuery, offsetQuery) {
  return await this.findAll({
    where: {
      userId: {
        [Sequelize.Op.and]: {
          [Sequelize.Op.not]: null,
          [Sequelize.Op.eq]: targetUserId,
        },
      },
    },
    attributes: {
      include: reviewIncludeAttributes(userId),
    },
    include: reviewIncludeModels(db, "list"),
    order: [
      ["createdAt", "DESC"],
      ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
      ["review_contents", "index", "ASC"],
    ],
    limit: limitQuery,
    offset: offsetQuery,
  });
};
