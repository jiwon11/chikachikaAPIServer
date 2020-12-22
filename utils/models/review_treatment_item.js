module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "review_treatment_item",
    {
      cost: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
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
