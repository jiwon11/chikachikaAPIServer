module.exports = (sequelize, DataTypes) =>
  sequelize.define("community_treatment", {
    index: {
      type: DataTypes.INTEGER,
    },
  });
