const Sequelize = require("sequelize");
const { QueryTypes } = require("sequelize");

module.exports.getAll = async function (db, type, targetId) {
  var comments;
  var commentsNum;
  if (type === "review") {
    [commentsNum, metadata] = await db.sequelize.query(
      `SELECT ((SELECT COUNT(*) FROM review_comments WHERE review_comments.reviewId = ${targetId} AND review_comments.deletedAt IS null) + (SELECT COUNT(*) FROM Review_reply LEFT JOIN review_comments AS replys ON replys.id = Review_reply.replyId LEFT JOIN review_comments AS comments ON comments.id = Review_reply.commentId where comments.reviewId = ${targetId} AND replys.deletedAt IS NULL AND comments.deletedAt IS NULL)) AS commentsNum`
    );
    comments = await this.findAll({
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
    [commentsNum, metadata] = await db.sequelize.literal(
      `SELECT ((SELECT COUNT(*) FROM community_comments WHERE community_comments.communityId = ${targetId} AND deletedAt IS null) + (SELECT COUNT(*) FROM Community_reply LEFT JOIN community_comments AS replys ON replys.id = Community_reply.replyId LEFT JOIN community_comments AS comments ON comments.id = Community_reply.commentId where comments.communityId=${targetId}  AND replys.deletedAt IS NULL AND comments.deletedAt IS NULL)) AS commentsNum`
    );
    comments = await this.findAll({
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
  return { commentsNum: commentsNum[0], comments: comments };
};
