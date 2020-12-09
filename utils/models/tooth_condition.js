module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "tooth_condition",
    {
      img_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      orthodonitics_YN: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      tooth_shape: {
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
