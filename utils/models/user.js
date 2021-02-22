const Sequelize = require("sequelize");
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
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      nickname: {
        type: DataTypes.STRING(20),
        allowNull: false,
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
            await review.destroy();
          }
          console.log("after destroy: user's Reviews destroyed");
          const communituies = await instance.getCommunities();
          for (const community of communituies) {
            await community.destroy();
          }
          console.log("after destroy: user's Community destroyed");
          const review_comments = await instance.getReview_comments();
          for (const review_comment of review_comments) {
            await review_comment.destroy();
          }
          await sequelize.query(`DELETE FROM Review_reply WHERE targetUserId = '${instance.id}';`);
          console.log("after destroy: user's Review_comment destroyed");
          const community_comments = await instance.getCommunity_comments();
          for (const community_comment of community_comments) {
            await community_comment.destroy();
          }
          await sequelize.query(`DELETE FROM Community_reply WHERE targetUserId = '${instance.id}';`);
          console.log("after destroy: user's Community_comments destroyed");
          const reports = await instance.getReports();
          for (const report of reports) {
            await report.destroy();
          }
          console.log("after destroy: user's Reports destroyed");
          const search_records = await instance.getSearch_records();
          for (const search_record of search_records) {
            await search_record.destroy();
          }
          console.log("after destroy: user's Search_records destroyed");
          const notifications = await instance.getNotifications();
          for (const notification of notifications) {
            await notification.destroy();
          }
          console.log("after destroy: user's Notifications destroyed");
          const notificationConfig = await instance.getNotificationConfig();
          await notificationConfig.destroy();
          console.log("after destroy: user's NotificationConfig destroyed");
          const appointmentClinics = instance.getAppointmentClinics();
          await instance.removeAppointmentClinics(appointmentClinics);
          console.log("after destroy: user's appointmentClinics destroyed");
          const scrapClinics = await instance.getScrapClinics();
          await instance.removeScrapClinics(scrapClinics);
          console.log("after destroy: user's ScrapClinics destroyed");
          const ScrapReviews = await instance.getScrapReviews();
          await instance.removeScrapReviews(ScrapReviews);
          console.log("after destroy: user's ScrapReviews destroyed");
          const LikeReviews = await instance.getLikeReviews();
          await instance.removeLikeReviews(LikeReviews);
          console.log("after destroy: user's LikeReviews destroyed");
          const ViewedReviews = await instance.getViewedReviews();
          await instance.removeViewedReviews(ViewedReviews);
          console.log("after destroy: user's ViewedReviews destroyed");
          const LikeCommunities = await instance.getLikeCommunities();
          await instance.removeLikeCommunities(LikeCommunities);
          console.log("after destroy: user's LikeCommunities destroyed");
          const ViewedCommunities = await instance.getViewedCommunities();
          await instance.removeViewedCommunities(ViewedCommunities);
          console.log("after destroy: user's ViewedCommunities destroyed");
          const ScrapCommunities = await instance.getScrapCommunities();
          await instance.removeScrapCommunities(ScrapCommunities);
          console.log("after destroy: user's ScrapCommunities destroyed");
          const ReportedClinics = await instance.getReportedClinics();
          await instance.removeReportedClinics(ReportedClinics);
          console.log("after destroy: user's ReportedClinics destroyed");
          const Residences = await instance.getResidences();
          await instance.removeResidences(Residences);
          console.log("after destroy: user's Residences destroyed");
        },
      },
    }
  );
