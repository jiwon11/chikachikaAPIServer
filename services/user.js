const { City, User } = require("../utils/models");
const jwt = require("jsonwebtoken");

module.exports.getUserInfo = async function getUserInfo(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const userInfo = await User.findOne({
      where: {
        id: userId,
      },
      attributes: ["id", "nickname", "profileImg", "phoneNumber", "gender", "birthdate", "provider"],
      include: [
        {
          model: City,
          as: "Residences",
          attributes: ["id", "sido", "sigungu", "emdName"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    return {
      statusCode: 201,
      body: JSON.stringify(userInfo),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};

module.exports.deleteUser = async function deleteUser(event) {
  try {
    const token = event.headers.Authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    await User.destroy({
      where: {
        id: userId,
      },
      force: true,
      individualHooks: true,
    });
    return {
      statusCode: 204,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
