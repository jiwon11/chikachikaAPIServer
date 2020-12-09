module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "report",
    {
      reason: DataTypes.STRING,
      message: DataTypes.STRING,
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
