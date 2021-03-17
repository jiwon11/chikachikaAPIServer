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
