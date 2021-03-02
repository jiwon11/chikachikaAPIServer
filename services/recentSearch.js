const jwt = require("jsonwebtoken");
const db = require("../utils/models");

module.exports.postRecentSearch = async function postRecentSearch(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const tagCategory = event.queryStringParameters.tagCategory;
    const sq = event.queryStringParameters.sq;
    const iq = event.queryStringParameters.iq;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      if (iq !== "") {
        const [search, created] = await db.Search_record.findOrCreate({
          where: {
            userId: user.id,
            inputQuery: iq,
            searchQuery: sq,
            category: tagCategory,
            route: "keywordSearch",
          },
        });
        if (!created) {
          await db.Search_record.update(
            {
              userId: user.id,
              inputQuery: iq,
              searchQuery: sq,
              category: tagCategory,
              route: "keywordSearch",
            },
            {
              where: {
                id: search.id,
              },
            }
          );
        }
        return {
          statusCode: 200,
          body: `{"statusText": "OK"}`,
        };
      } else {
        return {
          statusCode: 400,
          body: { statusText: "Bad Request", message: "유효하지 않는 쿼리입니다." },
        };
      }
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

module.exports.getRecent = async function getRecentSearch(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const unified = event.queryStringParameters.unifiedSearch;
    var route;
    if (unified === "false") {
      route = "keywordClinicSearch";
    } else {
      route = "keywordSearch";
    }
    const recentSearch = await db.Search_record.findAll({
      where: {
        userId: decoded.id,
        route: route,
      },
      attributes: ["id", "searchQuery", "inputQuery", "category", "updatedAt"],
      order: [["updatedAt", "DESC"]],
    });
    return {
      statusCode: 200,
      body: JSON.stringify(recentSearch),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.delRecent = async function delRecentSearch(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const searchId = event.queryStringParameters.searchId;
    const unified = event.queryStringParameters.unifiedSearch;
    if (searchId !== "all") {
      await db.Search_record.destroy({
        where: {
          userId: decoded.id,
          id: searchId,
        },
      });
    } else {
      if (unified === "true") {
        await db.Search_record.destroy({
          where: {
            userId: decoded.id,
            route: "keywordSearch",
          },
        });
      } else if (unified === "false") {
        await db.Search_record.destroy({
          where: {
            userId: decoded.id,
            route: "keywordClinicSearch",
          },
        });
      } else {
        return {
          statusCode: 400,
          body: `{ statusText: "Bad Request", message: "유효하지 않는 쿼리 파라미터입니다." }`,
        };
      }
    }
    return {
      statusCode: 204,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
