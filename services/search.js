const jwt = require("jsonwebtoken");
const db = require("../utils/models");
const Sequelize = require("sequelize");
const moment = require("moment");

module.exports.treatmentItems = async function treatmentItems(event) {
  try {
    const query = event.queryStringParameters.q;
    const treatments = await db.Treatment_item.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            usualName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
          {
            technicalName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
        ],
      },
    });
    let response = {
      statusCode: 200,
      body: JSON.stringify(treatments),
    };
    return response;
  } catch (err) {
    console.info("Error", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${err.message}"}`,
    };
  }
};

module.exports.diseaseItems = async function diseaseItems(event) {
  try {
    const query = event.queryStringParameters.q;
    const treatments = await db.Disease_item.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            usualName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
          {
            technicalName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
        ],
      },
    });
    let response = {
      statusCode: 200,
      body: JSON.stringify(treatments),
    };
    return response;
  } catch (err) {
    console.info("Error", err);
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
      console.log(event.queryStringParameters);
      const { lat, long, query, sort, days, time, wantParking, holiday, tagCategory } = event.queryStringParameters;
      const limit = parseInt(event.queryStringParameters.limit);
      const offset = parseInt(event.queryStringParameters.offset);
      if (!query) {
        return {
          statusCode: 400,
          body: `{"statusText": "Bad Request","message": "검색어를 입력해주새요."}`,
        };
      }
      if (user) {
        if (query !== "") {
          const [search, created] = await db.Search_record.findOrCreate({
            where: {
              userId: user.id,
              query: query,
              category: tagCategory,
              route: "keywordClinicSearch",
            },
          });
          if (!created) {
            await db.Search_record.update(
              {
                userId: user.id,
                query: query,
                category: tagCategory,
                route: "keywordClinicSearch",
              },
              {
                where: {
                  id: search.id,
                },
              }
            );
          }
        }
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
      console.log(day, nowTime);
      const clinics = await db.Dental_clinic.searchAll(db, "keyword", query, nowTime, day, week, lat, long, null, null, limit, offset, sort, wantParking, holiday);
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
        query: treatment.usualName,
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
          attributes: [
            "id",
            "nickname",
            "profileImg",
            "userProfileImgKeyValue",
            [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("userProfileImgKeyValue"), "?w=150&h=150&f=png&q=100"), "img_thumbNail"],
          ],
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
      order: [[orderQuery]],
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
    const query = event.queryStringParameters.q;
    const queryLen = query.length;
    const clinics = await db.Dental_clinic.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: [["originalName", "name"]],
      group: ["originalName"],
      order: [["originalName", "ASC"]],
      limit: 5,
    });
    clinics.forEach((clinic) => {
      clinic.setDataValue("category", "clinic");
    });
    const treatments = await db.Treatment_item.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            usualName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
        ],
      },
      attributes: [["usualName", "name"]],
      order: [["usualName", "ASC"]],
      limit: 3,
    });
    treatments.forEach((treatment) => {
      treatment.setDataValue("category", "treatment");
    });
    const diseases = await db.Disease_item.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            usualName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
        ],
      },
      attributes: [["usualName", "name"]],
      order: [["usualName", "ASC"]],
      limit: 3,
    });
    diseases.forEach((disease) => {
      disease.setDataValue("category", "disease");
    });
    const sido = await db.Sido.findAll({
      attributes: ["name", ["fullName", "name"]],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["fullName", "ASC"]],
    });
    const sigungu = await db.Sigungu.findAll({
      attributes: [[Sequelize.fn("CONCAT", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', -1))"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', 1))"), ")"), "name"]],
      where: {
        [Sequelize.Op.or]: [
          Sequelize.where(Sequelize.fn("CONCAT", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', -1))"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', 1))"), ")"), {
            [Sequelize.Op.like]: `%${query}%`,
          }),
          {
            fullName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
        ],
      },
      limit: 5,
      order: [["fullName", "ASC"]],
    });
    const cities = await db.City.findAll({
      where: Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
        [Sequelize.Op.like]: `%${query}%`,
      }),
      attributes: [[Sequelize.literal("CONCAT(emdName, '(',REPLACE(sigungu,' ', '-'),')')"), "name"]],
      group: Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")),
      limit: 5,
    });
    const locations = cities.concat(sido, sigungu);
    locations.forEach((location) => location.setDataValue("category", "city"));
    const sortLocations = locations.sort(function async(a, b) {
      return a.dataValues.fullName < b.dataValues.fullName ? -1 : a.dataValues.fullName > b.dataValues.fullName ? 1 : 0;
    });
    var mergeResults = sortLocations.concat(treatments, clinics, diseases);
    mergeResults.forEach((result) => {
      if (result.dataValues.name.substr(0, queryLen) === query) {
        result.setDataValue("initialLetterContained", true);
      } else {
        result.setDataValue("initialLetterContained", false);
      }
    });
    mergeResults = mergeResults.sort(function async(a, b) {
      return b.dataValues.initialLetterContained - a.dataValues.initialLetterContained;
    });
    return {
      statusCode: 200,
      body: JSON.stringify(mergeResults),
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const resultType = event.pathParameters.type;
    const query = event.queryStringParameters.query;
    const limit = parseInt(event.queryStringParameters.limit);
    const offset = parseInt(event.queryStringParameters.offset);
    const order = event.queryStringParameters.order;
    const region = event.queryStringParameters.region;
    const cityId = event.queryStringParameters.cityId;
    const lat = event.queryStringParameters.lat;
    const long = event.queryStringParameters.long;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
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
              sido: userResidence.sido,
              sigungu: userResidence.sigungu,
            };
      } else if (region !== "all") {
        return {
          statusCode: 400,
          body: { statusText: "Bad Request", message: "유효하지 않는 쿼리입니다." },
        };
      }
      switch (resultType) {
        case "community":
          const communityType = event.queryStringParameters.communityType === "All" ? ["Question", "FreeTalk"] : [event.queryStringParameters.communityType];
          const communityResult = await db.Community.getKeywordSearchAll(db, communityType, query, userId, clusterQuery, offset, limit, order);
          console.log(`${resultType} results Num: ${communityResult.length}`);
          return {
            statusCode: 200,
            body: JSON.stringify(communityResult),
          };
        case "review":
          console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
          const correctionStatus = event.queryStringParameters.correctionStatus;
          const reviewResult = await db.Review.getKeywordSearchAll(db, userId, query, clusterQuery, limit, offset, order, correctionStatus);
          console.log(`${resultType} results Num: ${reviewResult.length}`);
          return {
            statusCode: 200,
            body: JSON.stringify(reviewResult),
          };
        case "clinic":
          console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
          const clinicResult = await db.Dental_clinic.getKeywordSearchAll(db, lat, long, query, clusterQuery, limit, offset, order);
          console.log(`${resultType} results Num: ${clinicResult.length}`);
          return {
            statusCode: 200,
            body: JSON.stringify(clinicResult),
          };
        default:
          break;
      }
    } else {
      return {
        statusCode: 401,
        body: `{"statusText": "Unauthorized","message": "사용자를 찾을 수 없습니다."}`,
      };
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
    const queryLen = query.length;
    const sido = await db.Sido.findAll({
      attributes: ["name", ["fullName", "name"]],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["fullName", "ASC"]],
    });
    const sigungu = await db.Sigungu.findAll({
      attributes: [[Sequelize.fn("CONCAT", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', -1))"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', 1))"), ")"), "name"]],
      where: {
        [Sequelize.Op.or]: [
          Sequelize.where(Sequelize.fn("CONCAT", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', -1))"), "(", Sequelize.literal("(SELECT SUBSTRING_INDEX(fullName, ' ', 1))"), ")"), {
            [Sequelize.Op.like]: `%${query}%`,
          }),
          {
            fullName: {
              [Sequelize.Op.like]: `%${query}%`,
            },
          },
        ],
      },
      limit: 5,
      order: [["fullName", "ASC"]],
    });
    const cities = await db.City.findAll({
      where: Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
        [Sequelize.Op.like]: `%${query}%`,
      }),
      attributes: [[Sequelize.literal("CONCAT(emdName, '(',REPLACE(sigungu,' ', '-'),')')"), "name"]],
      group: Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")),
      limit: 5,
    });
    const locations = cities.concat(sido, sigungu);
    locations.forEach((location) => location.setDataValue("category", "city"));
    const sortLocations = locations.sort(function async(a, b) {
      return a.dataValues.fullName < b.dataValues.fullName ? -1 : a.dataValues.fullName > b.dataValues.fullName ? 1 : 0;
    });
    const clinics = await db.Dental_clinic.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: [["originalName", "name"]],
      group: ["originalName"],
      order: [["originalName", "ASC"]],
      limit: 5,
    });
    clinics.forEach((clinic) => {
      clinic.setDataValue("category", "clinic");
    });
    const mergeResults = sortLocations.concat(clinics);
    mergeResults.forEach((result) => {
      if (result.dataValues.name.substr(0, queryLen) === query) {
        result.setDataValue("initialLetterContained", true);
      } else {
        result.setDataValue("initialLetterContained", false);
      }
    });
    var sortReuslts = mergeResults.sort(function async(a, b) {
      return b.dataValues.initialLetterContained - a.dataValues.initialLetterContained;
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
