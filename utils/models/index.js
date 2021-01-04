"use strict";

const Sequelize = require("sequelize");
const config = require("../../utils/config/config")["development"];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require("./user")(sequelize, Sequelize);
db.Dental_clinic = require("./dental_clinic")(sequelize, Sequelize);
db.Dentist = require("./dentist")(sequelize, Sequelize);
db.Review = require("./review")(sequelize, Sequelize);
db.Review_comment = require("./review_comment")(sequelize, Sequelize);
db.Review_content = require("./review_content")(sequelize, Sequelize);
db.Review_treatment_item = require("./review_treatment_item")(sequelize, Sequelize);
db.Appointment = require("./appointment")(sequelize, Sequelize);
db.Brush_condition = require("./brush_condition")(sequelize, Sequelize);
db.Clinic_report = require("./clinic_report")(sequelize, Sequelize);
db.Community_comment = require("./community_comment")(sequelize, Sequelize);
db.Community_img = require("./community_img")(sequelize, Sequelize);
db.Community = require("./community")(sequelize, Sequelize);
db.Dental_subject = require("./dental_subject")(sequelize, Sequelize);
db.Notification = require("./notification")(sequelize, Sequelize);
db.Report = require("./report")(sequelize, Sequelize);
db.Search_record = require("./search_record")(sequelize, Sequelize);
db.Symptom_item = require("./symptom_item")(sequelize, Sequelize);
db.Tooth_condition = require("./tooth_condition")(sequelize, Sequelize);
db.Treatment_item_info = require("./treatment_item_info")(sequelize, Sequelize);
db.Treatment_item = require("./treatment_item")(sequelize, Sequelize);
db.Daily_symptom = require("./daily_symptom")(sequelize, Sequelize);
db.Phone_verify = require("./phone_verify")(sequelize, Sequelize);
db.NotificationConfig = require("./notificationConfig")(sequelize, Sequelize);
db.Timer = require("./timer")(sequelize, Sequelize);
db.GeneralTag = require("./generalTag")(sequelize, Sequelize);
db.Community_dental_clinic = require("./community_dental_clinic")(sequelize, Sequelize);
db.Community_symptom = require("./community_symptom")(sequelize, Sequelize);
db.Community_treatment = require("./community_treatment")(sequelize, Sequelize);
db.CommunityGeneralTag = require("./communityGeneralTag")(sequelize, Sequelize);
db.CommunityCityTag = require("./communityCityTag")(sequelize, Sequelize);
db.City = require("./city")(sequelize, Sequelize);
db.Korea_holiday = require("./korea_holiday")(sequelize, Sequelize);
db.Clinic_subject = require("./clinic_subject")(sequelize, Sequelize);
db.Special_treatment = require("./specialTreatment")(sequelize, Sequelize);
/*사용자와 타이머 관걔형 */
db.User.hasMany(db.Timer, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Timer.belongsTo(db.User);
/*사용자와 치아 상태 관걔형 */
db.User.hasMany(db.Tooth_condition, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Tooth_condition.belongsTo(db.User);
/*사용자와 칫솔 상태 관걔형 */
db.User.hasMany(db.Brush_condition, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Brush_condition.belongsTo(db.User);
/*사용자와 치과 관계형 - 예약*/
db.User.belongsToMany(db.Dental_clinic, {
  foreignKey: "userId",
  as: "AppointmentClinics",
  through: db.Appointment,
  onDelete: "CASCADE",
});
db.Dental_clinic.belongsToMany(db.User, {
  foreignKey: "dentalClinicId",
  as: "AppointmentUsers",
  through: db.Appointment,
  onDelete: "CASCADE",
});
/*예약과 증상항목 관계형*/
db.Appointment.belongsToMany(db.Symptom_item, {
  foreignKey: "appointmentId",
  as: "Symptoms",
  through: "Appointment_symptom_item",
  onDelete: "CASCADE",
});
db.Symptom_item.belongsToMany(db.Appointment, {
  foreignKey: "symptomItemId",
  as: "Appointments",
  through: "Appointment_symptom_item",
  onDelete: "CASCADE",
});
/*예약과 진료항목 관계형*/
db.Appointment.belongsToMany(db.Treatment_item, {
  foreignKey: "appointmentId",
  as: "Treatments",
  through: "Appointment_treatment_item",
  onDelete: "CASCADE",
});
db.Treatment_item.belongsToMany(db.Appointment, {
  foreignKey: "treatmentsItemId",
  as: "Appointments",
  through: "Appointment_treatment_item",
  onDelete: "CASCADE",
});
/*사용자와 리뷰 관계형 */
db.User.hasMany(db.Review, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Review.belongsTo(db.User);
/*치과와 리뷰 관계형 */
db.Dental_clinic.hasMany(db.Review, {
  foreignKey: "dentalClinicId",
  onDelete: "CASCADE",
});
db.Review.belongsTo(db.Dental_clinic);
/*리뷰 콘텐츠와 리뷰 관계형 */
db.Review.hasMany(db.Review_content, {
  foreignKey: "reviewId",
  onDelete: "CASCADE",
});
db.Review_content.belongsTo(db.Review);
/* 진료 항목과 리뷰 관계형*/
db.Review.belongsToMany(db.Treatment_item, {
  foreignKey: "reviewId",
  as: "TreatmentItems",
  through: db.Review_treatment_item,
  onDelete: "CASCADE",
});
db.Treatment_item.belongsToMany(db.Review, {
  foreignKey: "treatmentItemId",
  as: "Reviews",
  through: db.Review_treatment_item,
});
/*리뷰 콘텐츠와 리뷰 관계형*/
db.User.belongsToMany(db.Review, {
  foreignKey: "scraperId",
  as: "ScrapReviews",
  through: "Scrap",
  onDelete: "CASCADE",
});
db.Review.belongsToMany(db.User, {
  foreignKey: "scrapedReviewId",
  as: "Scrapers",
  through: "Scrap",
  onDelete: "CASCADE",
});
/*리뷰 댓글과 사용자 관계형*/
db.User.hasMany(db.Review_comment, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Review_comment.belongsTo(db.User);
/*리뷰 댓글과 리뷰 관계형*/
db.Review.hasMany(db.Review_comment, {
  foreignKey: "reviewId",
  onDelete: "CASCADE",
});
db.Review_comment.belongsTo(db.Review);
/*리뷰 댓글과 답글 관계형*/
db.Review_comment.belongsToMany(db.Review_comment, {
  foreignKey: "commentId",
  as: "Replys",
  through: "Review_reply",
  onDelete: "CASCADE",
});
db.Review_comment.belongsTo(db.Review_comment, {
  foreignKey: "replyId",
  as: "Comments",
  through: "Review_reply",
  onDelete: "CASCADE",
});
/*리뷰 콘텐츠와 리뷰 관계형 -좋아요*/
db.User.belongsToMany(db.Review, {
  foreignKey: "likerId",
  as: "LikeReviews",
  through: "Like_Review",
  onDelete: "CASCADE",
});
db.Review.belongsToMany(db.User, {
  foreignKey: "likedReviewId",
  as: "Likers",
  through: "Like_Review",
  onDelete: "CASCADE",
});
/*리뷰 콘텐츠와 리뷰 관계형 - 조회*/
db.User.belongsToMany(db.Review, {
  foreignKey: "viewerId",
  as: "ViewedReviews",
  through: "ViewReviews",
  onDelete: "CASCADE",
});
db.Review.belongsToMany(db.User, {
  foreignKey: "viewedReviewId",
  as: "Viewers",
  through: "ViewReviews",
  onDelete: "CASCADE",
});
/*치과의사와 진료과목 관계형*/
db.Dentist.belongsToMany(db.Dental_subject, {
  foreignKey: "dentistId",
  as: "Subjects",
  through: "Dentist_subject",
  onDelete: "CASCADE",
});
db.Dental_subject.belongsToMany(db.Dentist, {
  foreignKey: "dentalSubjectId",
  as: "Dentists",
  through: "Dentist_subject",
  onDelete: "CASCADE",
});
/*치과병원과 특수진료항목 관계형*/
db.Dental_clinic.belongsToMany(db.Special_treatment, {
  foreignKey: "dentalClinicId",
  as: "SpecialTreatments",
  through: "Clinic_special_treatment",
  onDelete: "CASCADE",
});
db.Special_treatment.belongsToMany(db.Dental_clinic, {
  foreignKey: "specialTreatmentId",
  as: "Clinics",
  through: "Clinic_special_treatment",
  onDelete: "CASCADE",
});
/*치과의사와 병원 관계형 */
db.Dental_clinic.hasMany(db.Dentist, {
  foreignKey: "dentalClinicId",
  onDelete: "CASCADE",
});
db.Dentist.belongsTo(db.Dental_clinic);
/*치과의사와 커뮤니티글 댓글 관계형 */
db.Dentist.hasMany(db.Community_comment, {
  foreignKey: "dentistId",
  onDelete: "CASCADE",
});
db.Community_comment.belongsTo(db.Dentist);
/*치과와 진료과목 관계형*/
db.Dental_clinic.belongsToMany(db.Dental_subject, {
  foreignKey: "dentalClinicId",
  as: "Subjects",
  through: db.Clinic_subject,
  onDelete: "CASCADE",
});
db.Dental_subject.belongsToMany(db.Dental_clinic, {
  foreignKey: "dentalSubjectId",
  as: "Clinics",
  through: db.Clinic_subject,
  onDelete: "CASCADE",
});
/*진료항목과 진료과목 관계형*/
db.Treatment_item.belongsToMany(db.Dental_subject, {
  foreignKey: "treatmentItemId",
  as: "Subjects",
  through: "Treatment_subject",
  onDelete: "CASCADE",
});
db.Dental_subject.belongsToMany(db.Treatment_item, {
  foreignKey: "dentalSubjectId",
  as: "Treatments",
  through: "Treatment_subject",
  onDelete: "CASCADE",
});
/*진료항목과 진료항목 설명 관계형*/
db.Treatment_item.hasMany(db.Treatment_item_info, {
  foreignKey: "treatmentItemId",
  onDelete: "CASCADE",
});
db.Treatment_item_info.belongsTo(db.Treatment_item);
/*증상과 시용자 관계형*/
db.User.belongsToMany(db.Symptom_item, {
  foreignKey: "userId",
  as: "Symptoms",
  through: db.Daily_symptom,
  onDelete: "CASCADE",
});
db.Symptom_item.belongsToMany(db.User, {
  foreignKey: "symptomItemId",
  as: "Users",
  through: db.Daily_symptom,
  onDelete: "CASCADE",
});
/*증상과 진료항목 관계형*/
db.Treatment_item.belongsToMany(db.Symptom_item, {
  foreignKey: "treatmentItemId",
  as: "Symptoms",
  through: "Symptom_treatment",
  onDelete: "CASCADE",
});
db.Symptom_item.belongsToMany(db.Treatment_item, {
  foreignKey: "symptomItemId",
  as: "Treatments",
  through: "Symptom_treatment",
  onDelete: "CASCADE",
});

/*사용자와 커뮤니티글 관계형 */
db.User.hasMany(db.Community, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Community.belongsTo(db.User);
/*커뮤니티글과 커뮤니티글 콘텐츠 관계형 */
db.Community.hasMany(db.Community_img, {
  foreignKey: "communityId",
  onDelete: "CASCADE",
});
db.Community_img.belongsTo(db.Community);
/*커뮤니티글과 커뮤니티글 댓글 관계형 */
db.Community.hasMany(db.Community_comment, {
  foreignKey: "communityId",
  onDelete: "CASCADE",
});
db.Community_comment.belongsTo(db.Community);
/*사용자와 커뮤니티글 댓글 관계형 */
db.User.hasMany(db.Community_comment, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Community_comment.belongsTo(db.User);
/*커뮤니티글 댓글과 답글 관계형 */
db.Community_comment.belongsToMany(db.Community_comment, {
  foreignKey: "commentId",
  as: "Replys",
  through: "Community_reply",
  onDelete: "CASCADE",
});
db.Community_comment.belongsTo(db.Community_comment, {
  foreignKey: "replyId",
  as: "Comments",
  through: "Community_reply",
  onDelete: "CASCADE",
});
/* 진료 항목과 커뮤니티글 관계형*/
db.Community.belongsToMany(db.Treatment_item, {
  foreignKey: "communityId",
  as: "TreatmentItems",
  through: db.Community_treatment,
  onDelete: "CASCADE",
});
db.Treatment_item.belongsToMany(db.Community, {
  foreignKey: "treatmentItemId",
  as: "Communties",
  through: db.Community_treatment,
  onDelete: "CASCADE",
});
/* 증상 항목과 커뮤니티글 관계형*/
db.Community.belongsToMany(db.Symptom_item, {
  foreignKey: "communityId",
  as: "SymptomItems",
  through: db.Community_symptom,
  onDelete: "CASCADE",
});
db.Symptom_item.belongsToMany(db.Community, {
  foreignKey: "symptomItemId",
  as: "Communties",
  through: db.Community_symptom,
  onDelete: "CASCADE",
});
/* 치과와 커뮤니티글 관계형*/
db.Community.belongsToMany(db.Dental_clinic, {
  foreignKey: "communityId",
  as: "Clinics",
  through: db.Community_dental_clinic,
  onDelete: "CASCADE",
});
db.Dental_clinic.belongsToMany(db.Community, {
  foreignKey: "dentalClinicId",
  as: "Communties",
  through: db.Community_dental_clinic,
  onDelete: "CASCADE",
});
/* 일반 태그와 커뮤니티글 관계형*/
db.Community.belongsToMany(db.GeneralTag, {
  foreignKey: "communityId",
  as: "GeneralTags",
  through: db.CommunityGeneralTag,
  onDelete: "CASCADE",
});
db.GeneralTag.belongsToMany(db.Community, {
  foreignKey: "deneralTagId",
  as: "Communties",
  through: db.CommunityGeneralTag,
  onDelete: "CASCADE",
});
/* 도시 태그와 커뮤니티글 관계형*/
db.Community.belongsToMany(db.City, {
  foreignKey: "communityId",
  as: "CityTags",
  through: db.CommunityCityTag,
  onDelete: "CASCADE",
});
db.City.belongsToMany(db.Community, {
  foreignKey: "cityId",
  as: "Communties",
  through: db.CommunityCityTag,
  onDelete: "CASCADE",
});
/*커뮤니티글과 사용자 관계형 -좋아요*/
db.User.belongsToMany(db.Community, {
  foreignKey: "likerId",
  as: "LikeCommunities",
  through: "Like_Community",
  onDelete: "CASCADE",
});
db.Community.belongsToMany(db.User, {
  foreignKey: "likedCommunityId",
  as: "Likers",
  through: "Like_Community",
  onDelete: "CASCADE",
});
/*커뮤니티글과 사용자 관계형 - 조회*/
db.User.belongsToMany(db.Community, {
  foreignKey: "viewerId",
  as: "ViewedCommunities",
  through: "ViewCommunities",
  onDelete: "CASCADE",
});
db.Community.belongsToMany(db.User, {
  foreignKey: "viewedCommunityId",
  as: "Viewers",
  through: "ViewCommunities",
  onDelete: "CASCADE",
});
/*커뮤니티글과 사용자 관계형 -스크랩*/
db.User.belongsToMany(db.Community, {
  foreignKey: "scraperId",
  as: "ScrapCommunities",
  through: "Scrap_Community",
  onDelete: "CASCADE",
});
db.Community.belongsToMany(db.User, {
  foreignKey: "scrapedCommunityId",
  as: "Scrapers",
  through: "Scrap_Community",
  onDelete: "CASCADE",
});

/*사용자와 신고글 관계형 */
db.User.hasMany(db.Report, {
  foreignKey: "reporterId",
  onDelete: "CASCADE",
});
db.Report.belongsTo(db.User);
/*리뷰와 신고글 관계형 */
db.Review.hasMany(db.Report, {
  foreignKey: "reviewId",
  onDelete: "CASCADE",
});
db.Report.belongsTo(db.Review);
/*커뮤니티글과 신고글 관계형 */
db.Community.hasMany(db.Report, {
  foreignKey: "communityId",
  onDelete: "CASCADE",
});
db.Report.belongsTo(db.Community);
/*병원 신고 관계형*/
db.User.belongsToMany(db.Dental_clinic, {
  foreignKey: "reporterId",
  as: "ReportedClinic",
  through: db.Clinic_report,
  onDelete: "CASCADE",
});
db.Dental_clinic.belongsToMany(db.User, {
  foreignKey: "dentalClinicId",
  as: "Reporters",
  through: db.Clinic_report,
  onDelete: "CASCADE",
});

/* 사용자와 검색기록 관계형*/
db.User.hasMany(db.Search_record, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
db.Search_record.belongsTo(db.User);

/* 사용자와 알림 설정 관계형*/
db.User.hasOne(db.NotificationConfig, {
  foreignKey: "userId",
  sourceKey: "id",
});
db.NotificationConfig.belongsTo(db.User, {
  foreignKey: "userId",
  targetKey: "id",
});

db.Notification.belongsTo(db.User, {
  foreignKey: "notificatedUserId",
  onDelete: "CASCADE",
  as: "notificatedUsers",
});
db.Notification.belongsTo(db.User, {
  foreignKey: "senderId",
  onDelete: "CASCADE",
  as: "senders",
});
db.Notification.belongsTo(db.Review, {
  foreignKey: "reviewId",
  onDelete: "CASCADE",
});
db.Notification.belongsTo(db.Community, {
  foreignKey: "communityId",
  onDelete: "CASCADE",
});
db.Notification.belongsTo(db.Review_comment, {
  foreignKey: "reviewCommentId",
  onDelete: "CASCADE",
});
db.Notification.belongsTo(db.Community_comment, {
  foreignKey: "communityCommentId",
  onDelete: "CASCADE",
});

db.User.belongsToMany(db.City, {
  foreignKey: "resident",
  as: "Cities",
  through: "UsersCities",
  onDelete: "CASCADE",
});

db.City.belongsToMany(db.User, {
  foreignKey: "city",
  as: "Residents",
  through: "UsersCities",
  onDelete: "CASCADE",
});

db.City.hasMany(db.Dental_clinic, {
  foreignKey: "cityId",
  onDelete: "CASCADE",
});
db.Dental_clinic.belongsTo(db.City);
module.exports = db;
