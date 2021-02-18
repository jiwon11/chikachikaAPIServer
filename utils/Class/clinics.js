const Sequelize = require("sequelize");
const cloudFrontUrl = "https://d1lkvafdh6ugy5.cloudfront.net/";

const conclustionAndLunchTimeCalFunc = function (day, nowTime, todayHoliday, holidayTreatment) {
  var TOLTimeAttrStart;
  var TOLTimeAttrEnd;
  var TOLTimeConfident;
  var confidentConsulationTime;
  var conclustionNow;
  var startTime;
  var endTime;
  var weekend_non_consulation_notice;
  var lunchTimeNow;
  var holidayTreatmentQuery;
  if (holidayTreatment) {
    if (holidayTreatment === "true") {
      holidayTreatmentQuery = {
        [Sequelize.Op.not]: null,
      };
    } else {
      holidayTreatmentQuery = {
        [Sequelize.Op.or]: {
          [Sequelize.Op.is]: null,
          [Sequelize.Op.not]: null,
        },
      };
    }
  }
  if (day !== "Sun" && day !== "Sat") {
    TOLTimeAttrStart = "weekday_TOL_start";
    TOLTimeAttrEnd = "weekday_TOL_end";
    TOLTimeConfident = [Sequelize.literal(`IF((weekday_TOL_start = "00:00:00" OR weekday_TOL_end = "00:00:00"), false, true)`), "confidentTOL"];
  } else if (day !== "Sun") {
    TOLTimeAttrStart = "sat_TOL_start";
    TOLTimeAttrEnd = "sat_TOL_end";
    TOLTimeConfident = [Sequelize.literal(`IF((sat_TOL_start = "00:00:00" OR sat_TOL_end IS NULL), false, true)`), "confidentTOL"];
  } else {
    TOLTimeAttrStart = [Sequelize.literal(`"00:00:00"`), "sun_TOL_start"];
    TOLTimeAttrEnd = [Sequelize.literal(`"00:00:00"`), "sun_TOL_end"];
    TOLTimeConfident = [Sequelize.literal(`1 != 1`), "confidentTOL"];
  }
  if (day !== "Sun" && day !== "Sat") {
    TOLTimeAttrStart = "weekday_TOL_start";
    TOLTimeAttrEnd = "weekday_TOL_end";
  } else if (day !== "Sun") {
    TOLTimeAttrStart = "sat_TOL_start";
    TOLTimeAttrEnd = "sat_TOL_end";
  } else {
    TOLTimeAttrStart = [Sequelize.literal(`"00:00:00"`), "sun_TOL_start"];
    TOLTimeAttrEnd = [Sequelize.literal(`"00:00:00"`), "sun_TOL_end"];
  }

  if (day === "Sun" || todayHoliday.length > 0) {
    confidentConsulationTime = [Sequelize.literal(`IF((holiday_treatment_start_time IS NULL), false, true)`), "confidentConsulationTime"];
    conclustionNow = [Sequelize.literal(`holiday_treatment_start_time <= "${nowTime}" AND holiday_treatment_end_time >= "${nowTime}"`), "conclustionNow"];
    startTime = "holiday_treatment_start_time";
    endTime = "holiday_treatment_end_time";
    weekend_non_consulation_notice = "weekend_non_consulation_notice";
  } else {
    confidentConsulationTime = [Sequelize.literal(`IF((${day}_Consulation_start_time = "00:00:00" OR ${day}_Consulation_end_time = "00:00:00"), false, true)`), "confidentConsulationTime"];
    conclustionNow = [Sequelize.literal(`${day}_Consulation_start_time <= "${nowTime}" AND ${day}_Consulation_end_time >= "${nowTime}"`), "conclustionNow"];
    startTime = `${day}_Consulation_start_time`;
    endTime = `${day}_Consulation_end_time`;
    weekend_non_consulation_notice = "weekend_non_consulation_notice";
  }
  if (day !== "Sat" && day !== "Sun" && todayHoliday.length === 0) {
    lunchTimeNow = [Sequelize.literal(`weekday_TOL_start <= "${nowTime}" AND weekday_TOL_end >= "${nowTime}"`), "lunchTimeNow"];
  } else if (day !== "Sun" && todayHoliday.length === 0) {
    lunchTimeNow = [Sequelize.literal(`sat_TOL_start <= "${nowTime}" AND sat_TOL_end >= "${nowTime}"`), "lunchTimeNow"];
  } else {
    lunchTimeNow = [Sequelize.literal(`1 != 1`), "lunchTimeNow"];
  }
  return {
    TOLTimeAttrStart,
    TOLTimeAttrEnd,
    TOLTimeConfident,
    confidentConsulationTime,
    conclustionNow,
    startTime,
    endTime,
    weekend_non_consulation_notice,
    lunchTimeNow,
    holidayTreatmentQuery,
  };
};

const accuracyPointQuery = Sequelize.literal(
  `(IF(CD_Num > 0 OR SD_Num > 0 OR RE_Num > 0 OR IN_Num > 0, 1, 0))+(IF(Mon_Consulation_start_time > "00:00:00", 1, 0))+ (IF(Sat_Consulation_start_time > "00:00:00", 1, 0)) + (IF(parking_allow_num>0, 1, 0))+(IF(holiday_treatment_start_time IS NOT NULL, 1, 0))+(IF(description IS NOT NULL, 1, 0))+(IF(dentalTransparent IS TRUE, 1, 0))+(IF((SELECT COUNT(*) FROM Clinic_subjects where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM Clinic_special_treatment where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM dentalClinicProfileImgs where dentalClinicId = dental_clinic.id AND dentalClinicProfileImgs.deletedAt IS NOT NULL)>0,1,0))`
);

module.exports.SearchAll = async function (db, type, query, nowTime, day, week, todayHoliday, lat, long, limit, offset, sort, wantParking, holidayTreatment) {
  var orderQuery;
  if (sort === "distance") {
    orderQuery = [
      [Sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`), "ASC"],
    ];
  } else if (sort === "accuracy") {
    orderQuery = [
      [Sequelize.literal(`IF(telNumber IS NOT NULL,1,0)`), "ASC"],
      [accuracyPointQuery, "DESC"],
      ["name", "ASC"],
    ];
  }
  var parkingQuery;
  if (type !== "residence") {
    if (wantParking === "y") {
      parkingQuery = {
        [Sequelize.Op.and]: {
          [Sequelize.Op.gt]: 0,
          [Sequelize.Op.ne]: null,
        },
      };
    } else {
      parkingQuery = {
        [Sequelize.Op.and]: {
          [Sequelize.Op.gte]: 0,
        },
      };
    }
  }
  const conclustionAndLunchTime = conclustionAndLunchTimeCalFunc(day, nowTime, todayHoliday, holidayTreatment);
  console.log(conclustionAndLunchTime);
  var whereQuery;
  var attributesList;
  if (type === "around") {
    const radius = 0.7;
    whereQuery = {
      [Sequelize.Op.all]: Sequelize.literal(
        `(6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat))))<=${radius}`
      ),
      parking_allow_num: parkingQuery,
      holiday_treatment_start_time: conclustionAndLunchTime.holidayTreatmentQuery,
      Mon_Consulation_start_time: {
        [Sequelize.Op.lte]: week.mon === null ? "24:00:00" : week.mon,
      },
      Mon_Consulation_end_time: {
        [Sequelize.Op.gte]: week.mon === null ? "00:00:00" : week.mon,
      },
      Tus_Consulation_start_time: {
        [Sequelize.Op.lte]: week.tus === null ? "24:00:00" : week.tus,
      },
      Tus_Consulation_end_time: {
        [Sequelize.Op.gte]: week.tus === null ? "00:00:00" : week.tus,
      },
      Wed_Consulation_start_time: {
        [Sequelize.Op.lte]: week.wed === null ? "24:00:00" : week.wed,
      },
      Wed_Consulation_end_time: {
        [Sequelize.Op.gte]: week.wed === null ? "00:00:00" : week.wed,
      },
      Thu_Consulation_start_time: {
        [Sequelize.Op.lte]: week.thu === null ? "24:00:00" : week.thu,
      },
      Thu_Consulation_end_time: {
        [Sequelize.Op.gte]: week.thu === null ? "00:00:00" : week.thu,
      },
      Fri_Consulation_start_time: {
        [Sequelize.Op.lte]: week.fri === null ? "24:00:00" : week.fri,
      },
      Fri_Consulation_end_time: {
        [Sequelize.Op.gte]: week.fri === null ? "00:00:00" : week.fri,
      },
      sat_Consulation_start_time: {
        [Sequelize.Op.lte]: week.sat === null ? "24:00:00" : week.sat,
      },
      Sat_Consulation_end_time: {
        [Sequelize.Op.gte]: week.sat === null ? "00:00:00" : week.sat,
      },
    };
    attributesList = [
      "id",
      //"name",
      "originalName",
      "local",
      "address",
      "telNumber",
      "website",
      "geographLong",
      "geographLat",
      "holiday_treatment_start_time",
      "holiday_treatment_end_time",
      conclustionAndLunchTime.startTime,
      conclustionAndLunchTime.endTime,
      conclustionAndLunchTime.TOLTimeAttrStart,
      conclustionAndLunchTime.TOLTimeAttrEnd,
      conclustionAndLunchTime.TOLTimeConfident,
      conclustionAndLunchTime.confidentConsulationTime,
      conclustionAndLunchTime.weekend_non_consulation_notice,
      [
        Sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`),
        "distance(km)",
      ],
      [Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
      conclustionAndLunchTime.conclustionNow,
      conclustionAndLunchTime.lunchTimeNow,
      [
        Sequelize.literal(
          `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1))`
        ),
        "reviewAVGStarRate",
      ],
      [accuracyPointQuery, "accuracyPoint"],
    ];
  } else if (type === "keyword") {
    whereQuery = {
      [Sequelize.Op.and]: [
        {
          [Sequelize.Op.or]: [
            {
              originalName: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
            {
              "$city.fullCityName$": {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
          ],
        },
      ],
      parking_allow_num: parkingQuery,
      holiday_treatment_start_time: conclustionAndLunchTime.holidayTreatmentQuery,
      Mon_Consulation_start_time: {
        [Sequelize.Op.lte]: week.mon === null ? "24:00:00" : week.mon,
      },
      Mon_Consulation_end_time: {
        [Sequelize.Op.gte]: week.mon === null ? "00:00:00" : week.mon,
      },
      Tus_Consulation_start_time: {
        [Sequelize.Op.lte]: week.tus === null ? "24:00:00" : week.tus,
      },
      Tus_Consulation_end_time: {
        [Sequelize.Op.gte]: week.tus === null ? "00:00:00" : week.tus,
      },
      Wed_Consulation_start_time: {
        [Sequelize.Op.lte]: week.wed === null ? "24:00:00" : week.wed,
      },
      Wed_Consulation_end_time: {
        [Sequelize.Op.gte]: week.wed === null ? "00:00:00" : week.wed,
      },
      Thu_Consulation_start_time: {
        [Sequelize.Op.lte]: week.thu === null ? "24:00:00" : week.thu,
      },
      Thu_Consulation_end_time: {
        [Sequelize.Op.gte]: week.thu === null ? "00:00:00" : week.thu,
      },
      Fri_Consulation_start_time: {
        [Sequelize.Op.lte]: week.fri === null ? "24:00:00" : week.fri,
      },
      Fri_Consulation_end_time: {
        [Sequelize.Op.gte]: week.fri === null ? "00:00:00" : week.fri,
      },
      sat_Consulation_start_time: {
        [Sequelize.Op.lte]: week.sat === null ? "24:00:00" : week.sat,
      },
      Sat_Consulation_end_time: {
        [Sequelize.Op.gte]: week.sat === null ? "00:00:00" : week.sat,
      },
    };
    attributesList = [
      "id",
      //"name",
      "originalName",
      "local",
      "address",
      "telNumber",
      "website",
      "geographLong",
      "geographLat",
      "holiday_treatment_start_time",
      "holiday_treatment_end_time",
      conclustionAndLunchTime.startTime,
      conclustionAndLunchTime.endTime,
      conclustionAndLunchTime.TOLTimeAttrStart,
      conclustionAndLunchTime.TOLTimeAttrEnd,
      conclustionAndLunchTime.TOLTimeConfident,
      conclustionAndLunchTime.confidentConsulationTime,
      conclustionAndLunchTime.weekend_non_consulation_notice,
      [
        Sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`),
        "distance(km)",
      ],
      [Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
      conclustionAndLunchTime.conclustionNow,
      conclustionAndLunchTime.lunchTimeNow,
      [
        Sequelize.literal(
          `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1))`
        ),
        "reviewAVGStarRate",
      ],
      [accuracyPointQuery, "accuracyPoint"],
    ];
  } else if (type === "residence") {
    whereQuery = {
      [Sequelize.Op.and]: [
        {
          cityId: {
            [Sequelize.Op.or]: query,
          },
        },
        /*
        Sequelize.where(Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), {
          [Sequelize.Op.gt]: 0,
        }),
        */
      ],
    };
    attributesList = [
      "id",
      //"name",
      "originalName",
      "local",
      "address",
      "dentalTransparent",
      [
        Sequelize.literal(
          `CONVERT(IF((SELECT SUM(SpecialistDentist_NUM) FROM Clinic_subjects where Clinic_subjects.dentalClinicId = dental_clinic.id) IS NULL,SD_Num,(SELECT SUM(SpecialistDentist_NUM) FROM Clinic_subjects where Clinic_subjects.dentalClinicId = dental_clinic.id)),signed integer)`
        ),
        "surgeonNum",
      ],
      [Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
      [
        Sequelize.literal(
          `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1))`
        ),
        "reviewAVGStarRate",
      ],
      [accuracyPointQuery, "accuracyPoint"],
    ];
  }
  return await this.findAll({
    attributes: attributesList,
    where: whereQuery,
    include: [
      {
        model: db.City,
        attributes: ["id", "fullCityName", "newTownId"],
      },
      {
        model: db.DentalClinicProfileImg,
        limit: 1,
        order: [["represent", "DESC"]],
      },
    ],
    order: orderQuery,
    limit: limit,
    offset: offset,
  });
};

module.exports.NewestReviewsInResidence = async function (db, cityId, day, nowTime, todayHoliday, lat, long) {
  const conclustionAndLunchTime = conclustionAndLunchTimeCalFunc(day, nowTime, todayHoliday, undefined);
  return await this.findAll({
    attributes: [
      "id",
      "originalName",
      //"dentalTransparent",
      [Sequelize.literal(`SUBSTRING_INDEX(address, ' ', 5)`), "modifiedAddress"],
      //conclustionAndLunchTime.startTime,
      //conclustionAndLunchTime.endTime,
      //conclustionAndLunchTime.TOLTimeAttrStart,
      //conclustionAndLunchTime.TOLTimeAttrEnd,
      //conclustionAndLunchTime.TOLTimeConfident,
      //conclustionAndLunchTime.confidentConsulationTime,
      //conclustionAndLunchTime.weekend_non_consulation_notice,
      [
        Sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`),
        "distance(km)",
      ],
      [Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
      [
        Sequelize.literal(
          `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1))`
        ),
        "reviewAVGStarRate",
      ],
      //[accuracyPointQuery, "accuracyPoint"],
    ],
    include: [
      {
        model: db.Review,
        attributes: [
          "id",
          "totalCost",
          "dentalClinicId",
          [Sequelize.literal(`(SELECT ROUND((starRate_cost + starRate_treatment + starRate_service)/3,1))`), "AVGStarRate"],
          [Sequelize.literal(`IF((SELECT COUNT(*) FROM reviewBills where reviewBills.reviewId=id AND reviewBills.deletedAt IS NULL)>0,TRUE,FALSE)`), "verifyBills"],
        ],
        required: true,
        include: [
          {
            model: db.User,
            attributes: [
              "id",
              "nickname",
              "profileImg",
              "userProfileImgKeyValue",
              [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("userProfileImgKeyValue"), "?w=140&h=140&f=jpeg&q=100"), "img_thumbNail"],
            ],
          },
          {
            model: db.Treatment_item,
            as: "TreatmentItems",
            attributes: ["id", "name"],
            through: {
              attributes: [],
            },
          },
        ],
      },
    ],
    where: {
      cityId: cityId,
    },
    order: [
      Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL) DESC`),
      Sequelize.literal(
        `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1)) DESC`
      ),
      Sequelize.literal(`IF((SELECT COUNT(*) FROM reviewBills where reviewBills.reviewId=id AND reviewBills.deletedAt IS NULL)>0,TRUE,FALSE) DESC`),
      Sequelize.literal(`(SELECT ROUND((starRate_cost + starRate_treatment + starRate_service)/3,1)) DESC`),
    ],
    subQuery: false,
  });
};
