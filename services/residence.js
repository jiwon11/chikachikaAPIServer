const jwt = require("jsonwebtoken");
const { User, City } = require("../utils/models");
const { sequelize, Sequelize } = require("../utils/models");

module.exports.searchCities = async function searchCities(event) {
  try {
    const query = event.queryStringParameters.q;
    const offset = parseInt(event.queryStringParameters.offset);
    const limit = parseInt(event.queryStringParameters.limit);
    const cities = await City.findAll({
      logging: true,
      attributes: [
        "id",
        "sido",
        "sigungu",
        "emdName",
        "legalCity",
        "relativeAddress",
        [Sequelize.literal("CONCAT(sido, ' ', sigungu, ' ',emdName)"), "fullCityName"],
        [Sequelize.literal("(SELECT COUNT(*) FROM dental_clinics WHERE dental_clinics.cityId = cities.id)"), "clinicsNum"],
      ],
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

module.exports.citiesBycurrentLocation = async function citiesBycurrentLocation(event) {
  try {
    const long = event.queryStringParameters.long;
    const lat = event.queryStringParameters.lat;
    const currentCity = await City.findOne({
      attributes: [
        "id",
        "sido",
        "sigungu",
        "emdName",
        "legalCity",
        "geometry",
        "relativeAddress",
        [Sequelize.literal("CONCAT(sido, ' ', sigungu, ' ',emdName)"), "fullCityName"],
        [Sequelize.literal("(SELECT COUNT(*) FROM dental_clinics WHERE dental_clinics.cityId = cities.id)"), "clinicsNum"],
      ],
      where: Sequelize.literal(`MBRContains(geometry,ST_GeomFromText("point(${long} ${lat})"))`),
      raw: true,
    });
    console.log(currentCity.sido, " ", currentCity.sigungu, " ", currentCity.emdName);
    const intersectCities = await City.findAll({
      attributes: [
        "id",
        "sido",
        "sigungu",
        "emdName",
        "legalCity",
        "relativeAddress",
        [Sequelize.literal("CONCAT(sido,' ', sigungu,' ',emdName)"), "fullCityName"],
        [Sequelize.literal("(SELECT COUNT(*) FROM dental_clinics WHERE dental_clinics.cityId = cities.id)"), "clinicsNum"],
      ],
      where: Sequelize.literal(`MBRIntersects(geometry, ST_GeomFromGeoJSON('${JSON.stringify(currentCity.geometry)}',2,0)) AND cities.id != ${currentCity.id}`),
      raw: true,
    });
    delete currentCity.geometry;
    const results = {
      currentCity: currentCity,
      intersectCities: intersectCities,
    };
    return {
      statusCode: 200,
      body: JSON.stringify(results),
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
          as: "Residences",
          attributes: ["id", "emdName"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    if (user.Residences.length == 2) {
      return {
        statusCode: 403,
        body: `{"statusText": "Upper Set Cities","message": "거주지는 2곳을 초과할 수 없습니다."}`,
      };
    } else {
      const userResidenced = user.Residences.find((city) => city.id === parseInt(cityId));
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
