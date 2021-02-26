const jwt = require("jsonwebtoken");
const db = require("../utils/models");
const Sequelize = require("sequelize");
const moment = require("moment");
const communityQueryClass = require("../utils/Class/community");

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
      const { lat, long, sq, iq, sort, days, time, wantParking, holiday, tagCategory } = event.queryStringParameters;
      const limit = parseInt(event.queryStringParameters.limit);
      const offset = parseInt(event.queryStringParameters.offset);
      if (!sq) {
        return {
          statusCode: 400,
          body: `{"statusText": "Bad Request","message": "검색어를 입력해주새요."}`,
        };
      }
      if (user) {
        if (iq !== "") {
          const [search, created] = await db.Search_record.findOrCreate({
            where: {
              userId: user.id,
              inputQuery: iq,
              searchQuery: sq,
              category: tagCategory,
              route: "keywordClinicSearch",
            },
          });
          if (!created) {
            await db.Search_record.update(
              {
                userId: user.id,
                inputQuery: iq,
                searchQuery: sq,
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
      const clinics = await db.Dental_clinic.searchAll(db, "keyword", sq, nowTime, day, week, lat, long, null, null, limit, offset, sort, wantParking, holiday);
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
          attributes: [
            "id",
            "nickname",
            "profileImg",
            "userProfileImgKeyValue",
            [Sequelize.fn("CONCAT", `${cloudFrontUrl}`, Sequelize.col("userProfileImgKeyValue"), "?w=140&h=140&f=jpeg&q=100"), "img_thumbNail"],
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
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const query = event.queryStringParameters.q;
    const purpose = event.pathParameters.purpose;
    const queryLen = query.length;
    const clinics = await db.Dental_clinic.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name", "originalName", "address", "local"],
      order: [["originalName", "ASC"]],
      limit: 5,
    });
    clinics.forEach((clinic) => {
      if (clinic.dataValues.originalName.substr(0, queryLen) === query) {
        clinic.setDataValue("initialLetterContained", true);
      } else {
        clinic.setDataValue("initialLetterContained", false);
      }
      clinic.setDataValue("category", "clinic");
    });
    const treatments = await db.Treatment_item.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      limit: 3,
    });
    treatments.forEach((treatment) => {
      if (treatment.dataValues.name.substr(0, queryLen) === query) {
        treatment.setDataValue("initialLetterContained", true);
      } else {
        treatment.setDataValue("initialLetterContained", false);
      }
      treatment.setDataValue("category", "treatment");
    });
    const symptoms = await db.Symptom_item.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      limit: 3,
    });
    symptoms.forEach((symptom) => {
      if (symptom.dataValues.name.substr(0, queryLen) === query) {
        symptom.setDataValue("initialLetterContained", true);
      } else {
        symptom.setDataValue("initialLetterContained", false);
      }
      symptom.setDataValue("category", "symptom");
    });
    const generaltags = await db.GeneralTag.findAll({
      where: {
        name: {
          [Sequelize.Op.like]: `${query}%`,
        },
      },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      limit: 5,
    });
    generaltags.forEach((generaltag) => {
      if (generaltag.dataValues.name.substr(0, queryLen) === query) {
        generaltag.setDataValue("initialLetterContained", true);
      } else {
        generaltag.setDataValue("initialLetterContained", false);
      }
      generaltag.setDataValue("category", "general");
    });
    var cities;
    var sido = [];
    var sigungu = [];
    if (purpose === "autoComplete") {
      // 수다방 글 작성 시, 자동완성용 API
      cities = await db.City.findAll({
        where: Sequelize.where(Sequelize.literal("CONCAT(emdName, '(',REPLACE(sigungu,' ', '-'),')')"), {
          [Sequelize.Op.like]: `${query}%`,
        }),
        attributes: [
          "id",
          "sido",
          "sigungu",
          "emdName",
          [Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), "fullAddress"],
          [Sequelize.literal("CONCAT(emdName, '(',REPLACE(sigungu,' ', '-'),')')"), "cityName"],
        ],
        group: Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")),
        limit: 5,
      });
      cities.forEach((city) => {
        if (city.dataValues.emdName.substr(0, queryLen) === query) {
          city.setDataValue("initialLetterContained", true);
        } else {
          city.setDataValue("initialLetterContained", false);
        }
        city.setDataValue("isEMD", true);
      });
    } else if (purpose === "keywordSearch") {
      // 통합검색 시, 자동완성용 API
      sido = await db.Sido.findAll({
        attributes: ["id", "name", ["fullName", "fullAddress"]],
        where: {
          fullName: {
            [Sequelize.Op.like]: `%${query}%`,
          },
        },
        order: [["fullName", "ASC"]],
      });
      sido.forEach((sido) => {
        if (sido.dataValues.name.substr(0, queryLen) === query) {
          sido.setDataValue("initialLetterContained", true);
        } else {
          sido.setDataValue("initialLetterContained", false);
        }
        sido.setDataValue("isEMD", false);
      });
      sigungu = await db.Sigungu.findAll({
        attributes: ["id", "name", ["fullName", "fullAddress"]],
        where: {
          fullName: {
            [Sequelize.Op.like]: `%${query}%`,
          },
        },
        limit: 5,
        order: [["fullName", "ASC"]],
      });
      sigungu.forEach((sigungu) => {
        if (sigungu.dataValues.name.substr(0, queryLen) === query) {
          sigungu.setDataValue("initialLetterContained", true);
        } else {
          sigungu.setDataValue("initialLetterContained", false);
        }
        sigungu.setDataValue("isEMD", false);
      });
      cities = await db.City.findAll({
        where: Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
          [Sequelize.Op.like]: `%${query}%`,
        }),
        attributes: ["id", ["emdName", "name"], "sido", "sigungu", [Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), "fullAddress"]],
        group: Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")),
        limit: 5,
      });
      cities.forEach((city) => {
        if (city.dataValues.name.substr(0, queryLen) === query) {
          city.setDataValue("initialLetterContained", true);
        } else {
          city.setDataValue("initialLetterContained", false);
        }
        city.setDataValue("isEMD", true);
      });
    }
    cities = cities.concat(sido, sigungu);
    cities.forEach((city) => city.setDataValue("category", "city"));
    cities = cities.sort(function async(a, b) {
      return a.dataValues.fullName < b.dataValues.fullName ? -1 : a.dataValues.fullName > b.dataValues.fullName ? 1 : 0;
    });
    var mergeResults = cities.concat(treatments, symptoms, generaltags, clinics);
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
    const type = event.pathParameters.type;
    const userId = decoded.id;
    const sq = event.queryStringParameters.sq;
    const iq = event.queryStringParameters.iq;
    const limit = parseInt(event.queryStringParameters.limit);
    const offset = parseInt(event.queryStringParameters.offset);
    const order = event.queryStringParameters.order;
    const region = event.queryStringParameters.region;
    const cityId = event.queryStringParameters.cityId;
    const tagCategory = event.queryStringParameters.tagCategory;
    const tagId = event.queryStringParameters.tagId;
    const lat = event.queryStringParameters.lat;
    const long = event.queryStringParameters.long;
    const unifiedSearch = event.queryStringParameters.unifiedSearch;
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
      if (unifiedSearch === "true") {
        if (iq !== "") {
          const [search, created] = await db.Search_record.findOrCreate({
            where: {
              userId: user.id,
              inputQuery: iq,
              searchQuery: sq,
              category: tagCategory,
              route: "keywordClinicSearch",
            },
          });
          if (!created) {
            await db.Search_record.update(
              {
                userId: user.id,
                inputQuery: iq,
                searchQuery: sq,
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
      }
      switch (type) {
        case "community":
          const communityType = event.queryStringParameters.type === "All" ? ["Question", "FreeTalk"] : [event.queryStringParameters.type];
          const communityResult = await db.Community.getKeywordSearchAll(db, communityType, sq, tagCategory, tagId, userId, clusterQuery, offset, limit, order);
          console.log(`${type} results Num: ${communityResult.length}`);
          return {
            statusCode: 200,
            body: JSON.stringify(communityResult),
          };
        case "review":
          console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
          const reviewResult = await db.Review.getKeywordSearchAll(db, userId, sq, tagCategory, tagId, clusterQuery, limit, offset, order);
          console.log(`${type} results Num: ${reviewResult.length}`);
          return {
            statusCode: 200,
            body: JSON.stringify(reviewResult),
          };
        case "clinic":
          console.log(`cluster: ${JSON.stringify(clusterQuery)}`);
          const clinicResult = await db.Dental_clinic.getKeywordSearchAll(db, lat, long, sq, tagCategory, tagId, clusterQuery, limit, offset, order);
          console.log(`${type} results Num: ${clinicResult.length}`);
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
      attributes: ["id", "name", ["fullName", "fullAddress"]],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["fullName", "ASC"]],
    });
    sido.forEach((sido) => {
      sido.setDataValue("category", "city");
      if (sido.dataValues.name.substr(0, queryLen) === query) {
        sido.setDataValue("initialLetterContained", true);
      } else {
        sido.setDataValue("initialLetterContained", false);
      }
      sido.setDataValue("isEMD", false);
    });
    const sigungu = await db.Sigungu.findAll({
      attributes: ["id", "name", ["fullName", "fullAddress"]],
      where: {
        fullName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["fullName", "ASC"]],
      limit: 5,
    });
    sigungu.forEach((sigungu) => {
      sigungu.setDataValue("category", "city");
      if (sigungu.dataValues.name.substr(0, queryLen) === query) {
        sigungu.setDataValue("initialLetterContained", true);
      } else {
        sigungu.setDataValue("initialLetterContained", false);
      }
      sigungu.setDataValue("isEMD", false);
    });
    const emd = await db.City.findAll({
      attributes: [
        "id",
        ["emdName", "name"],
        "sido",
        "sigungu",
        [Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), "fullAddress"],
        [Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("adCity")), "adFullAddress"],
      ],
      where: Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")), {
        [Sequelize.Op.like]: `%${query}%`,
      }),
      group: Sequelize.fn("CONCAT", Sequelize.col("sido"), " ", Sequelize.col("sigungu"), " ", Sequelize.col("emdName")),
      order: [["fullCityName", "ASC"]],
      limit: 5,
    });
    emd.forEach((emd) => {
      emd.setDataValue("category", "city");
      if (emd.dataValues.name.substr(0, queryLen) === query) {
        emd.setDataValue("initialLetterContained", true);
      } else {
        emd.setDataValue("initialLetterContained", false);
      }
      emd.setDataValue("isEMD", true);
    });
    const cities = sido.concat(sigungu, emd);
    const clinics = await db.Dental_clinic.findAll({
      attributes: ["id", "name", "originalName", "address", "local"],
      where: {
        originalName: {
          [Sequelize.Op.like]: `%${query}%`,
        },
      },
      order: [["originalName", "ASC"]],
      limit: 3,
    });
    clinics.forEach((clinic) => {
      if (clinic.dataValues.name.substr(0, queryLen) === query) {
        clinic.setDataValue("initialLetterContained", true);
      } else {
        clinic.setDataValue("initialLetterContained", false);
      }
      clinic.setDataValue("category", "clinic");
    });
    const mergeResults = cities.concat(clinics);
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
