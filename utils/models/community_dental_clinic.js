module.exports = (sequelize, DataTypes) =>
  sequelize.define("community_dental_clinic", {
    index: {
      type: DataTypes.INTEGER,
    },
  });
