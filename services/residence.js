const jwt = require("jsonwebtoken");
const { User, City, Residence, sequelize } = require("../utils/models");
const Sequelize = require("sequelize");
module.exports.searchCities = async function searchCities(event) {
  try {
    const query = event.queryStringParameters.q;
    const offset = parseInt(event.queryStringParameters.offset);
    const limit = parseInt(event.queryStringParameters.limit);
    const cities = await City.searchAll("keyword", query, null, offset, limit);
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
    const currentCity = await City.current(long, lat);
    const intersectCities = await City.searchAll("intersect", null, currentCity, null, null);
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
    const userResidence = await user.getResidences({
      attributes: ["id", "emdName"],
      order: sequelize.literal("`UsersCities`.`createdAt` DESC"),
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
      await user.addResidences(city, {
        through: {
          now: false,
        },
      });
      return {
        statusCode: 201,
        body: `{"statusText": "Accepted","message": "${user.nickname}님의 거주지에 ${city.emdName}를 추기하였습니다."}`,
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
    const preResidences = await user.getResidences({
      attributes: ["id", "emdName"],
      where: {
        id: preCityId,
      },
    });
    console.log("preResidences NOW: ", preResidences[0].UsersCities.now);
    const preCity = await City.findOne({
      attributes: ["id", "emdName"],
      where: {
        id: preCityId,
      },
    });
    await user.removeResidences(preCity);
    const city = await City.findOne({
      attributes: ["id", "emdName"],
      where: {
        id: cityId,
      },
    });
    const preResidencesNow = preResidences[0].UsersCities.now === true ? true : false;
    await user.addResidences(city, {
      through: {
        now: preResidencesNow,
      },
    });
    return {
      statusCode: 201,
      body: `{"statusText": "Accepted","message": "${user.nickname}님의 거주지가 ${city.emdName}(으)로 수정되었습니다."}`,
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
    const deletedResidence = await user.getResidences({
      where: {
        id: cityId,
      },
    });
    if (deletedResidence[0].UsersCities.now === true) {
      const leftResidence = await user.getResidences({
        where: {
          id: {
            [Sequelize.Op.ne]: cityId,
          },
        },
      });
      if (leftResidence.length > 0) {
        await Residence.update(
          {
            now: true,
          },
          {
            where: { city: leftResidence[0].id, resident: user.id },
          }
        );
      }
    }
    await user.removeResidences(city);
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

module.exports.userResidenceNow = async function userResidenceNow(event) {
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
    await Residence.update(
      {
        now: false,
      },
      {
        where: { now: true, resident: user.id },
      }
    );
    await Residence.update(
      {
        now: true,
      },
      {
        where: { city: cityId, resident: user.id },
      }
    );
    return {
      statusCode: 201,
      body: `{"statusText": "Accepted","message": "${user.nickname}님의 현재 거주지가 수정되었습니다."}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
