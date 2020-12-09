module.exports = (sequelize, DataTypes) =>
  sequelize.define("communityGeneralTag", {
    index: {
      type: DataTypes.INTEGER,
    },
  });
