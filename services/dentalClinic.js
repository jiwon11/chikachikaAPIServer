const db = require("../utils/models");
const { sequelize, Sequelize } = require("../utils/models");
const axios = require("axios");
const AWS = require("aws-sdk");
const moment = require("moment");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_Access_Key_ID,
  secretAccessKey: process.env.AWS_Secret_Access_Key,
  region: "ap-northeast-2",
});

module.exports.detailClinics = async function detailClinics(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    if (userId) {
      const { clinicId } = event.queryStringParameters;
      var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
      const today = moment().tz(process.env.TZ);
      const nowTime = `${today.hour()}:${today.minute()}:${today.second()}`;
      const day = weekDay[today.day()];
      const todayHoliday = await db.Korea_holiday.findAll({
        where: {
          date: today,
        },
      });
      var result = {};
      const clinic = await db.Dental_clinic.findOne({
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
            [sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL AND reviews.recommend IS TRUE)`), "recommendNum"],
          ],
        },
        include: [
          {
            model: db.Dental_subject,
            as: "Subjects",
            attributes: ["name"],
            through: { attributes: ["SpecialistDentist_NUM", "choiceTreatmentDentist_NUM"] },
          },
          {
            model: db.Special_treatment,
            as: "SpecialTreatments",
            attributes: ["name"],
            through: { attributes: [] },
          },
        ],
      });
      const requestUrl = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=343&h=201&center=${clinic.geographLong},${clinic.geographLat}&level=15&scale=2&markers=type:e|icon:https://chikachika-clinic-static-map.s3.ap-northeast-2.amazonaws.com/customMarker/V1_x64_w.png|pos:${clinic.geographLong}%20${clinic.geographLat}`;
      const [clinicMap, created] = await db.ClinicStaticMap.findOrCreate({
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
        console.time("stasticMap S3 저장");
        var param = {
          Bucket: "chikachika-clinic-static-map",
          Key: `${clinic.name}-static-map.png`,
          ACL: "public-read",
          Body: Buffer.from(staticMapResponse.data),
          ContentType: "image/png",
        };
        var uploadS3 = await s3.upload(param).promise();
        clinicStaticMap = uploadS3.Location;
        await db.ClinicStaticMap.update(
          {
            imgUrl: uploadS3.Location,
          },
          {
            where: { id: clinicMap.id },
          }
        );
        console.timeEnd("stasticMap S3 저장");
      }
      const clinicInfoHeader = {
        name: clinic.name,
        originalName: clinic.originalName,
        address: clinic.address,
        telNumber: clinic.telNumber,
        website: clinic.website,
        launchDate: clinic.launchDate,
        dentalTransparent: clinic.dentalTransparent,
        geographLong: clinic.geographLong,
        geographLat: clinic.geographLat,
        reviewNum: clinic.get("reviewNum"),
        conclustionNow: clinic.get("conclustionNow"),
        lunchTimeNow: clinic.get("lunchTimeNow"),
        recommendNum: clinic.get("recommendNum"),
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
      const clinicReviewImg = await db.Review_content.findAll({
        attributes: ["id", "img_url", "index", "imgDate", "createdAt", "img_width", "img_height"],
        where: {
          img_url: {
            [Sequelize.Op.not]: null,
          },
        },
        include: [
          {
            model: db.Review,
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
      const clinicProfileImg = await db.DentalClinicProfileImg.findAll({
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
      /*
    const reviews = await db.Review.getClinicReviewsAll(db, clinicId, userId, 10, 0);
    result.reviews = reviews;
    */
      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.userScrapClinics = async function userScrapClinics(event) {
  try {
    const clinicId = event.queryStringParameters.clinicId;
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      console.log(clinicId);
      const userScrapClinics = await sequelize.query("SELECT IF((SELECT COUNT(*) FROM UserScrapClinics where userId = :userId AND dentalClinicId = :clinicId)>0,true,false) AS scraped LIMIT 1", {
        replacements: {
          userId: user.id,
          clinicId: clinicId,
        },
        type: sequelize.QueryTypes.SELECT,
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ scraped: userScrapClinics[0].scraped === 1 ? true : false }),
      };
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.clinicReviews = async function clinicReview(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const { clinicId } = event.queryStringParameters;
      const limit = parseInt(event.queryStringParameters.limit);
      const offset = parseInt(event.queryStringParameters.offset);
      const reviews = await db.Review.getClinicReviewsAll(db, clinicId, userId, limit, offset);
      return {
        statusCode: 200,
        body: JSON.stringify(reviews),
      };
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
