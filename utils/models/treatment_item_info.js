module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "treatment_item_info",
    {
      url: {
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
