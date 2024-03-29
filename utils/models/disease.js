module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "disease_item",
    {
      technicalName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      usualName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
