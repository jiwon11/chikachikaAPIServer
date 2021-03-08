module.exports = (sequelize, DataTypes) =>
  sequelize.define("community_disease", {
    index: {
      type: DataTypes.INTEGER,
    },
  });
