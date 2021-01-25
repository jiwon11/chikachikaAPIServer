module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "clinic_report",
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      reason: DataTypes.STRING,
      message: DataTypes.STRING,
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
