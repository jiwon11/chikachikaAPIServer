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
          as: "Cities",
          attributes: ["sido", "sigungu", "emdName"],
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