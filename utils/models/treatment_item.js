module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "treatment_item",
    {
      technicalName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      usualName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      engTechnicalName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
