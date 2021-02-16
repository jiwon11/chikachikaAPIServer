module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "appointment",
    {
      time: {
        type: DataTypes.DATE,
        allowNullL: false,
        defaultValue: "00:00:00",
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
