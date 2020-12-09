module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "review",
    {
      starRate_cost: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      starRate_treatment: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      starRate_service: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      certifiedBill: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      hits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      concsulationDate: {
        type: DataTypes.DATEONLY,
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
