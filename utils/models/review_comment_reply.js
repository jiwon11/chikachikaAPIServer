module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Review_reply",
    {
      targetUserId: {
        type: DataTypes.STRING,
      },
    },
    {
      freezeTableName: true,
    }
  );
