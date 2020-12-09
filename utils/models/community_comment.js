module.exports = (sequelize, DataTypes) =>
  sequelize.define(
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
