module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "clinicStaticMap",
    {
      imgUrl: {
        type: DataTypes.STRING,
      },
      requestUrl: {
        type: DataTypes.STRING,
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