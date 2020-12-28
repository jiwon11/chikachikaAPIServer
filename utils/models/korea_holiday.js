module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "korea_holiday",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
