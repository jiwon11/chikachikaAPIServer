const db = require("../utils/models");
const moment = require("moment");
module.exports.clinics = async function clinics(event) {
  try {
    const { lat, long, maplat, maplong, wantParking, sort, days, time, holiday, transparent, surgeon, night, cityName } = event.queryStringParameters;
    console.log(JSON.stringify(event.queryStringParameters));
    const limit = parseInt(event.queryStringParameters.limit);
    const offset = parseInt(event.queryStringParameters.offset);
    var week = {
      mon: null,
      tue: null,
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
        const today = moment().tz(process.env.TZ);
        const weekDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const day = weekDay[today.day()];
        week[day] = time;
      }
    }
    console.log(week);
    var weekDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = moment().tz(process.env.TZ);
    const nowTime = `${today.hour()}:${today.minute()}:${today.second()}`;
    const day = weekDay[today.day()];
    console.log(day, nowTime);
    const clinics = await db.Dental_clinic.searchAll(db, "around", cityName, nowTime, day, week, lat, long, maplat, maplong, limit, offset, sort, wantParking, holiday, transparent, surgeon, night);
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
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const { limit, offset } = event.queryStringParameters;
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
            sido: userResidences[0].sido,
            sigungu: userResidences[0].sigungu,
          };
      console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
      const cities = await db.City.findAll({
        attributes: ["id"],
        where: clusterQuery,
      });
      const cityIds = cities.map((city) => city.id);
      const clinics = await db.Dental_clinic.searchAll(db, "residence", cityIds, null, null, null, null, null, null, null, parseInt(limit), parseInt(offset), "accuracy", null, null);
      let response = {
        statusCode: 200,
        body: JSON.stringify(clinics),
      };
      return response;
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
