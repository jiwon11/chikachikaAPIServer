const jwt = require("jsonwebtoken");
const db = require("../utils/models");
const Sequelize = require("sequelize");
const moment = require("moment");

module.exports.treatmentItems = async function treatmentItems(event) {
  try {
    const query = event.queryStringParameters.q;
    const treatments = await db.Treatment_item.findAll({
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
    const symptoms = await db.Symptom_item.findAll({
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
    const clinics = await db.Dental_clinic.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name", "local", "address", "originalName"],
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
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const { lat, long, query, sort, days, time, wantParking, holiday } = event.queryStringParameters;
      const limit = parseInt(event.queryStringParameters.limit);
      const offset = parseInt(event.queryStringParameters.offset);
      if (!query) {
        return {
          statusCode: 400,
          body: `{"statusText": "Bad Request","message": "검색어를 입력해주새요."}`,
        };
      }
      if (user) {
        await db.Search_record.create({
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
          const today = moment().tz(process.env.TZ);
          const weekDay = ["sun", "mon", "tus", "wed", "thu", "fri", "sat"];
          const day = weekDay[today.day()];
          week[day] = time;
        }
      }
      var weekDay = ["Sun", "Mon", "Tus", "Wed", "Thu", "Fri", "Sat"];
      const today = moment().tz(process.env.TZ);
      const nowTime = `${today.hour()}:${today.minute()}:${today.second()}`;
      const day = weekDay[today.day()];
      const todayHoliday = await db.Korea_holiday.findAll({
        where: {
          date: today,
        },
      });
      console.log(day, nowTime);
      console.log(todayHoliday);
      const clinics = await db.Dental_clinic.searchAll("keyword", query, nowTime, day, week, todayHoliday, lat, long, limit, offset, sort, wantParking, holiday);
      let response = {
        statusCode: 200,
        body: JSON.stringify(clinics),
      };
      return response;
    }
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
    const searchUser = await db.User.findOne({
      where: {
        id: decoded.id,
      },
    });
    const treatment = await db.Treatment_item.findOne({
      where: {
        id: treatmentId,
      },
    });
    const [search, created] = await db.Search_record.findOrCreate({
      where: {
        userId: searchUser.id,
        query: treatment.name,
        category: "review",
      },
    });
    if (!created) {
      await db.Search_record.update(
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
    const clinics = await db.Dental_clinic.findAll({
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
    const treatments = await db.Treatment_item.findAll({
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
    const symptoms = await db.Symptom_item.findAll({
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
    const generaltags = await db.GeneralTag.findAll({
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
      cities = await db.City.findAll({
        where: {
          relativeAddress: {
            [Sequelize.Op.like]: `%${query}%`,
          },
        },
        attributes: ["id", "sido", "sigungu", "adCity", "emdName", "fullCityName", "relativeAddress", [Sequelize.literal("CONCAT(emdName, '(',REPLACE(sigungu,' ', '-'),')')"), "cityName"]],
        offset: offset,
        limit: limit,
      });
    } else if (purpose === "keywordSearch") {
      cities = await db.City.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              relativeAddress: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
            {
              relativeAddress: {
                [Sequelize.Op.like]: `%${query}%`,
              },
            },
          ],
        },
        attributes: ["id", "sido", "sigungu", "adCity", "emdName", "fullCityName", "relativeAddress"],
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
    const type = event.pathParameters.type;
    const userId = decoded.id;
    const limit = parseInt(event.queryStringParameters.limit);
    const offset = parseInt(event.queryStringParameters.offset);
    const order = event.queryStringParameters.order;
    const region = event.queryStringParameters.region;
    const cityId = event.queryStringParameters.cityId;
    const [search, created] = await db.Search_record.findOrCreate({
      where: {
        userId: userId,
        query: query,
        category: "keyword",
      },
    });
    if (!created) {
      await db.Search_record.update(
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
    var clusterQuery;
    if (region === "residence") {
      var userResidence = await db.City.findOne({
        where: {
          id: cityId,
        },
      });
      clusterQuery = userResidence.newTownId
        ? {
            newTownId: userResidence.newTownId,
          }
        : {
            sigungu: userResidence.sigungu,
          };
    } else if (region !== "all") {
      return {
        statusCode: 400,
        body: { statusText: "Bad Request", message: "유효하지 않는 쿼리입니다." },
      };
    }
    switch (type) {
      case "community":
        const communityType = event.queryStringParameters.type === "All" ? ["Question", "FreeTalk"] : [event.queryStringParameters.type];
        console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
        const communityResult = await db.Community.getKeywordSearchAll(db, communityType, query, userId, clusterQuery, offset, limit, order);
        console.log(`${type} results Num: ${communityResult.length}`);
        return {
          statusCode: 200,
          body: JSON.stringify(communityResult),
        };
      case "review":
        console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
        const reviewResult = await db.Review.getKeywordSearchAll(db, userId, query, clusterQuery, limit, offset, order);
        console.log(`${type} results Num: ${reviewResult.length}`);
        return {
          statusCode: 200,
          body: JSON.stringify(reviewResult),
        };
      default:
        break;
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.keywordClinicAutoComplete = async function keywordClinicAutoComplete(event) {
  try {
    const { query } = event.queryStringParameters;
    const sido = await db.Sido.findAll({
      attributes: ["id", "name", "fullName"],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["fullName", "ASC"]],
    });
    const sigungu = await db.Sigungu.findAll({
      attributes: ["id", "name", "fullName"],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["fullName", "ASC"]],
    });
    const emd = await db.City.findAll({
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
    const clinics = await db.Dental_clinic.findAll({
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
