module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "clinicStaticMap",
    {
      imgUrl: {
        type: DataTypes.STRING(1000),
      },
      requestUrl: {
        type: DataTypes.STRING(1000),
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
