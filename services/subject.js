const { Dental_subject, Dental_clinic, Special_treatment } = require("../utils/models");

module.exports.importDentalSubject = async function importDentalSubject(event) {
  try {
    const subjects = ["치과", "구강악안면외과", "치과보철과", "치과교정과", "소아치과", "치주과", "치과보존과", "구강내과", "영상치의학과", "구강병리과", "예방치과", "치과소계", "통합치의학과"];
    for (var subject of subjects) {
      await Dental_subject.create({
        name: subject,
      });
    }
    return {
      statusCode: 200,
      body: `{"statusText": "Accepted"}`,
    };
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
    const dentalSubjectDatabase = require("../dental_clinic_json/dental_treatment_subject.json");
    for (var data of dentalSubjectDatabase) {
      const subject = await Dental_subject.findOne({
        where: {
          name: data.진료과목코드명,
        },
      });
      const clinic = await Dental_clinic.findOne({
        where: {
          ykiho: data.암호화YKIHO코드,
        },
      });
      if (clinic) {
        await clinic.addSubject(subject, {
          through: {
            SpecialistDentist_NUM: data["과목별 전문의수"],
            choiceTreatmentDentist_NUM: data["선택진료 의사수"],
          },
        });
        console.log(clinic.name);
      }
    }
    return {
      statusCode: 200,
      body: `{"statusText": "Accepted"}`,
    };
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};
module.exports.specialTreatment = async function specialTreatment(event) {
  try {
    const nonclinic = [];
    const specialTreatmentDatabase = require("../dental_clinic_json/specialTreatment.json");
    for (var data of specialTreatmentDatabase) {
      const specialTreatment = await Special_treatment.findOne({
        where: {
          name: data.특수진료코드명,
        },
      });
      const clinic = await Dental_clinic.findOne({
        where: {
          ykiho: data.암호화YKIHO코드,
        },
      });
      if (clinic) {
        await clinic.addSpecialTreatment(specialTreatment);
        console.log(clinic.name);
      } else {
        nonclinic.push(data.암호화YKIHO코드);
      }
    }
    return {
      statusCode: 200,
      body: `{"statusText": "Accepted", "nonclinic":${JSON.stringify(nonclinic)}}`,
    };
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};
