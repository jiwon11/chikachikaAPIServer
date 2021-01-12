const jwt = require("jsonwebtoken");
const { Symptom_item, Dental_clinic, Treatment_item, Review, User, Review_content, Search_record, GeneralTag, Korea_holiday, City, Sequelize, Sido, Sigungu } = require("../utils/models");

module.exports.treatmentItems = async function treatmentItems(event) {
  try {
    const query = event.queryStringParameters.q;
    const treatments = await Treatment_item.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
    });
    let response = {
      statusCode: 200,
      body: JSON.stringify(treatments),
    };
    return response;
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${err.message}"}`,
    };
  }
};

module.exports.symptomItems = async function symptomItems(event) {
  try {
    const query = event.queryStringParameters.q;
    const symptoms = await Symptom_item.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
    });
    let response = {
      statusCode: 200,
      body: JSON.stringify(symptoms),
    };
    return response;
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${err.message}"}`,
    };
  }
};

module.exports.dentalClinics = async function dentalClinics(event) {
  try {
    const query = event.queryStringParameters.q;
    const clinics = await Dental_clinic.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name", "local", "address"],
    });
    let response = {
      statusCode: 200,
      body: JSON.stringify(clinics),
    };
    return response;
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${err.message}"}`,
    };
  }
};

module.exports.keywordClinicSearch = async function keywordClinicSearch(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { lat, long, query, sort, days, time, wantParking } = event.queryStringParameters;
    const limit = parseInt(event.queryStringParameters.limit);
    const offset = parseInt(event.queryStringParameters.offset);
    if (!query) {
      return {
        statusCode: 400,
        body: `{"statusText": "Bad Request","message": "검색어를 입력해주새요."}`,
      };
    }
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      await Search_record.create({
        query: query,
        category: "keyword",
        userId: user.id,
      });
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
    }
    if (parseFloat(long) > 131.87222222 && parseFloat(long) < 125.06666667) {
      return {
        statusCode: 400,
        body: `{"statusText": "Bad Request","message": "한국 내 경도 범위를 입력하세요."}`,
      };
    }
    if (parseFloat(lat) > 38.45 && parseFloat(lat) < 33.1) {
      return {
        statusCode: 400,
        body: `{"statusText": "Bad Request","message": "한국 내 위도 범위를 입력하세요."}`,
      };
    }
    var order;
    if (sort === "distance") {
      order = [
        [Sequelize.literal(`ROUND((6371*acos(cos(radians(${lat}))*cos(radians(geographLat))*cos(radians(geographLong)-radians(${long}))+sin(radians(${lat}))*sin(radians(geographLat)))),2)`), "ASC"],
      ];
    } else if (sort === "accuracy") {
      order = [
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
    const clinics = await Dental_clinic.findAll({
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
      where: {
        /*
        [Sequelize.Op.all]:
          day === "Sun" || todayHoliday.length > 0
            ? Sequelize.literal(`deletedAt IS NULL`)
            : Sequelize.literal(`${day}_Consulation_start_time != "00:00:00" AND ${day}_Consulation_end_time != "00:00:00"`),
        */
        parking_allow_num: parking,
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
      },
      order: order,
      limit: limit,
      offset: offset,
    });
    let response = {
      statusCode: 200,
      body: JSON.stringify(clinics),
    };
    return response;
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.reviews = async function reviewSearch(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const treatmentId = event.queryStringParameters.treatmentId;
    const limit = parseInt(event.queryStringParameters.limit);
    const offset = parseInt(event.queryStringParameters.offset);
    const order = event.queryStringParameters.order;
    var orderQuery;
    if (order === "createdAt") {
      orderQuery = ["createdAt", "DESC"];
    } else if (order === "popular") {
      orderQuery = ["", "ASC"];
    }
    const searchUser = await User.findOne({
      where: {
        id: decoded.id,
      },
    });
    const treatment = await Treatment_item.findOne({
      where: {
        id: treatmentId,
      },
    });
    const [search, created] = await Search_record.findOrCreate({
      where: {
        userId: searchUser.id,
        query: treatment.name,
        category: "review",
      },
    });
    if (!created) {
      await Search_record.update(
        {
          category: "review",
        },
        {
          where: {
            id: search.id,
          },
        }
      );
    }
    const reviews = await treatment.getReviews({
      through: {
        attributes: [],
      },
      include: [
        {
          model: User,
          attributes: ["id", "nickname", "profileImg"],
        },
        {
          model: Treatment_item,
          as: "TreatmentItems",
          through: {
            attributes: ["cost"],
          },
        },
        {
          model: Dental_clinic,
          attributes: ["id", "name", "address", "telNumber", "originalName"],
        },
        {
          model: Review_content,
        },
      ],
      order: [[orderQuery], ["review_contents", "index", "ASC"]],
      offset: offset,
      limit: limit,
    });
    await Promise.all(
      reviews.map(async (review) => {
        delete review.dataValues.review_treatment_item;
        review.dataValues.viewerLikeReview = await review.hasLikers(searchUser);
        review.dataValues.viewerScrapReview = await review.hasScrapers(searchUser);
        review.dataValues.reviewCommentNum = await review.countReview_comments();
        review.dataValues.reviewLikeNum = await review.countLikers();
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify(reviews),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.allTagItems = async function allTagItems(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const query = event.queryStringParameters.q;
    const offset = Math.round(parseInt(event.queryStringParameters.offset) / 5);
    const limit = Math.round(parseInt(event.queryStringParameters.limit) / 5);
    const purpose = event.pathParameters.purpose;
    console.log(limit);
    const clinics = await Dental_clinic.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name", "address"],
      offset: offset,
      limit: limit,
    });
    clinics.forEach((clinic) => clinic.setDataValue("category", "clinic"));
    const treatments = await Treatment_item.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name"],
      offset: offset,
      limit: limit,
    });
    treatments.forEach((treatment) => treatment.setDataValue("category", "treatment"));
    const symptoms = await Symptom_item.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name"],
      offset: offset,
      limit: limit,
    });
    symptoms.forEach((symptom) => symptom.setDataValue("category", "symptom"));
    const generaltags = await GeneralTag.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name"],
      offset: offset,
      limit: limit,
    });
    generaltags.forEach((generaltag) => generaltag.setDataValue("category", "general"));
    var cities;
    if (purpose === "autoComplete") {
      cities = await City.findAll({
        where: {
          [Sequelize.Op.or]: [
            Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("emdName"), "(", Sequelize.fn("REPLACE", Sequelize.col("sigungu"), " ", "-"), ")"), {
              [Sequelize.Op.like]: `${query}%`,
            }),
          ],
        },
        attributes: ["id", "sido", "sigungu", "adCity", "emdName", [Sequelize.literal("CONCAT(emdName, '(',REPLACE(sigungu,' ', '-'),')')"), "fullCityName"], "relativeAddress"],
        offset: offset,
        limit: limit,
      });
    } else if (purpose === "keywordSearch") {
      cities = await City.findAll({
        where: {
          [Sequelize.Op.or]: [
            Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
              [Sequelize.Op.like]: `%${query}%`,
            }),
            {
              relativeAddress: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
          ],
        },
        attributes: [
          "id",
          "sido",
          "sigungu",
          "adCity",
          "emdName",
          [Sequelize.literal("IF(emdName = adCity, CONCAT(sido,' ',sigungu,' ',emdName),CONCAT(sido,' ',sigungu,' ',emdName,'(',adCity,')'))"), "fullCityName"],
          "relativeAddress",
        ],
        offset: offset,
        limit: limit,
      });
    }
    cities.forEach((city) => city.setDataValue("category", "city"));
    var mergeResults = clinics.concat(treatments, symptoms, generaltags, cities);
    await Promise.all(
      mergeResults.map(async (result) => {
        result.dataValues.postNum = await result.countCommunties();
      })
    );
    var sortReuslts = mergeResults.sort(function async(a, b) {
      return b.dataValues.postNum - a.dataValues.postNum;
    });
    return {
      statusCode: 200,
      body: JSON.stringify(sortReuslts),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.keywordSearchResults = async function keywordSearchResults(event) {
  try {
    const token = event.headers.Authorization;
    const query = event.queryStringParameters.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [search, created] = await Search_record.findOrCreate({
      where: {
        userId: decoded.id,
        query: query,
        category: "keyword",
      },
    });
    if (!created) {
      await Search_record.update(
        {
          category: "keyword",
        },
        {
          where: {
            id: search.id,
          },
        }
      );
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.keywordClinicAutoComplete = async function keywordClinicAutoComplete(event) {
  try {
    const { query } = event.queryStringParameters;
    const sido = await Sido.findAll({
      attributes: ["id", "name", "fullName"],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
    });
    const sigungu = await Sigungu.findAll({
      attributes: ["id", "name", "fullName"],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
    });
    const emd = await City.findAll({
      attributes: ["id", ["emdName", "name"], [Sequelize.literal("CONCAT(sido,' ',sigungu,' ',emdName)"), "fullName"]],
      where: Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
        [Sequelize.Op.like]: `%${query}%`,
      }),
    });
    const cities = sido.concat(sigungu, emd);
    cities.forEach((city) => city.setDataValue("category", "city"));
    const clinics = await Dental_clinic.findAll({
      attributes: ["id", ["originalName", "name"]],
      where: {
        name: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
    });
    clinics.forEach((clinic) => clinic.setDataValue("category", "clinic"));
    const mergeResults = cities.concat(clinics);
    var sortReuslts = mergeResults.sort(function async(a, b) {
      return b.name - a.name;
    });
    return {
      statusCode: 200,
      body: JSON.stringify(sortReuslts),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
