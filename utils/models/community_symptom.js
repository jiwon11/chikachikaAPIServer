module.exports = (sequelize, DataTypes) =>
  sequelize.define("community_symptom", {
    index: {
      type: DataTypes.INTEGER,
    },
  });
