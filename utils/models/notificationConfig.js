module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "notoficationConfig",
    {
      like: {
        type: DataTypes.BOOLEAN,
      },
      comment: {
        type: DataTypes.BOOLEAN,
      },
      timer: {
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
