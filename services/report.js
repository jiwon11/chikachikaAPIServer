const { sequelize } = require("../utils/models");

module.exports.postClinicReport = async function postClinicReport(event) {
  try {
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
