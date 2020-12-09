const { Dental_subject, Dental_clinic } = require("../utils/models");

module.exports.importDentalSubject = async function importDentalSubject(event) {
  try {
    const subjects = ["구강내과", "구강병리과", "구강악안면외과", "영상치의학과", "예방치과", "치과교정과", "치과보존과", "치과보철과", "치주과", "통합치의학과"];
    for (var subject of subjects) {
      await Dental_subject.create({
        name: subject,
      });
    }
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};

module.exports.clinicSubjects = async function clinicSubjects(event) {
  try {
    const dentalSubjectDatabase = require("../dental_clinic_json/dental_subject_database.json");
    for (var data of dentalSubjectDatabase) {
      const subject = await Dental_subject.findOne({
        where: {
          name: data.dental_subject_ID,
        },
      });
      const clinic = await Dental_clinic.findOne({
        where: {
          ykiho: data.dental_clinic_ID,
        },
      });
      if (clinic) {
        await clinic.addSubject(subject);
        console.log(clinic.name);
      }
    }
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};
