const jwt = require("jsonwebtoken");
const { Search_record } = require("../utils/models");

module.exports.getRecent = async function getRecentSearch(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const recentSearch = await Search_record.findAll({
      where: {
        userId: decoded.id,
      },
      attributes: ["id", "query", "category", "updatedAt"],
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
    if (searchId !== "all") {
      await Search_record.destroy({
        where: {
          userId: decoded.id,
          id: searchId,
        },
      });
    } else {
      await Search_record.destroy({
        where: {
          userId: decoded.id,
          category: category,
        },
      });
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
