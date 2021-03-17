module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Community_reply",
    {
      targetUserId: {
        type: DataTypes.STRING,
      },
    },
    {
      freezeTableName: true,
    }
  );
