const Sequelize = require("sequelize");
const cloudFrontUrl = process.env.cloudFrontUrl;
const reviewIncludeAttributes = function (userId) {
  return [
    [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.createdAt,NOW()))`), "createdDiff(second)"],
    [
      Sequelize.literal(
        "(SELECT GROUP_CONCAT(description ORDER BY review_contents.index ASC SEPARATOR ',') FROM review_contents WHERE review_contents.reviewId = review.id AND review_contents.deletedAt IS NULL)"
      ),
      "reviewDescriptions",
    ],
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
    [Sequelize.literal(`IF((SELECT COUNT(*) FROM reviewBills where reviewBills.reviewId=review.id AND reviewBills.deletedAt IS NULL)>0,TRUE,FALSE)`), "verifyBills"],
    [
      Sequelize.literal(
        "(SELECT JSON_ARRAYAGG((SELECT treatment_items.usualName FROM treatment_items where review_treatment_items.treatmentItemId = treatment_items.id ORDER BY review_treatment_items.index ASC)) FROM review_treatment_items WHERE review_treatment_items.reviewId = review.id AND review_treatment_items.deletedAt IS NULL)"
      ),
      "reviewTreatmentTags",
    ],
    [
      Sequelize.literal(
        "(SELECT JSON_ARRAYAGG((SELECT disease_items.usualName FROM disease_items where review_disease_items.diseaseItemId = disease_items.id ORDER BY review_disease_items.index ASC)) FROM review_disease_items WHERE review_disease_items.reviewId = review.id AND review_disease_items.deletedAt IS NULL)"
      ),
      "reviewDiseaseTags",
    ],
  ];
};
module.exports.reviewIncludeAttributes = reviewIncludeAttributes;

const reviewIncludeModels = function (db, viewType, query, tagCategory, tagId, clusterQuery, appendModels) {
  var includeModels;
  var residenceClincQuery;
  if (clusterQuery === undefined) {
    residenceClincQuery = { id: { [Sequelize.Op.not]: null } };
  } else {
    residenceClincQuery = clusterQuery;
  }
  console.log("residenceClincQuery:", residenceClincQuery);
  if (viewType === "list") {
    includeModels = [
      {
        model: db.User,
        attributes: [
          "id",
          "nickname",
          "profileImg",
          "userProfileImgKeyValue",
          [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("userProfileImgKeyValue"), "?w=150&h=150&f=png&q=100"), "img_thumbNail"],
        ],
      },
      {
        model: db.Review_content,
        attributes: [
          "id",
          "img_url",
          "img_name",
          [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("img_name"), "?w=686&h=700&f=jpeg&q=100"), "img_thumbNail"],
          "index",
          "img_before_after",
          "img_width",
          "img_height",
        ],
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
        attributes: ["id", "originalName", "cityId"],
        include: [
          {
            model: db.City,
            attributes: {
              exclude: ["geometry", "createdAt"],
            },
            where: residenceClincQuery,
          },
        ],
        required: true,
      },
      {
        model: db.Treatment_item,
        as: "TreatmentItems",
        attributes: ["id", "usualName"],
        order: [["index", "ASC"]],
        through: {
          model: db.Review_treatment_item,
          attributes: ["cost", "index"],
        },
      },
      {
        model: db.Disease_item,
        as: "DiseaseItems",
        attributes: ["id", "usualName"],
        order: [["index", "ASC"]],
        through: {
          model: db.Review_disease_item,
          attributes: ["index"],
        },
      },
    ];
    if (appendModels) {
      includeModels.push(appendModels);
    }
    if (query) {
      console.log("query:", query, "//", "tagCategory:", tagCategory);
      if (tagCategory === "city") {
        if (tagId === "") {
          let modelIdx = includeModels.findIndex((model) => model.model === db.Dental_clinic);
          includeModels[modelIdx].where = {
            local: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          };
        } else {
          let modelIdx = includeModels.findIndex((model) => model.model === db.Dental_clinic);
          includeModels[modelIdx].include[0].where = {
            id: tagId,
          };
        }
      } else if (tagCategory === "treatment") {
        let modelIdx = includeModels.findIndex((model) => model.as === "TreatmentItems");
        includeModels[modelIdx].where = {
          [Sequelize.Op.or]: [
            {
              usualName: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
            {
              technicalName: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
          ],
        };
      } else if (tagCategory === "clinic") {
        let modelIdx = includeModels.findIndex((model) => model.model === db.Dental_clinic);
        includeModels[modelIdx].where = {
          id: tagId,
        };
      } else if (tagCategory === "disease") {
        let modelIdx = includeModels.findIndex((model) => model.as === "DiseaseItems");
        includeModels[modelIdx].where = {
          [Sequelize.Op.or]: [
            {
              usualName: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
            {
              technicalName: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
          ],
        };
      }
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
        include: [
          {
            model: db.DentalClinicProfileImg,
            limit: 1,
            order: [["represent", "DESC"]],
          },
        ],
      },
      {
        model: db.Review_content,
      },
      {
        model: db.Treatment_item,
        as: "TreatmentItems",
        attributes: ["id", "usualName"],
        through: {
          model: db.Review_treatment_item,
          attributes: ["cost", "index"],
        },
      },
      {
        model: db.Disease_item,
        as: "DiseaseItems",
        attributes: ["id", "usualName"],
        order: [["index", "ASC"]],
        through: {
          model: db.Review_disease_item,
          attributes: ["index"],
        },
      },
    ];
    if (appendModels) {
      includeModels.push(appendModels);
    }
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
    attributes: { include: reviewIncludeAttributes(userId) },
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
          attributes: [
            "id",
            "nickname",
            "profileImg",
            "userProfileImgKeyValue",
            [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("user.userProfileImgKeyValue"), "?w=140&h=140&f=jpeg&q=100"), "img_thumbNail"],
          ],
        },
        {
          model: db.Review_comment,
          as: "Replys",
          attributes: ["id", "description", "createdAt", "updatedAt", "userId", [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review_comment.createdAt,NOW()))`), "createdDiff(second)"]],
          include: [
            {
              model: db.User,
              attributes: [
                "id",
                "nickname",
                "profileImg",
                "userProfileImgKeyValue",
                [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("user.userProfileImgKeyValue"), "?w=140&h=140&f=jpeg&q=100"), "img_thumbNail"],
              ],
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
    order: [orderQuery, ["TreatmentItems", db.Review_treatment_item, "index", "ASC"], ["DiseaseItems", db.Review_disease_item, "index", "ASC"]],
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
      ["DiseaseItems", db.Review_disease_item, "index", "ASC"],
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
      ["DiseaseItems", db.Review_disease_item, "index", "ASC"],
    ],
    limit: limitQuery,
    offset: offsetQuery,
  });
};

module.exports.getKeywordSearchAll = async function (db, userId, query, tagCategory, tagId, clusterQuery, limitQuery, offsetQuery, order) {
  var orderQuery;
  if (order === "createdAt") {
    orderQuery = ["createdAt", "DESC"];
  } else {
    orderQuery = [
      Sequelize.literal("(((SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)*3)+ (SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)) DESC"),
    ];
  }
  return this.findAll({
    where: {
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: reviewIncludeAttributes(userId),
    },
    include: reviewIncludeModels(db, "list", query, tagCategory, tagId, clusterQuery, undefined),
    order: [orderQuery, ["TreatmentItems", db.Review_treatment_item, "index", "ASC"], ["DiseaseItems", db.Review_disease_item, "index", "ASC"]],
    limit: limitQuery,
    offset: offsetQuery,
    subQuery: false,
  });
};
