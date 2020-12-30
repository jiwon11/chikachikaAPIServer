const { Dental_clinic, City, Korea_holiday, Dental_subject, Review, User, Review_content, Treatment_item, Review_treatment_item, Review_comment } = require("../utils/models");
const { sequelize, Sequelize } = require("../utils/models");
const { QueryTypes } = require("sequelize");
const axios = require("axios");
const jwt = require("jsonwebtoken");

module.exports.importDentalClinic = async function importDentalClinic(event) {
  try {
    const clinicInfos = require("../dental_clinic_json/korea_hospital_database.json");
    var i = 0;
    for (var clinicInfo of clinicInfos) {
      const existClinc = await Dental_clinic.findOne({
        where: {
          ykiho: clinicInfo.암호화YKIHO코드,
        },
      });
      if (!existClinc) {
        const clinic = await Dental_clinic.create({
          ykiho: clinicInfo.암호화YKIHO코드,
          name: clinicInfo.name,
          local: clinicInfo.local,
          address: clinicInfo.address,
          telNumber: clinicInfo.telNumber,
          website: clinicInfo.website,
          launchDate: clinicInfo.launchDate,
          geographLong: clinicInfo.long,
          geographLat: clinicInfo.lat,
          CD_Num: clinicInfo.CD_Num,
          SD_Num: clinicInfo.SD_Num,
          RE_Num: clinicInfo.RE_Num,
          IN_Num: clinicInfo.IN_Num,
          Mon_Consulation_start_time: clinicInfo.Mon_Consulation_start_time, //진료시간
          Mon_Consulation_end_time: clinicInfo.Mon_Consulation_end_time,
          Tus_Consulation_start_time: clinicInfo.Tus_Consulation_start_time,
          Tus_Consulation_end_time: clinicInfo.Tus_Consulation_end_time,
          Wed_Consulation_start_time: clinicInfo.Wed_Consulation_start_time,
          Wed_Consulation_end_time: clinicInfo.Wed_Consulation_end_time,
          Thu_Consulation_start_time: clinicInfo.Thu_Consulation_start_time,
          Thu_Consulation_end_time: clinicInfo.Thu_Consulation_end_time,
          Fri_Consulation_start_time: clinicInfo.Fri_Consulation_start_time,
          Fri_Consulation_end_time: clinicInfo.Fri_Consulation_end_time,
          Sat_Consulation_start_time: clinicInfo.Sat_Consulation_start_time,
          Sat_Consulation_end_time: clinicInfo.Sat_Consulation_end_time,
          weekday_TOR: clinicInfo.weekday_TOR, //접수시간
          Sat_TOR: clinicInfo.Sat_TOR,
          weekday_TOL_start: clinicInfo.weekday_TOL_start,
          weekday_TOL_end: clinicInfo.weekday_TOL_end,
          sat_TOL_start: clinicInfo.Sat_TOL_start,
          sat_TOL_end: clinicInfo.Sat_TOL_end,
          weekday_TOL_notice: clinicInfo.weekday_TOL_notice,
          sat_TOL_notice: clinicInfo.Sat_TOL_notice,
          weekend_non_consulation_notice: clinicInfo.weekend_non_consulation_notice,
          parking_allow_num: clinicInfo.parking_allow_num,
          parking_cost: clinicInfo.parking_cost,
          parking_others_notice: clinicInfo.parking_others_notice,
        });
        i++;
        console.log(`${i}번째 : ${clinic.name}`);
      }
    }
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};

module.exports.getNonPaymentItemHospList = async function getNonPaymentItemHospList(event) {
  const secretKey = "0XnAzkR5iFgXoj2TyjdseowDsMtFV%2FMP5D6nrbEY0VQomcjM5gdx9y%2BNrveV2KRE2ar48boNcPXlXxoWWGm%2Bew%3D%3D";
  const ykiho = "JDQ4MTg4MSM1MSMkMSMkMCMkNjIkMzgxMzUxIzExIyQxIyQzIyQ3MiQ0NjEwMDIjNjEjJDEjJDQjJDgz";
  try {
    const response = await axios.get(`http://apis.data.go.kr/B551182/nonPaymentDamtInfoService/getNonPaymentItemHospList2?ServiceKey=${secretKey}&clCd=41&ykiho=${ykiho}`);
    //const parseResponse = convert.xml2json(response.data, { compact: true, spaces: 4 });
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};

module.exports.duplicateNameClinics = async function duplicateNameClinics(event) {
  try {
    const clinicNames = await sequelize.query("SELECT name, COUNT(name) FROM dental_clinics GROUP BY name HAVING COUNT(name) >= 2;", { type: QueryTypes.SELECT });
    console.log(clinicNames);
    for (const clinicName of clinicNames) {
      const duplicateClinics = await Dental_clinic.findAll({
        where: {
          name: clinicName.name,
        },
      });
      for (const dupliClinic of duplicateClinics) {
        const name = dupliClinic.dataValues.name;
        const locals = dupliClinic.dataValues.local.split(" ");
        await Dental_clinic.update(
          {
            name: `${name}(${locals[0]}-${locals[1]})`,
          },
          {
            where: {
              id: dupliClinic.dataValues.id,
            },
          }
        );
        console.log(`updatedClinic Name: ${name}(${locals[0]}-${locals[1]})`);
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(clinicNames),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.importDentalClinicCity = async function importDentalClinicCity(event) {
  try {
    sequelize.sync({});
    const results = {};
    const clinics = await Dental_clinic.findAll({
      attributes: ["id", "name", "local", "address"],
    });
    for (let clinic of clinics) {
      const clinicSido = clinic.address.split(" ")[0];
      const clinicSigungu = clinic.local.split(" ")[0];
      const clinicEmdCity = clinic.local.split(" ")[1];
      const city = await City.findOne({
        where: {
          sido: clinicSido,
          sigungu: clinicSigungu,
          emdName: clinicEmdCity,
        },
        attributes: ["id", "sido", "sigungu", "emdName"],
      });
      if (city) {
        await city.addDental_clinics(clinic);
        console.log(`${clinic.name} : 있음 (${city.sido} ${city.sigungu} ${city.emdName})`);
        results[clinic.name] = `있음 (${city.sido} ${city.sigungu} ${city.emdName})`;
      } else {
        console.log(`${clinic.name} : 없음`);
        results[clinic.name] = "없음";
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

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
        ],
      },
      include: [
        {
          model: Dental_subject,
          as: "Subjects",
          attributes: ["name"],
          through: { attributes: ["SpecialistDentist_NUM", "choiceTreatmentDentist_NUM"] },
        },
      ],
    });
    const response = await axios({
      url: `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=300&h=300&center=${clinic.geographLong},${clinic.geographLat}&level=16&format=jpg`,
      headers: {
        "X-NCP-APIGW-API-KEY-ID": "n44tammhdm",
        "X-NCP-APIGW-API-KEY": "yCv33j48N7t9uGvh0BPDwcG3Nj7tfKmBH5YQ44wR",
      },
      responseType: "arraybuffer",
    });
    const clinicStaticMap = response.data;
    const clinicInfoHeader = {
      name: clinic.name,
      address: clinic.address,
      telNumber: clinic.telNumber,
      website: clinic.website,
      launchDate: clinic.launchDate,
      reviewNum: clinic.get("reviewNum"),
      conclustionNow: clinic.get("conclustionNow"),
      lunchTimeNow: clinic.get("lunchTimeNow"),
      reviewAVGStarRate: clinic.get("reviewAVGStarRate"),
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
    clinicInfoBody.description = clinic.description ? clinic.description : "";
    clinicInfoBody.treatmentTime = clinicTreatmentTime;
    clinicInfoBody.treatmentSubject = clinic.get("Subjects");
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
            sequelize.literal("(SELECT GROUP_CONCAT(description ORDER BY review_contents.index ASC SEPARATOR ' ') FROM review_contents WHERE review_contents.reviewId = review.id)"),
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
