const jwt = require("jsonwebtoken");
const { Symptom_item, Dental_clinic, Treatment_item, User, Review_content, Search_record, GeneralTag, Korea_holiday, City, Sequelize, Sido, Sigungu } = require("../utils/models");

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
    const { lat, long, query, sort, days, time, wantParking, holiday } = event.queryStringParameters;
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
    const clinics = await Dental_clinic.searchAll("keyword", query, nowTime, day, week, todayHoliday, lat, long, limit, offset, sort, wantParking, holiday);
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
      order: [["fullName", "ASC"]],
    });
    const sigungu = await Sigungu.findAll({
      attributes: ["id", "name", "fullName"],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["fullName", "ASC"]],
    });
    const emd = await City.findAll({
      attributes: ["id", ["emdName", "name"], [Sequelize.literal("CONCAT(sido,' ',sigungu,' ',emdName)"), "fullName"]],
      where: {
        emdName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [[Sequelize.literal("CONCAT(sido,' ',sigungu,' ',emdName)"), "ASC"]],
    });
    const cities = sido.concat(sigungu, emd);
    cities.forEach((city) => city.setDataValue("category", "city"));
    const clinics = await Dental_clinic.findAll({
      attributes: ["id", ["originalName", "name"], "address", "local"],
      where: {
        originalName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["originalName", "ASC"]],
    });
    clinics.forEach((clinic) => clinic.setDataValue("category", "clinic"));
    const mergeResults = cities.concat(clinics);
    return {
      statusCode: 200,
      body: JSON.stringify(mergeResults),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
