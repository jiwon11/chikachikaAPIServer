module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Community_reply",
    {
      targetUser: {
        type: DataTypes.STRING,
      },
    },
    {
      freezeTableName: true,
    }
  );
