const Sequelize = require("sequelize");
const cloudFrontUrl = process.env.cloudFrontUrl;
const communityIncludeAttributes = function (userId) {
  return [
    [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,community.createdAt,NOW()))`), "createdDiff(second)"],
    [
      Sequelize.literal(
        "(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Community_reply LEFT JOIN community_comments AS replys ON replys.id = Community_reply.replyId LEFT JOIN community_comments AS comments ON comments.id = Community_reply.commentId where comments.communityId=community.id AND replys.deletedAt IS NULL AND comments.deletedAt IS NULL)"
      ),
      "postCommentsNum",
    ],
    //[sequelize.literal("(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null)"), "postCommentsCount"],
    [Sequelize.literal("(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)"), "postLikeNum"],
    [Sequelize.literal(`(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id AND Like_Community.likerId = "${userId}")`), "viewerLikeCommunityPost"],
    [Sequelize.literal(`(SELECT COUNT(*) FROM Scrap_Community WHERE Scrap_Community.scrapedCommunityId = community.id AND Scrap_Community.scraperId = "${userId}")`), "viewerScrapCommunityPost"],
    [Sequelize.literal("(SELECT COUNT(*) FROM ViewCommunities WHERE ViewCommunities.viewedCommunityId = community.id)"), "postViewNum"],
    [
      Sequelize.literal(
        "((SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)*3)+(SELECT COUNT(*) FROM ViewCommunities WHERE ViewCommunities.viewedCommunityId = community.id)"
      ),
      "popular",
    ],
  ];
};
module.exports.communityIncludeAttributes = communityIncludeAttributes;

const communityIncludeModels = function (db, clusterQuery, appendModels) {
  var models = [
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
      model: db.City,
      attributes: {
        exclude: ["geometry"],
      },
      where: clusterQuery,
    },
    {
      model: db.Community_img,
      attributes: [
        "id",
        "img_originalname",
        "img_mimetype",
        "img_filename",
        [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("img_filename"), "?w=248&h=248&f=jpeg&q=100"), "img_thumbNail"],
        "img_url",
        "img_size",
        "img_index",
        "img_width",
        "img_height",
      ],
      order: [["img_index", "ASC"]],
      separate: true,
    },
    {
      model: db.Dental_clinic,
      as: "Clinics",
      attributes: ["id", "name", "originalName"],
      through: {
        attributes: ["index"],
      },
    },
    {
      model: db.Treatment_item,
      as: "TreatmentItems",
      attributes: ["id", "usualName"],
      through: {
        attributes: ["index"],
      },
    },
    {
      model: db.Disease_item,
      as: "DiseaseItems",
      attributes: ["id", "usualName"],
      through: {
        attributes: ["index"],
      },
    },
    {
      model: db.GeneralTag,
      as: "GeneralTags",
      attributes: ["id", "name"],
      through: {
        attributes: ["index"],
      },
    },
    {
      model: db.City,
      as: "CityTags",
      attributes: [
        "id",
        "sido",
        "sigungu",
        "adCity",
        "emdName",
        "relativeAddress",
        "fullCityName",
        [Sequelize.fn("CONCAT", Sequelize.col("CityTags.emdName"), "(", Sequelize.fn("REPLACE", Sequelize.col("CityTags.sigungu"), " ", "-"), ")"), "tagName"],
      ],
      through: {
        attributes: ["index"],
      },
    },
  ];
  if (appendModels) {
    models.push(appendModels);
  }
  return models;
};
module.exports.communityIncludeModels = communityIncludeModels;

module.exports.getOne = async function (db, userId, communityPostId) {
  return await this.findOne({
    where: {
      id: communityPostId,
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: communityIncludeAttributes(userId),
    },
    include: communityIncludeModels(db),
  });
};
module.exports.getAll = async function (db, userId, type, clusterQuery, order, offset, limit) {
  var orderQuery;
  if (order === "createdAt") {
    orderQuery = ["createdAt", "DESC"];
  } else {
    orderQuery = [
      Sequelize.literal(
        "(((SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)*3)+ (SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)) DESC"
      ),
    ];
  }
  return await this.findAll({
    where: {
      type: type,
      cityId: {
        [Sequelize.Op.or]: [
          {
            [Sequelize.Op.is]: null,
          },
          {
            [Sequelize.Op.not]: null,
          },
        ],
      },
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: communityIncludeAttributes(userId),
    },
    include: communityIncludeModels(db, clusterQuery),
    order: [orderQuery],
    offset: offset,
    limit: limit,
  });
};

module.exports.getUserCommunityPostAll = async function (db, type, userId, targetUserId, offsetQuery, limitQuery, orderQuery) {
  return await this.findAll({
    where: {
      type: type,
      userId: {
        [Sequelize.Op.and]: {
          [Sequelize.Op.not]: null,
          [Sequelize.Op.eq]: targetUserId,
        },
      },
    },
    attributes: {
      include: communityIncludeAttributes(userId),
    },
    include: communityIncludeModels(db),
    order: [[orderQuery, "DESC"]],
    offset: offsetQuery,
    limit: limitQuery,
  });
};

module.exports.getKeywordSearchAll = async function (db, communityType, query, userId, clusterQuery, offsetQuery, limitQuery, order) {
  var orderQuery;
  if (order === "createdAt") {
    orderQuery = ["createdAt", "DESC"];
  } else {
    orderQuery = [
      Sequelize.literal(
        "(((SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)*3)+ (SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)) DESC"
      ),
    ];
  }
  return await this.findAll({
    attributes: {
      include: communityIncludeAttributes(userId),
    },
    where: {
      [Sequelize.Op.and]: [
        {
          type: communityType,
        },
        {
          description: {
            [Sequelize.Op.like]: `%${query}%`,
          },
        },
      ],
    },
    include: communityIncludeModels(db, clusterQuery),
    order: [orderQuery],
    limit: limitQuery,
    offset: offsetQuery,
  });
};
