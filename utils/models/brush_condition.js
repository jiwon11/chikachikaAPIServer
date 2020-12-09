module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "brush_condition",
    {
      img_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      forcast_change_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      brush_habit: {
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
