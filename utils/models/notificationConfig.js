module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "notificationConfig",
    {
      like: {
        type: DataTypes.BOOLEAN,
      },
      comment: {
        type: DataTypes.BOOLEAN,
      },
      event: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
