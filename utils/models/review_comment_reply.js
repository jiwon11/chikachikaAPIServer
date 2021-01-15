module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Review_reply",
    {
      targetUser: {
        type: DataTypes.STRING,
      },
    },
    {
      freezeTableName: true,
    }
  );
