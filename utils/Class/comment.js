const Sequelize = require("sequelize");

module.exports.getAll = async function (db, type, targetId) {
  if (type === "review") {
    return await this.findAll({
      where: {
        reviewId: targetId,
      },
      attributes: ["id", "description", "createdAt", "updatedAt", "userId", [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review_comment.updatedAt,NOW()))`), "createdDiff(second)"]],
      include: [
        {
          model: db.User,
          attributes: ["id", "nickname", "profileImg"],
        },
        {
          model: db.Review_comment,
          as: "Replys",
          attributes: [
            "id",
            "description",
            "createdAt",
            "updatedAt",
            "userId",
            [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,Replys.updatedAt,NOW()))`), "createdDiff(second)"],
            [Sequelize.literal("(SELECT nickname FROM users where users.id=`Replys->Review_reply`.`targetUserId`)"), "targetUserNickname"],
          ],
          through: {
            attributes: [],
          },
          include: [
            {
              model: db.User,
              attributes: ["id", "nickname", "profileImg"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  } else {
    return await this.findAll({
      where: {
        communityId: targetId,
      },
      attributes: ["id", "description", "createdAt", "userId", [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,community_comment.updatedAt,NOW()))`), "createdDiff(second)"]],
      include: [
        {
          model: db.User,
          attributes: ["id", "nickname", "profileImg"],
        },
        {
          model: db.Community_comment,
          as: "Replys",
          attributes: [
            "id",
            "description",
            "createdAt",
            "userId",
            [Sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,Replys.updatedAt,NOW()))`), "createdDiff(second)"],
            [Sequelize.literal("(SELECT nickname FROM users where users.id=`Replys->Community_reply`.`targetUserId`)"), "targetUserNickname"],
          ],
          through: {
            attributes: [],
          },
          include: [
            {
              model: db.User,
              attributes: ["id", "nickname", "profileImg"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
};
