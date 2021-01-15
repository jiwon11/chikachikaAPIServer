const commentQueryClass = require("../Class/comment");

module.exports = (sequelize, DataTypes) => {
  const community_comment = sequelize.define(
    "community_comment",
    {
      description: {
        type: DataTypes.STRING(5000),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
  community_comment.getAll = commentQueryClass.getAll;
  return community_comment;
};
