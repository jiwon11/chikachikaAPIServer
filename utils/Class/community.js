const Sequelize = require("sequelize");
module.exports.getOne = async function (db, userId, communityPostId) {
  return await this.findOne({
    where: {
      id: communityPostId,
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: [
        [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,community.updatedAt,NOW()))`), "createdDiff(second)"],
        [
          Sequelize.literal(
            "(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Community_reply LEFT JOIN community_comments ON (community_comments.id = Community_reply.commentId) WHERE community_comments.communityId = community.id)"
          ),
          "postCommentsNum",
        ],
        //[sequelize.literal("(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null)"), "postCommentsCount"],
        [Sequelize.literal("(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id)"), "postLikeNum"],
        [Sequelize.literal(`(SELECT COUNT(*) FROM Like_Community WHERE Like_Community.likedCommunityId = community.id AND Like_Community.likerId = "${userId}")`), "viewerLikeCommunityPost"],
        [Sequelize.literal(`(SELECT COUNT(*) FROM Scrap_Community WHERE Scrap_Community.scrapedCommunityId = community.id AND Scrap_Community.scraperId = "${userId}")`), "viewerScrapCommunityPost"],
        [Sequelize.literal("(SELECT COUNT(*) FROM ViewCommunities WHERE ViewCommunities.viewedCommunityId = community.id)"), "postViewNum"],
      ],
    },
    include: [
      {
        model: db.User,
        attributes: ["nickname", "profileImg"],
      },
      {
        model: db.Community_img,
      },
      {
        model: db.Dental_clinic,
        as: "Clinics",
        attributes: ["id", "name"],
        through: {
          attributes: ["index"],
        },
      },
      {
        model: db.Treatment_item,
        as: "TreatmentItems",
        attributes: ["id", "name"],
        through: {
          attributes: ["index"],
        },
      },
      {
        model: db.Symptom_item,
        as: "SymptomItems",
        attributes: ["id", "name"],
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
          [Sequelize.literal("IF(emdName = adCity, CONCAT(sido,' ',sigungu,' ',emdName),CONCAT(sido,' ',sigungu,' ',emdName,'(',adCity,')'))"), "fullCityName"],
          "relativeAddress",
        ],
        through: {
          attributes: ["index"],
        },
      },
    ],
    order: [["community_imgs", "img_index", "ASC"]],
  });
};
module.exports.getAll = async function (db, userId, type, clusterQuery, order, offset, limit) {
  var orderQuery;
  if (order === "createdAt") {
    orderQuery = [("createdAt", "DESC")];
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
      userId: {
        [Sequelize.Op.not]: null,
      },
    },
    attributes: {
      include: [
        [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,community.updatedAt,NOW()))`), "createdDiff(second)"],
        [
          Sequelize.literal(
            "(SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = community.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Community_reply LEFT JOIN community_comments ON (community_comments.id = Community_reply.commentId) WHERE community_comments.communityId = community.id)"
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
      ],
    },
    include: [
      {
        model: db.User,
        attributes: ["id", "nickname", "profileImg"],
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
        attributes: ["id", "img_originalname", "img_mimetype", "img_filename", "img_url", "img_size", "img_index"],
      },
      {
        model: db.Dental_clinic,
        as: "Clinics",
        attributes: ["id", "name"],
        through: {
          attributes: ["index"],
        },
      },
      {
        model: db.Treatment_item,
        as: "TreatmentItems",
        attributes: ["id", "name"],
        through: {
          attributes: ["index"],
        },
      },
      {
        model: db.Symptom_item,
        as: "SymptomItems",
        attributes: ["id", "name"],
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
          [
            Sequelize.literal(
              "IF(CityTags.emdName = CityTags.adCity, CONCAT(CityTags.sido,' ',CityTags.sigungu,' ',CityTags.emdName),CONCAT(CityTags.sido,' ',CityTags.sigungu,' ',CityTags.emdName,'(',CityTags.adCity,')'))"
            ),
            "fullCityName",
          ],
        ],
        through: {
          attributes: ["index"],
        },
      },
    ],
    order: [orderQuery, ["community_imgs", "img_index", "ASC"]],
    offset: offset,
    limit: limit,
  });
};
