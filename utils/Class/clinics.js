const Sequelize = require("sequelize");
module.exports.SearchAll = async function (type, query, nowTime, day, week, todayHoliday, lat, long, limit, offset, sort, wantParking) {
  var orderQuery;
  if (sort === "distance") {
    orderQuery = [
      [Sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`), "ASC"],
    ];
  } else if (sort === "accuracy") {
    orderQuery = [
      [Sequelize.literal(`IF(telNumber IS NOT NULL,1,0)`), "ASC"],
      [
        Sequelize.literal(
          `(IF(CD_Num > 0 OR SD_Num > 0 OR RE_Num > 0 OR IN_Num > 0, 1, 0))+(IF(Mon_Consulation_start_time > "00:00:00", 1, 0))+ (IF(Sat_Consulation_start_time > "00:00:00", 1, 0)) + (IF(parking_allow_num>0, 1, 0))+(IF(description IS NOT NULL, 1, 0))+(IF(dentalTransparent IS TRUE, 1, 0))+(IF((SELECT COUNT(*) FROM Clinic_subjects where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM Clinic_special_treatment where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM dentalClinicProfileImgs where dentalClinicId = dental_clinic.id AND dentalClinicProfileImgs.deletedAt IS NOT NULL)>0,1,0))`
        ),
        "DESC",
      ],
      ["name", "ASC"],
    ];
  }
  var parking;
  if (wantParking === "y") {
    parking = {
      [Sequelize.Op.and]: {
        [Sequelize.Op.gt]: 0,
        [Sequelize.Op.ne]: null,
      },
    };
  } else {
    parking = {
      [Sequelize.Op.and]: {
        [Sequelize.Op.gte]: 0,
      },
    };
  }
  var TOLTimeAttrStart;
  var TOLTimeAttrEnd;
  var TOLTimeConfident;
  if (day !== "Sun" && day !== "Sat") {
    TOLTimeAttrStart = "weekday_TOL_start";
    TOLTimeAttrEnd = "weekday_TOL_end";
    TOLTimeConfident = [Sequelize.literal(`IF((weekday_TOL_start = "00:00:00" OR weekday_TOL_end = "00:00:00"), false, true)`), "confidentTOL"];
  } else if (day !== "Sun") {
    TOLTimeAttrStart = "sat_TOL_start";
    TOLTimeAttrEnd = "sat_TOL_end";
    TOLTimeConfident = [Sequelize.literal(`IF((sat_TOL_start = "00:00:00" OR sat_TOL_end = "00:00:00"), false, true)`), "confidentTOL"];
  } else {
    TOLTimeAttrStart = [Sequelize.literal(`1 != 1`), "sun_TOL_start"];
    TOLTimeAttrEnd = [Sequelize.literal(`1 != 1`), "sun_TOL_end"];
    TOLTimeConfident = [Sequelize.literal(`1 != 1`), "confidentTOL"];
  }
  if (day !== "Sun" && day !== "Sat") {
    TOLTimeAttrStart = "weekday_TOL_start";
    TOLTimeAttrEnd = "weekday_TOL_end";
  } else if (day !== "Sun") {
    TOLTimeAttrStart = "sat_TOL_start";
    TOLTimeAttrEnd = "sat_TOL_end";
  } else {
    TOLTimeAttrStart = [Sequelize.literal(`1 != 1`), "sun_TOL_start"];
    TOLTimeAttrEnd = [Sequelize.literal(`1 != 1`), "sun_TOL_end"];
  }
  var confidentConsulationTime;
  var conclustionNow;
  var startTime;
  var endTime;
  if (day === "Sun" || todayHoliday.length > 0) {
    confidentConsulationTime = [Sequelize.literal(`1 != 1`), "confidentConsulationTime"];
    confidentConsulationEndTime = "holiday_treatment_end_time";
    conclustionNow = [Sequelize.literal(`holiday_treatment_start_time <= "${nowTime}" AND holiday_treatment_end_time >= "${nowTime}"`), "conclustionNow"];
    startTime = "holiday_treatment_start_time";
    endTime = "holiday_treatment_end_time";
  } else {
    confidentConsulationTime = [Sequelize.literal(`IF((${day}_Consulation_start_time = "00:00:00" OR ${day}_Consulation_end_time = "00:00:00"), false, true)`), "confidentConsulationTime"];
    conclustionNow = [Sequelize.literal(`${day}_Consulation_start_time <= "${nowTime}" AND ${day}_Consulation_end_time >= "${nowTime}"`), "conclustionNow"];
    startTime = `${day}_Consulation_start_time`;
    endTime = `${day}_Consulation_end_time`;
  }
  var lunchTimeNow;
  if (day !== "Sat" && day !== "Sun" && todayHoliday.length === 0) {
    lunchTimeNow = [Sequelize.literal(`weekday_TOL_start <= "${nowTime}" AND weekday_TOL_end >= "${nowTime}"`), "lunchTimeNow"];
  } else if (day !== "Sun" && todayHoliday.length === 0) {
    lunchTimeNow = [Sequelize.literal(`sat_TOL_start <= "${nowTime}" AND sat_TOL_end >= "${nowTime}"`), "lunchTimeNow"];
  } else {
    lunchTimeNow = [Sequelize.literal(`1 != 1`), "lunchTimeNow"];
  }
  var whereQuery;
  if (type === "around") {
    const radius = 0.7;
    whereQuery = {
      [Sequelize.Op.all]: Sequelize.literal(
        `(6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat))))<=${radius}`
      ),
      parking_allow_num: parking,
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
              local: {
                [Sequelize.Op.like]: `${query}%`,
              },
            },
          ],
        },
      ],
      parking_allow_num: parking,
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
  }
  return await this.findAll({
    attributes: [
      "id",
      //"name",
      "originalName",
      "local",
      "address",
      "telNumber",
      "website",
      "geographLong",
      "geographLat",
      startTime,
      endTime,
      TOLTimeAttrStart,
      TOLTimeAttrEnd,
      TOLTimeConfident,
      confidentConsulationTime,
      [
        Sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`),
        "dinstance(km)",
      ],
      [Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
      conclustionNow,
      lunchTimeNow,
      [
        Sequelize.literal(
          `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1))`
        ),
        "reviewAVGStarRate",
      ],
      [
        Sequelize.literal(
          `(IF(CD_Num > 0 OR SD_Num > 0 OR RE_Num > 0 OR IN_Num > 0, 1, 0))+(IF(Mon_Consulation_start_time > "00:00:00", 1, 0))+ (IF(Sat_Consulation_start_time > "00:00:00", 1, 0)) + (IF(parking_allow_num>0, 1, 0))+(IF(description IS NOT NULL, 1, 0))+(IF(dentalTransparent IS TRUE, 1, 0))+(IF((SELECT COUNT(*) FROM Clinic_subjects where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM Clinic_special_treatment where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM dentalClinicProfileImgs where dentalClinicId = dental_clinic.id AND dentalClinicProfileImgs.deletedAt IS NOT NULL)>0,1,0))`
        ),
        "accuracyPoint",
      ],
    ],
    where: whereQuery,
    order: orderQuery,
    limit: limit,
    offset: offset,
  });
};