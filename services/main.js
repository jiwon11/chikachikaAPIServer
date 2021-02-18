const db = require("../utils/models");
const moment = require("moment");

module.exports.residenceClinicReviews = async function residenceClinicReviews(event) {
  try {
    const { cityId, lat, long } = event.queryStringParameters;
    var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
    const today = moment().tz(process.env.TZ);
    const day = weekDay[today.day()];
    const nowTime = `${today.hour()}:${today.minute()}:${today.second()}`;
    const todayHoliday = await db.Korea_holiday.findAll({
      where: {
        date: today,
      },
    });
    const residenceClincReviews = await db.Dental_clinic.NewestReviewsInResidence(db, cityId, day, nowTime, todayHoliday, lat, long);
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
