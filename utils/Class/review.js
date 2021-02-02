const Sequelize = require("sequelize");

const reviewIncludeAttributes = function (userId) {
  return [
    [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.createdAt,NOW()))`), "createdDiff(second)"],
    [Sequelize.literal(`(SELECT ROUND((starRate_cost + starRate_treatment + starRate_service)/3,1))`), "AVGStarRate"],
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
    [Sequelize.literal(`IF((SELECT COUNT(*) FROM reviewBills where reviewBills.reviewId=review.id AND reviewBills.deletedAt IS NULL)>0,TRUE,FALSE)`), "verifyBills"],
    [
      Sequelize.literal(
        "(SELECT JSON_ARRAYAGG((SELECT treatment_items.name FROM treatment_items where review_treatment_items.treatmentItemId = treatment_items.id ORDER BY review_treatment_items.index ASC)) FROM review_treatment_items WHERE review_treatment_items.reviewId = review.id AND review_treatment_items.deletedAt IS NULL)"
      ),
      "reviewTreatmentTags",
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
        attributes: ["id", "nickname", "profileImg"],
      },
      {
        model: db.Review_content,
        attributes: ["id", "img_url", "index", "img_before_after", "img_width", "img_height"],
        required: false,
        separate: true,
        where: {
          img_url: {
            [Sequelize.Op.not]: null,
          },
        },
        order: [["index", "ASC"]],
      },
      {
        model: db.Dental_clinic,
        attributes: ["id", "originalName"],
        include: [
          {
            model: db.City,
            attributes: ["id", "fullCityName", "newTownId", "sigungu"],
          },
        ],
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
        [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.createdAt,NOW()))`), "createdDiff(second)"],
        [
          Sequelize.literal(
            "(SELECT GROUP_CONCAT(description ORDER BY review_contents.index ASC SEPARATOR ',') FROM review_treatment_items WHERE review_contents.reviewId = review.id AND review_contents.deletedAt IS NULL)"
          ),
          "reviewDescriptions",
        ],
      ],
    },
    include: reviewIncludeModels(db, "detail"),
    order: [
      ["TreatmentItems", db.Review_treatment_item, "index", "ASC"],
      ["review_contents", "index", "ASC"],
    ],
  });
  if (review) {
    const reviewComments = await review.getReview_comments({
      attributes: ["id", "description", "createdAt", "updatedAt", "userId", [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review_comment.createdAt,NOW()))`), "createdDiff(second)"]],
      include: [
        {
          model: db.User,
          attributes: ["id", "nickname", "profileImg"],
        },
        {
          model: db.Review_comment,
          as: "Replys",
          attributes: ["id", "description", "createdAt", "updatedAt", "userId", [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review_comment.createdAt,NOW()))`), "createdDiff(second)"]],
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
    order: [orderQuery, ["TreatmentItems", db.Review_treatment_item, "index", "ASC"]],
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
    ],
    limit: limitQuery,
    offset: offsetQuery,
  });
};

module.exports.getKeywordSearchAll = async function (db, userId, query, clusterQuery, limitQuery, offsetQuery, order) {
  var orderQuery;
  if (order === "createdAt") {
    orderQuery = ["createdAt", "DESC"];
  } else {
    orderQuery = [
      Sequelize.literal("(((SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)*3)+ (SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)) DESC"),
    ];
  }
  var residenceClincQuery;
  if (clusterQuery === undefined) {
    // 함수 호출시 x에 해당하는 인수가 전달되지 않은 경우
    residenceClincQuery = { id: { [Sequelize.Op.not]: null } };
  } else {
    if (clusterQuery.hasOwnProperty("newTownId")) {
      residenceClincQuery = { ["$dental_clinic.city.newTownId$"]: { [Sequelize.Op.eq]: clusterQuery.newTownId } };
    } else {
      residenceClincQuery = { ["$dental_clinic.city.sigungu$"]: { [Sequelize.Op.eq]: clusterQuery.sigungu } };
    }
  }
  console.log("residenceClincQuery:", residenceClincQuery);
  return this.findAll({
    where: {
      [Sequelize.Op.and]: [
        {
          "$review.userId$": {
            [Sequelize.Op.not]: null,
          },
        },
        residenceClincQuery,
        {
          [Sequelize.Op.or]: [
            {
              "$TreatmentItems.name$": {
                [Sequelize.Op.like]: query,
              },
            },
            {
              "$dental_clinic.originalName$": {
                [Sequelize.Op.like]: query,
              },
            },
            {
              "$dental_clinic.city.fullCityName$": {
                [Sequelize.Op.like]: query,
              },
            },
          ],
        },
      ],
    },
    attributes: {
      include: reviewIncludeAttributes(userId),
    },
    include: [
      {
        model: db.User,
        attributes: ["id", "nickname", "profileImg"],
      },
      {
        model: db.Dental_clinic,
        attributes: ["id", "originalName", "cityId"],
        include: [
          {
            model: db.City,
            attributes: ["id", "fullCityName", "newTownId", "sigungu"],
          },
        ],
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
        required: false,
      },
      {
        model: db.Review_content,
        attributes: ["id", "img_url", "index", "img_before_after", "img_width", "img_height"],
        required: false,
        separate: true,
        where: {
          img_url: {
            [Sequelize.Op.not]: null,
          },
        },
        order: [[["index", "ASC"]]],
      },
    ],
    order: [orderQuery, ["TreatmentItems", db.Review_treatment_item, "index", "ASC"]],
    subQuery: false,
    limit: limitQuery,
    offset: offsetQuery,
  });
};
