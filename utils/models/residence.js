module.exports = (sequelize, DataTypes) =>
  sequelize.define("UsersCities", {
    now: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  });
