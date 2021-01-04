module.exports = (sequelize, DataTypes) =>
  sequelize.define("communityCityTag", {
    index: {
      type: DataTypes.INTEGER,
    },
  });
