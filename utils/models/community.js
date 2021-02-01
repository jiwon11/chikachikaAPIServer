const communityQueryClass = require("../Class/community");
module.exports = (sequelize, DataTypes) => {
  const community = sequelize.define(
    "community",
    {
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      wantDentistHelp: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  );
  community.getOne = communityQueryClass.getOne;
  community.getAll = communityQueryClass.getAll;
  community.getUserCommunityPostAll = communityQueryClass.getUserCommunityPostAll;
  community.getKeywordSearchAll = communityQueryClass.getKeywordSearchAll;
  return community;
};
