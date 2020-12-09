module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "review_treatment_item",
    {
      cost: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
