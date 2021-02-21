const db = require("../utils/models");
const Sequelize = require("sequelize");
const moment = require("moment");
require("moment/locale/ko");
module.exports.postAppointment = async function postAppointment(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      const clinicId = event.queryStringParameters.clinicId;
      const clinic = await db.Dental_clinic.findOne({
        where: {
          id: clinicId,
        },
      });
      console.log(moment().tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"));
      await user.addAppointmentClinics(clinic, {
        through: {
          time: moment().tz(process.env.TZ).format("YYYY-MM-DD HH:mm:ss"),
        },
      });
      return {
        statusCode: 200,
        body: `{"statusText": "OK","message": "병원 예약 전화 기록에 추가하였습니다."}`,
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

module.exports.getAppointment = async function getAppointment(event) {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });
    if (user) {
      var appointmentClincs = await user.getAppointmentClinics({
        attributes: ["id", "originalName", "telNumber"],
        include: [
          {
            model: db.DentalClinicProfileImg,
            limit: 1,
            order: [["represent", "DESC"]],
          },
        ],
      });
      var week = ["일", "월", "화", "수", "목", "금", "토"];
      moment.locale("ko");
      const mapAppointmentClincs = appointmentClincs.map((clinic) => ({
        id: clinic.id,
        originalName: clinic.originalName,
        telNumber: clinic.telNumber,
        date: clinic.appointment.createdAt.split(" ")[0],
        day: week[new Date(clinic.appointment.createdAt.split(" ")[0]).getDay()],
        time: moment(new Date(clinic.appointment.createdAt)).format("LTS"),
        createdAt: clinic.appointment.createdAt,
        dentalClinicProfileImgs: clinic.dentalClinicProfileImgs,
      }));
      var sortAppointmentClincs = mapAppointmentClincs.sort(function async(a, b) {
        return b.createdAt < a.createdAt ? -1 : 1;
      });
      return {
        statusCode: 200,
        body: JSON.stringify(sortAppointmentClincs),
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
