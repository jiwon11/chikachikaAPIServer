const jwt = require("jsonwebtoken");
const db = require("../utils/models");
const Sequelize = require("sequelize");
module.exports.clinics = async function clinics(event) {
  try {
    const { lat, long, wantParking, sort, days, time, holiday } = event.queryStringParameters;
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
    var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const nowTime = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    const day = weekDay[today.getDay()];
    const todayHoliday = await db.Korea_holiday.findAll({
      where: {
        date: today,
      },
    });
    console.log(day, nowTime);
    console.log(todayHoliday);
    const clinics = await db.Dental_clinic.searchAll("around", null, nowTime, day, week, todayHoliday, lat, long, 30, 0, "distance", wantParking, holiday);
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

module.exports.redienceClinics = async function redienceClinics(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { limit, offset } = event.queryStringParameters;
    const userId = decoded.id;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    const userResidences = await user.getResidences({
      attributes: ["id", "sido", "sigungu", "emdName", "newTownId"],
      through: {
        where: {
          now: true,
        },
      },
    });
    const clusterQuery = userResidences[0].newTownId
      ? {
          newTownId: userResidences[0].newTownId,
        }
      : {
          sigungu: userResidences[0].sigungu,
        };
    console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
    const cities = await db.City.findAll({
      attributes: ["id"],
      where: clusterQuery,
    });
    const cityIds = cities.map((city) => city.id);
    const clinics = await db.Dental_clinic.searchAll("residence", cityIds, null, null, null, null, null, null, parseInt(limit), parseInt(offset), "accuracy", null, null);
    let response = {
      statusCode: 200,
      body: JSON.stringify(clinics),
    };
    return response;
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
