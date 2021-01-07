const {
  Dental_clinic,
  City,
  Korea_holiday,
  Dental_subject,
  Review,
  User,
  Review_content,
  Treatment_item,
  Review_treatment_item,
  Review_comment,
  Special_treatment,
  ClinicStaticMap,
  DentalClinicProfileImg,
} = require("../utils/models");
const { sequelize, Sequelize } = require("../utils/models");
const { QueryTypes } = require("sequelize");
const axios = require("axios");
const jwt = require("jsonwebtoken");
var iconv = require("iconv-lite");
const AWS = require("aws-sdk");
const fs = require("fs");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_Access_Key_ID,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  region: "ap-northeast-2",
});

module.exports.detailClinics = async function detailClinics(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { clinicId } = event.queryStringParameters;
    var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const nowTime = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    const day = weekDay[today.getDay()];
    const todayHoliday = await Korea_holiday.findAll({
      where: {
        date: today,
      },
    });
    var result = {};
    const clinic = await Dental_clinic.findOne({
      where: {
        id: clinicId,
      },
      attributes: {
        include: [
          [sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
          day === "Sun" || todayHoliday.length > 0
            ? [sequelize.literal(`holiday_treatment_start_time <= "${nowTime}" AND holiday_treatment_end_time >= "${nowTime}"`), "conclustionNow"]
            : [sequelize.literal(`${day}_Consulation_start_time <= "${nowTime}" AND ${day}_Consulation_end_time >= "${nowTime}"`), "conclustionNow"],
          day !== "Sat" && day !== "Sun" && todayHoliday.length === 0
            ? [sequelize.literal(`weekday_TOL_start <= "${nowTime}" AND weekday_TOL_end >= "${nowTime}"`), "lunchTimeNow"]
            : day !== "Sun" && todayHoliday.length === 0
            ? [sequelize.literal(`sat_TOL_start <= "${nowTime}" AND sat_TOL_end >= "${nowTime}"`), "lunchTimeNow"]
            : [sequelize.literal(`1 != 1`), "lunchNow"],
          [
            sequelize.literal(
              `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1))`
            ),
            "reviewAVGStarRate",
          ],
          [sequelize.literal(`(SELECT ROUND((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id),1))`), "reviewCostAVGStarRate"],
          [sequelize.literal(`(SELECT ROUND((SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id),1))`), "reviewTreatmentAVGStarRate"],
          [sequelize.literal(`(SELECT ROUND((SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id),1))`), "reviewServiceAVGStarRate"],
        ],
      },
      include: [
        {
          model: Dental_subject,
          as: "Subjects",
          attributes: ["name"],
          through: { attributes: ["SpecialistDentist_NUM", "choiceTreatmentDentist_NUM"] },
        },
        {
          model: Special_treatment,
          as: "SpecialTreatments",
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
    });
    const requestUrl = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=300&h=300&center=${clinic.geographLong},${clinic.geographLat}&markers=type:d|size:mid|pos:${clinic.geographLong}%20${clinic.geographLat}&level=16&format=jpg`;
    const [clinicMap, created] = await ClinicStaticMap.findOrCreate({
      where: {
        requestUrl: requestUrl,
        dentalClinicId: clinic.id,
      },
    });
    var clinicStaticMap;
    if (created === false) {
      clinicStaticMap = clinicMap.imgUrl;
    } else {
      console.time("stasticMap API 호출");
      const staticMapResponse = await axios({
        url: requestUrl,
        headers: {
          "X-NCP-APIGW-API-KEY-ID": "n44tammhdm",
          "X-NCP-APIGW-API-KEY": "yCv33j48N7t9uGvh0BPDwcG3Nj7tfKmBH5YQ44wR",
        },
        responseType: "arraybuffer",
      });
      console.timeEnd("stasticMap API 호출");
      var param = {
        Bucket: "chikachika-clinic-static-map",
        Key: `${clinic.name}-static-map.jpg`,
        ACL: "public-read",
        Body: Buffer.from(staticMapResponse.data),
        ContentType: "image/jpg",
      };
      var uploadS3 = await s3.upload(param).promise();
      clinicStaticMap = uploadS3.Location;
      await ClinicStaticMap.update(
        {
          imgUrl: uploadS3.Location,
        },
        {
          where: { id: clinicMap.id },
        }
      );
    }
    const clinicInfoHeader = {
      name: clinic.name,
      originalName: clinic.originalName,
      address: clinic.address,
      telNumber: clinic.telNumber,
      website: clinic.website,
      launchDate: clinic.launchDate,
      reviewNum: clinic.get("reviewNum"),
      conclustionNow: clinic.get("conclustionNow"),
      lunchTimeNow: clinic.get("lunchTimeNow"),
      reviewAVGStarRate: {
        all: clinic.get("reviewAVGStarRate"),
        cost: clinic.get("reviewCostAVGStarRate"),
        treatment: clinic.get("reviewTreatmentAVGStarRate"),
        service: clinic.get("reviewServiceAVGStarRate"),
      },
    };
    const clinicInfoBody = {};
    const clinicTreatmentTime = {
      weekday: {
        weekdayReceiptNotice: clinic.weekday_TOR,
        weekdayLunchTimeNotice: clinic.weekday_TOL_notice,
        mon: {
          treatmentTime: [clinic.Mon_Consulation_start_time, clinic.Mon_Consulation_end_time],
          lunchTime: [clinic.weekday_TOL_start, clinic.weekday_TOL_end],
        },
        tus: {
          treatmentTime: [clinic.Tus_Consulation_start_time, clinic.Tus_Consulation_end_time],
          lunchTime: [clinic.weekday_TOL_start, clinic.weekday_TOL_end],
        },
        wed: {
          treatmentTime: [clinic.Wed_Consulation_start_time, clinic.Wed_Consulation_end_time],
          lunchTime: [clinic.weekday_TOL_start, clinic.weekday_TOL_end],
        },
        thu: {
          treatmentTime: [clinic.Thu_Consulation_start_time, clinic.Thu_Consulation_end_time],
          lunchTime: [clinic.weekday_TOL_start, clinic.weekday_TOL_end],
        },
        fri: {
          treatmentTime: [clinic.Fri_Consulation_start_time, clinic.Fri_Consulation_end_time],
          lunchTime: [clinic.weekday_TOL_start, clinic.weekday_TOL_end],
        },
      },
      sat: {
        weekendReceiptNotice: clinic.Sat_TOR,
        weekendLunchTimeNotice: clinic.sat_TOL_notice,
        weekend_non_consulation_notice: clinic.weekend_non_consulation_notice,
        sat: {
          treatmentTime: [clinic.Sat_Consulation_start_time, clinic.Sat_Consulation_end_time],
          lunchTime: [clinic.sat_TOL_start, clinic.sat_TOL_end],
        },
      },
      sunAndHoliday: {
        weekend_non_consulation_notice: clinic.weekend_non_consulation_notice,
        treatmentTime: [clinic.holiday_treatment_start_time, clinic.holiday_treatment_end_time],
      },
    };
    const clinicLocation = {
      address: clinic.address,
      clinicStaticMap: clinicStaticMap,
    };
    var totalSD = 0;
    clinic.get("Subjects").forEach((subject) => {
      const sdnum = subject.get("Clinic_subject").get("SpecialistDentist_NUM");
      totalSD = totalSD + sdnum;
    });
    const dentistInfo = {
      specialistDentist: totalSD !== 0 ? totalSD : clinic.SD_Num,
      generalDentist: clinic.CD_Num,
      resident: clinic.RE_Num,
      intern: clinic.IN_Num,
    };
    const parkingInfo = {
      parkingAllowNum: clinic.parking_allow_num,
      parkingCost: clinic.parking_cost,
      parkingNotice: clinic.parking_others_notice,
    };
    const clinicReviewImg = await Review_content.findAll({
      attributes: ["id", "img_url", "index", "img_before_after", "createdAt"],
      where: {
        img_url: {
          [Sequelize.Op.not]: null,
        },
      },
      include: [
        {
          model: Review,
          attributes: [],
          where: {
            dentalClinicId: clinic.id,
          },
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["index", "ASC"],
      ],
      limit: 10,
    });
    const clinicProfileImg = await DentalClinicProfileImg.findAll({
      where: {
        dentalClinicId: clinic.id,
      },
      order: [["createdAt", "DESC"]],
    });
    clinicInfoHeader.clinicProfileImg = clinicProfileImg;
    clinicInfoHeader.clinicReviewImg = clinicReviewImg;
    clinicInfoBody.description = clinic.description ? clinic.description : "";
    clinicInfoBody.treatmentTime = clinicTreatmentTime;
    clinicInfoBody.treatmentSubject = clinic.get("Subjects");
    clinicInfoBody.SpecialTreatment = clinic.get("SpecialTreatments");
    clinicInfoBody.dentistInfo = dentistInfo;
    clinicInfoBody.parkingInfo = parkingInfo;
    clinicInfoBody.location = clinicLocation;
    result.clinicInfoHeader = clinicInfoHeader;
    result.clinicInfoBody = clinicInfoBody;
    const reviews = await Review.findAll({
      where: {
        dentalClinicId: clinicId,
      },
      attributes: {
        include: [
          [sequelize.literal(`(SELECT TIMESTAMPDIFF(SECOND,review.updatedAt,NOW()))`), "createdDiff(second)"],
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM review_comments WHERE review_comments.reviewId = review.id AND deletedAt IS null) + (SELECT COUNT(*) FROM Review_reply LEFT JOIN review_comments ON (review_comments.id = Review_reply.commentId) WHERE review_comments.reviewId = review.id)"
            ),
            "reviewCommentsNum",
          ],
          [sequelize.literal("(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id)"), "reviewLikeNum"],
          [sequelize.literal(`(SELECT COUNT(*) FROM Like_Review WHERE Like_Review.likedReviewId = review.id AND Like_Review.likerId = "${userId}")`), "viewerLikedReview"],
          [sequelize.literal(`(SELECT COUNT(*) FROM Scrap WHERE Scrap.scrapedReviewId = review.id AND Scrap.scraperId = "${userId}")`), "viewerScrapedReview"],
          [sequelize.literal("(SELECT COUNT(*) FROM ViewReviews WHERE ViewReviews.viewedReviewId = review.id)"), "reviewViewNum"],
          [
            sequelize.literal(
              "(SELECT GROUP_CONCAT(description ORDER BY review_contents.index ASC SEPARATOR ' ') FROM review_contents WHERE review_contents.reviewId = review.id AND review_contents.deletedAt IS NULL)"
            ),
            "reviewDescriptions",
          ],
        ],
      },
      include: [
        {
          model: User,
          attributes: ["nickname", "profileImg"],
        },
        {
          model: Review_content,
          attributes: ["id", "img_url", "index", "img_before_after"],
          required: false,
          where: {
            img_url: {
              [Sequelize.Op.not]: null,
            },
          },
        },
        {
          model: Dental_clinic,
          attributes: ["id", "name"],
        },
        {
          model: Treatment_item,
          as: "TreatmentItems",
          attributes: ["id", "name"],
          order: [["index", "ASC"]],
          through: {
            model: Review_treatment_item,
            attributes: ["cost", "index"],
          },
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["TreatmentItems", Review_treatment_item, "index", "ASC"],
        ["review_contents", "index", "ASC"],
      ],
    });
    result.reviews = reviews;
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
