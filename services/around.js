const sequelize = require("sequelize");
const { Dental_clinic, Review, Korea_holiday } = require("../utils/models");

module.exports.clinics = async function clinics(event) {
  try {
    const { lat, long, wantParking, sort, days, time } = event.queryStringParameters;
    const radius = 0.7;
    var parking;
    if (wantParking === "y") {
      parking = {
        [sequelize.Op.and]: {
          [sequelize.Op.gt]: 0,
          [sequelize.Op.ne]: null,
        },
      };
    } else {
      parking = {
        [sequelize.Op.and]: {
          [sequelize.Op.gte]: 0,
        },
      };
    }
    var order;
    if (sort === "d") {
      order = [
        sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`),
        "ASC",
      ];
    }
    var week = {
      mon: null,
      tus: null,
      wed: null,
      thu: null,
      fri: null,
      sat: null,
    };
    if (time !== "") {
      if (days !== "") {
        days.split(",").forEach((day) => {
          week[day] = time;
        });
      } else {
        const today = new Date();
        const weekDay = ["sun", "mon", "tus", "wed", "thu", "fri", "sat"];
        const day = weekDay[today.getDay()];
        week[day] = time;
      }
    }
    console.log(week);
    var weekdayTolStartTimeQuery;
    var weekdayTolEndTimeQuery;
    var weekdayTolStartTimeNonZero;
    var weekdayTolEndTimeNonZero;
    if (week.mon !== null || week.tus !== null || week.wed !== null || week.thu !== null || week.fri !== null) {
      weekdayTolStartTimeQuery = {
        [sequelize.Op.gt]: time,
      };
      weekdayTolEndTimeQuery = {
        [sequelize.Op.lt]: time,
      };
      weekdayTolStartTimeNonZero = { weekday_TOL_start: { [sequelize.Op.ne]: "00:00:00" } };
      weekdayTolEndTimeNonZero = { weekday_TOL_end: { [sequelize.Op.ne]: "00:00:00" } };
    } else {
      weekdayTolStartTimeQuery = { [sequelize.Op.not]: null };
      weekdayTolEndTimeQuery = { [sequelize.Op.not]: null };
    }
    var satTolStartTimeQuery;
    var satTolEndTimeQuery;
    var satTolStartTimeNonZero;
    var satTolEndTimeNonZero;
    if (week.sat !== null) {
      satTolStartTimeQuery = {
        [sequelize.Op.gt]: time,
      };
      satTolEndTimeQuery = {
        [sequelize.Op.lt]: time,
      };
      satTolStartTimeNonZero = { sat_TOL_start: { [sequelize.Op.ne]: "00:00:00" } };
      satTolEndTimeNonZero = { sat_TOL_end: { [sequelize.Op.ne]: "00:00:00" } };
    } else {
      satTolStartTimeQuery = { [sequelize.Op.not]: null };
      satTolEndTimeQuery = { [sequelize.Op.not]: null };
    }
    var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const nowTime = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    const day = weekDay[today.getDay()];
    const todayHoliday = await Korea_holiday.findAll({
      where: {
        date: today,
      },
    });
    console.log(day, nowTime);
    console.log(todayHoliday);
    var TOLTimeAttrStart;
    var TOLTimeAttrEnd;
    if (day !== "Sun" && day !== "Sat") {
      TOLTimeAttrStart = "weekday_TOL_start";
      TOLTimeAttrEnd = "weekday_TOL_end";
    } else if (day !== "Sun") {
      TOLTimeAttrStart = "sat_TOL_start";
      TOLTimeAttrEnd = "sat_TOL_end";
    } else {
      TOLTimeAttrStart = [sequelize.literal(`1 != 1`), "sun_TOL_start"];
      TOLTimeAttrEnd = [sequelize.literal(`1 != 1`), "sun_TOL_end"];
    }
    const clinics = await Dental_clinic.findAll({
      attributes: [
        "id",
        "name",
        "local",
        "address",
        "telNumber",
        "website",
        "geographLong",
        "geographLat",
        day === "Sun" || todayHoliday.length > 0 ? "holiday_treatment_start_time" : `${day}_Consulation_start_time`,
        day === "Sun" || todayHoliday.length > 0 ? "holiday_treatment_end_time" : `${day}_Consulation_end_time`,
        TOLTimeAttrStart,
        TOLTimeAttrEnd,
        [
          sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`),
          "dinstance(km)",
        ],
        day === "Sun" || todayHoliday.length > 0
          ? [sequelize.literal(`holiday_treatment_start_time <= "${nowTime}" AND holiday_treatment_end_time >= "${nowTime}"`), "conclustionNow"]
          : [sequelize.literal(`${day}_Consulation_start_time <= "${nowTime}" AND ${day}_Consulation_end_time >= "${nowTime}"`), "conclustionNow"],
        day !== "Sat" && day !== "Sun" && todayHoliday.length === 0
          ? [sequelize.literal(`weekday_TOL_start <= "${nowTime}" AND weekday_TOL_end >= "${nowTime}"`), "lunchTimeNow"]
          : day !== "Sun" && todayHoliday.length === 0
          ? [sequelize.literal(`sat_TOL_start <= "${nowTime}" AND sat_TOL_end >= "${nowTime}"`), "lunchTimeNow"]
          : [sequelize.literal(`1 != 1`), "lunchNow"],
        [sequelize.literal(`(SELECT COUNT(*) FROM reviews where reviews.dentalClinicId = dental_clinic.id AND reviews.deletedAt IS NULL)`), "reviewNum"],
        [
          sequelize.literal(
            `(SELECT ROUND(((SELECT AVG(starRate_cost) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_treatment) FROM reviews where reviews.dentalClinicId = dental_clinic.id)+(SELECT AVG(starRate_service) FROM reviews where reviews.dentalClinicId = dental_clinic.id))/3,1))`
          ),
          "reviewAVGStarRate",
        ],
      ],
      where: {
        [sequelize.Op.all]: sequelize.literal(
          `(6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat))))<=${radius}`
        ),
        parking_allow_num: parking,
        [sequelize.Op.and]: [weekdayTolStartTimeNonZero, weekdayTolEndTimeNonZero, satTolStartTimeNonZero, satTolEndTimeNonZero],
        [sequelize.Op.or]: [
          {
            weekday_TOL_start: weekdayTolStartTimeQuery,
          },
          {
            weekday_TOL_end: weekdayTolEndTimeQuery,
          },
          {
            sat_TOL_start: satTolStartTimeQuery,
          },
          {
            sat_TOL_end: satTolEndTimeQuery,
          },
        ],
        Mon_Consulation_start_time: {
          [sequelize.Op.lte]: week.mon === null ? "24:00:00" : week.mon,
        },
        Mon_Consulation_end_time: {
          [sequelize.Op.gte]: week.mon === null ? "00:00:00" : week.mon,
        },
        Tus_Consulation_start_time: {
          [sequelize.Op.lte]: week.tus === null ? "24:00:00" : week.tus,
        },
        Tus_Consulation_end_time: {
          [sequelize.Op.gte]: week.tus === null ? "00:00:00" : week.tus,
        },
        Wed_Consulation_start_time: {
          [sequelize.Op.lte]: week.wed === null ? "24:00:00" : week.wed,
        },
        Wed_Consulation_end_time: {
          [sequelize.Op.gte]: week.wed === null ? "00:00:00" : week.wed,
        },
        Thu_Consulation_start_time: {
          [sequelize.Op.lte]: week.thu === null ? "24:00:00" : week.thu,
        },
        Thu_Consulation_end_time: {
          [sequelize.Op.gte]: week.thu === null ? "00:00:00" : week.thu,
        },
        Fri_Consulation_start_time: {
          [sequelize.Op.lte]: week.fri === null ? "24:00:00" : week.fri,
        },
        Fri_Consulation_end_time: {
          [sequelize.Op.gte]: week.fri === null ? "00:00:00" : week.fri,
        },
        sat_Consulation_start_time: {
          [sequelize.Op.lte]: week.sat === null ? "24:00:00" : week.sat,
        },
        Sat_Consulation_end_time: {
          [sequelize.Op.gte]: week.sat === null ? "00:00:00" : week.sat,
        },
      },
      order: [order],
    });
    console.log(clinics.length);
    let response = {
      statusCode: 200,
      body: JSON.stringify(clinics),
    };
    return response;
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};
