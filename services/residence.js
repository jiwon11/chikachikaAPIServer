const jwt = require("jsonwebtoken");
const { User, City } = require("../utils/models");
const { sequelize, Sequelize } = require("../utils/models");
const city = require("../utils/models/city");
const user = require("../utils/models/user");

module.exports.findCities = async function findCities(event) {
  try {
    const query = event.queryStringParameters.q;
    const offset = parseInt(event.queryStringParameters.offset);
    const limit = parseInt(event.queryStringParameters.limit);
    const cities = await City.findAll({
      define: {
        timestamps: false,
      },
      attributes: [
        "id",
        "sido",
        "sigungu",
        "emdName",
        [Sequelize.literal("CONCAT(sido, ' ', sigungu, ' ',emdName)"), "fullCityName"],
        [Sequelize.literal("GROUP_CONCAT(IF(legalCity != emdName, legalCity, NULL))"), "relativeAddress"],
      ],
      group: "emdName",
      having: {
        [Sequelize.Op.or]: [
          {
            fullCityName: {
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
      offset: offset,
      limit: limit,
      order: [[Sequelize.literal("CONCAT(sido, ' ', sigungu, ' ',emdName)"), "ASC"]],
    });
    return {
      statusCode: 200,
      body: JSON.stringify(cities),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.getUserResidence = async function getUserResidence(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    const userResidence = await user.getCities({
      attributes: ["id", "emdName"],
      through: {
        attributes: [],
      },
    });
    return {
      statusCode: 200,
      body: JSON.stringify(userResidence),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.addUserResidence = async function addUserResidence(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { cityId } = JSON.parse(event.body);
    const user = await User.findOne({
      where: {
        id: userId,
      },
      include: [
        {
          model: City,
          as: "Cities",
          attributes: ["id", "emdName"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    if (user.Cities.length == 2) {
      return {
        statusCode: 400,
        body: `{"statusText": "Upper Set Cities","message": "거주지는 2곳을 초과할 수 없습니다."}`,
      };
    } else {
      const userResidenced = user.Cities.find((city) => city.id === parseInt(cityId));
      if (userResidenced) {
        return {
          statusCode: 400,
          body: `{"statusText": "Unaccepted","message": "이미 설정한 거주지입니다."}`,
        };
      }
      const city = await City.findOne({
        attributes: ["id", "emdName"],
        where: {
          id: cityId,
        },
      });
      await user.addCities(city);
      return {
        statusCode: 201,
        body: `{"statusText": "Accepted","message": "${user.nickname}님의 거주지가 ${city.emdName}로 설정되었습니다."}`,
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

module.exports.changeUserResidence = async function changeUserResidence(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { preCityId, cityId } = JSON.parse(event.body);
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    const preCity = await City.findOne({
      attributes: ["id", "emdName"],
      where: {
        id: preCityId,
      },
    });
    await user.removeCities(preCity);
    const city = await City.findOne({
      attributes: ["id", "emdName"],
      where: {
        id: cityId,
      },
    });
    await user.addCities(city);
    return {
      statusCode: 201,
      body: `{"statusText": "Accepted","message": "${user.nickname}님의 거주지가 ${preCity.emdName}에서 ${city.emdName}(으)로 수정되었습니다."}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.deleteUserResidence = async function deleteUserResidence(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { cityId } = JSON.parse(event.body);
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    const city = await City.findOne({
      attributes: ["id", "emdName"],
      where: {
        id: cityId,
      },
    });
    await user.removeCities(city);
    return {
      statusCode: 204,
      body: `{"statusText": "Accepted","message": "${user.nickname}님의 거주지가 삭제 되었습니다."}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};