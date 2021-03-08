module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "review_disease_item",
    {
      index: {
        type: DataTypes.INTEGER,
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
