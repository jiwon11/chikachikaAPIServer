const db = require("../utils/models");
const { sequelize, Sequelize } = require("../utils/models");

module.exports.verifyBills = async function verifyBills(event) {
  try {
    const purpose = event.pathParameters.purpose;
    if (purpose === "permission") {
      console.log(event);
    } else {
      console.log(event);
    }
    return {
      statusCode: 200,
      body: `{ status: "OK" }`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
