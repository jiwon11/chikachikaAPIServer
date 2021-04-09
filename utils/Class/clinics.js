const Sequelize = require("sequelize");
const cloudFrontUrl = process.env.cloudFrontUrl;
const moment = require("moment");

var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
const today = moment().tz(process.env.TZ);
const nowTime = `${today.hour()}:${today.minute()}:${today.second()}`;
const day = weekDay[today.day()];
const todayHolidayFunc = async function (db, today) {
  return await db.Korea_holiday.findAll({
    where: {
      date: today,
    },
  });
};
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
const clinicIncludeModels = function (db, clusterQuery) {
  var includeModels;
  var residenceQuery;
  if (clusterQuery === undefined) {
    residenceQuery = { id: { [Sequelize.Op.not]: null } };
  } else {
    residenceQuery = clusterQuery;
  }
  includeModels = [
    {
      model: db.City,
      attributes: ["id", "fullCityName", "newTownId"],
      where: [residenceQuery],
    },
    {
      model: db.Review,
      include: [
        {
          model: db.Treatment_item,
          as: "TreatmentItems",
          attributes: ["id", "usualName"],
        },
        {
          model: db.Disease_item,
          as: "DiseaseItems",
          attributes: ["id", "usualName"],
        },
      ],
    },
    {
      model: db.DentalClinicProfileImg,
      limit: 1,
      order: [["represent", "DESC"]],
    },
  ];
  return includeModels;
};

const clinicIncludeAttributes = function (lat, long, conclustionAndLunchTime) {
  return [
    "id",
    //"name",
    "originalName",
    "local",
    "address",
    [Sequelize.literal(`SUBSTRING_INDEX(address, ' ', 4)`), "modifiedAddress"],
    "telNumber",
    "website",
    "geographLong",
    "geographLat",
    "holiday_treatment_start_time",
    "holiday_treatment_end_time",
    "dentalTransparent",
    "societySpecialist",
    conclustionAndLunchTime.startTime,
    conclustionAndLunchTime.endTime,
    conclustionAndLunchTime.TOLTimeAttrStart,
    conclustionAndLunchTime.TOLTimeAttrEnd,
    conclustionAndLunchTime.TOLTimeConfident,
    conclustionAndLunchTime.confidentConsulationTime,
    conclustionAndLunchTime.weekend_non_consulation_notice,
    [
      Sequelize.literal(
        `(SELECT IF(geographLat != '' ,ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2), -1))`
      ),
      "distance(km)",
    ],
    [Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
    conclustionAndLunchTime.conclustionNow,
    conclustionAndLunchTime.lunchTimeNow,
    [Sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL AND reviews.recommend IS TRUE)`), "recommendNum"],
    [accuracyPointQuery, "accuracyPoint"],
    [
      Sequelize.literal(
        `CONVERT(IF((SELECT SUM(SpecialistDentist_NUM) FROM Clinic_subjects where Clinic_subjects.dentalClinicId = dental_clinic.id) IS NULL,SD_Num,(SELECT SUM(SpecialistDentist_NUM) FROM Clinic_subjects where Clinic_subjects.dentalClinicId = dental_clinic.id)),signed integer)`
      ),
      "surgeonNum",
    ],
  ];
};

const accuracyPointQuery = Sequelize.literal(
  `(IF(CD_Num > 0 OR SD_Num > 0 OR RE_Num > 0 OR IN_Num > 0, 1, 0))+(IF(Mon_Consulation_start_time > "00:00:00", 1, 0))+ (IF(Sat_Consulation_start_time > "00:00:00", 1, 0)) + (IF(parking_allow_num>0, 1, 0))+(IF(holiday_treatment_start_time IS NOT NULL, 1, 0))+(IF(description IS NOT NULL, 1, 0))+(IF(dentalTransparent IS TRUE, 1, 0))+(IF((SELECT COUNT(*) FROM Clinic_subjects where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM Clinic_special_treatment where dentalClinicId = dental_clinic.id)>0,1,0))+(IF((SELECT COUNT(*) FROM dentalClinicProfileImgs where dentalClinicId = dental_clinic.id AND dentalClinicProfileImgs.deletedAt IS NOT NULL)>0,1,0))`
);

module.exports.SearchAll = async function (db, type, query, nowTime, day, week, lat, long, maplat, maplong, limit, offset, sort, wantParking, holidayTreatment, transparent, surgeon, night) {
  var orderQuery;
  if (sort === "d") {
    orderQuery = Sequelize.literal("`distance(km)` ASC");
  } else if (sort === "a") {
    orderQuery = Sequelize.literal("accuracyPoint DESC");
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
  const todayHoliday = await todayHolidayFunc(db, today);
  const conclustionAndLunchTime = conclustionAndLunchTimeCalFunc(day, nowTime, todayHoliday, holidayTreatment);
  var whereQuery;
  var attrWhereQuery;
  if (type === "around") {
    const radius = 2;
    if (query === undefined || query === "") {
      attrWhereQuery = [
        Sequelize.literal(`(6371*acos(cos(radians(${maplat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${maplong}))+sin(radians(${maplat}))*sin(radians(geographLat))))<=${radius}`),
      ];
    } else {
      attrWhereQuery = [
        {
          local: {
            [Sequelize.Op.like]: `%${query}%`,
          },
        },
      ];
    }
  } else if (type === "keyword") {
    attrWhereQuery = [
      {
        [Sequelize.Op.or]: [
          {
            originalName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
          Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("city.emdName"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(city.sigungu, ' ', 1))"), ")"), {
            [Sequelize.Op.like]: `%${query}%`,
          }),
          Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("city.sigungu"), "(", Sequelize.col("city.sido"), ")"), {
            [Sequelize.Op.like]: `%${query}%`,
          }),
        ],
      },
    ];
  } else if (type === "residence") {
    attrWhereQuery = [
      {
        cityId: {
          [Sequelize.Op.or]: query,
        },
      },
    ];
  }
  var nightQuery;
  if (night === "t") {
    nightQuery = {
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.literal(`${day}_Consulation_end_time`), {
          [Sequelize.Op.gte]: "18:00:00",
        }),
        Sequelize.where(Sequelize.literal(`${day}_Consulation_end_time`), {
          [Sequelize.Op.ne]: "00:00:00",
        }),
      ],
    };
  } else {
    nightQuery = {
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.literal(`${day}_Consulation_end_time`), {
          [Sequelize.Op.gte]: "00:00:00",
        }),
      ],
    };
  }
  whereQuery = {
    [Sequelize.Op.and]: attrWhereQuery,
    nightQuery,
    dentalTransparent: transparent === "t" ? true : false,
    societySpecialist: surgeon === "t" ? true : false,
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
  return await this.findAll({
    attributes: clinicIncludeAttributes(lat, long, conclustionAndLunchTime),
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

module.exports.getKeywordSearchAll = async function (db, lat, long, query, clusterQuery, limit, offset, order) {
  console.log(clusterQuery);
  var orderQuery;
  if (order === "d") {
    orderQuery = Sequelize.literal("`distance(km)` ASC");
  } else if (order === "a") {
    orderQuery = Sequelize.literal("accuracyPoint DESC");
  }
  const todayHoliday = await todayHolidayFunc(db, today);
  const conclustionAndLunchTime = conclustionAndLunchTimeCalFunc(day, nowTime, todayHoliday, undefined);
  const includeModels = clinicIncludeModels(db, clusterQuery);
  const whereQuery = {
    [Sequelize.Op.or]: [
      {
        originalName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("city.emdName"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(city.sigungu, ' ', 1))"), ")"), {
        [Sequelize.Op.like]: `%${query}%`,
      }),
      Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("city.sigungu"), "(", Sequelize.col("city.sido"), ")"), {
        [Sequelize.Op.like]: `%${query}%`,
      }),
    ],
  };
  var results = await this.findAll({
    attributes: clinicIncludeAttributes(lat, long, conclustionAndLunchTime),
    where: whereQuery,
    include: includeModels,
    order: orderQuery,
    limit: limit,
    offset: offset,
  });
  results = JSON.parse(JSON.stringify(results));
  results.forEach((result) => {
    delete result.city;
    delete result.reviews;
  });
  return results;
};

module.exports.getClinicByAttributes = async function (db, attrType, clusterQuery, lat, long, sort, limit, offset) {
  const todayHoliday = await todayHolidayFunc(db, today);
  const conclustionAndLunchTime = conclustionAndLunchTimeCalFunc(day, nowTime, todayHoliday, "false");
  var whereQuery;
  if (attrType === "old") {
    whereQuery = {
      launchDate: {
        [Sequelize.Op.lte]: moment(today).subtract("10", "y").format("YYYY-MM-DD"),
      },
    };
  }
  var orderQuery;
  if (sort === "d") {
    orderQuery = Sequelize.literal("`distance(km)` ASC");
  } else if (sort === "a") {
    orderQuery = Sequelize.literal("accuracyPoint DESC");
  }
  var results = await this.findAll({
    attributes: clinicIncludeAttributes(lat, long, conclustionAndLunchTime),
    where: whereQuery,
    include: clinicIncludeModels(db, clusterQuery),
    order: orderQuery,
    limit: limit,
    offset: offset,
  });
  results = JSON.parse(JSON.stringify(results));
  results.forEach((result) => {
    delete result.city;
    delete result.reviews;
  });
  return results;
};
