module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "review_comment",
    {
      description: {
        type: DataTypes.STRING(5000),
        allowNull: false,
      },
      like_num: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
