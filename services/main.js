const db = require("../utils/models");
const moment = require("moment");

module.exports.residenceClinicReviews = async function residenceClinicReviews(event) {
  try {
    const { cityId, lat, long } = event.queryStringParameters;
    var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
    const today = moment().tz(process.env.TZ);
    const day = weekDay[today.day()];
    const nowTime = `${today.hour()}:${today.minute()}:${today.second()}`;
    const emdCity = await db.City.findOne({
      attributes: ["id", "sido", "sigungu", "emdName"],
      where: {
        id: cityId,
      },
    });
    const residenceClincReviews = await db.Dental_clinic.NewestReviewsInResidence(db, emdCity, day, nowTime, lat, long);
    return {
      statusCode: 200,
      body: JSON.stringify(residenceClincReviews),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
module.exports.subwayAroundClinics = async function subwayAroundClinics(event) {
  try {
    const cityId = event.queryStringParameters.cityId;
    //const limit = parseInt(event.queryStringParameters.limit);
    //const offset = parseInt(event.queryStringParameters.offset);
    const city = await db.City.findOne({
      where: {
        id: cityId,
      },
    });
    const subways = await city.getSubways();
    var subwayAroundClinics = {};
    for (const subway of subways) {
      subwayAroundClinics[subway.dataValues.name] = await db.Dental_clinic.searchAll(
        db,
        "residence",
        [cityId],
        null,
        null,
        null,
        null,
        null,
        subway.geographLat,
        subway.geographLong,
        5,
        0,
        "distance",
        null,
        null
      );
    }
    return {
      statusCode: 200,
      body: JSON.stringify(subwayAroundClinics),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.getClinicByAttributes = async function getClinicByAttributes(event) {
  try {
    const attrType = event.pathParameters.attrType;
    const { cityId, lat, long, sort } = event.queryStringParameters;
    const limit = parseInt(event.queryStringParameters.limit);
    const offset = parseInt(event.queryStringParameters.offset);
    var userResidence = await db.City.findOne({
      where: {
        id: cityId,
      },
    });
    const clusterQuery = userResidence.newTownId
      ? {
          newTownId: userResidence.newTownId,
        }
      : {
          sido: userResidence.sido,
          sigungu: userResidence.sigungu,
        };
    console.log(clusterQuery);
    const results = await db.Dental_clinic.getClinicByAttributes(db, attrType, clusterQuery, lat, long, sort, limit, offset);
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
