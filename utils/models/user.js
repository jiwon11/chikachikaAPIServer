module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "user",
    {
      id: {
        type: DataTypes.CHAR(36),
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      nickname: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      birthdate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      profileImg: {
        type: DataTypes.STRING(200),
        defaultValue: "",
      },
      provider: {
        type: DataTypes.STRING(30),
        defaultValue: "local",
      },
      socialId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      fcmToken: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      certifiedPhoneNumber: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      userProfileImgKeyValue: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      hooks: {
        beforeDestroy: async function (instance, options) {
          const reviews = await instance.getReviews();
          for (const review of reviews) {
            review.userId = null;
            await review.save();
          }
          console.log("after destroy: user's Reviews destroyed");
          const communituies = await instance.getCommunities();
          for (const community of communituies) {
            community.userId = null;
            await community.save();
          }
          console.log("after destroy: user's Cummunity destroyed");
        },
      },
    }
  );
