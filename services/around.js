const sequelize = require("sequelize");
const { Dental_clinic, Review } = require("../utils/models");

module.exports.clinics = async function clinics(event) {
  try {
    const { lat, long, wantParking, sort, days, time } = event.queryStringParameters;
    const radius = 2;
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
    const clinics = await Dental_clinic.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`),
            "dinstance(km)",
          ],
        ],
      },
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
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};
