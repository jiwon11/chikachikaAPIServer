const reviewQueryClass = require("../Class/review");
module.exports = (sequelize, DataTypes) => {
  const review = sequelize.define(
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
      treatmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      totalCost: {
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
  review.getOne = reviewQueryClass.getOne;
  review.getAll = reviewQueryClass.getAll;
  review.getClinicReviewsAll = reviewQueryClass.getClinicReviewsAll;
  return review;
};
