const { Dental_clinic, City } = require("../utils/models");
const { sequelize, Sequelize } = require("../utils/models");
const { QueryTypes } = require("sequelize");

module.exports.importDentalClinic = async function importDentalClinic(event) {
  try {
    const clinicInfos = require("../dental_clinic_json/korea_hospital_database.json");
    var i = 0;
    for (var clinicInfo of clinicInfos) {
      const existClinc = await Dental_clinic.findOne({
        where: {
          ykiho: clinicInfo.암호화YKIHO코드,
        },
      });
      if (!existClinc) {
        const clinic = await Dental_clinic.create({
          ykiho: clinicInfo.암호화YKIHO코드,
          name: clinicInfo.name,
          local: clinicInfo.local,
          address: clinicInfo.address,
          telNumber: clinicInfo.telNumber,
          website: clinicInfo.website,
          launchDate: clinicInfo.launchDate,
          geographLong: clinicInfo.long,
          geographLat: clinicInfo.lat,
          CD_Num: clinicInfo.CD_Num,
          SD_Num: clinicInfo.SD_Num,
          RE_Num: clinicInfo.RE_Num,
          IN_Num: clinicInfo.IN_Num,
          Mon_Consulation_start_time: clinicInfo.Mon_Consulation_start_time, //진료시간
          Mon_Consulation_end_time: clinicInfo.Mon_Consulation_end_time,
          Tus_Consulation_start_time: clinicInfo.Tus_Consulation_start_time,
          Tus_Consulation_end_time: clinicInfo.Tus_Consulation_end_time,
          Wed_Consulation_start_time: clinicInfo.Wed_Consulation_start_time,
          Wed_Consulation_end_time: clinicInfo.Wed_Consulation_end_time,
          Thu_Consulation_start_time: clinicInfo.Thu_Consulation_start_time,
          Thu_Consulation_end_time: clinicInfo.Thu_Consulation_end_time,
          Fri_Consulation_start_time: clinicInfo.Fri_Consulation_start_time,
          Fri_Consulation_end_time: clinicInfo.Fri_Consulation_end_time,
          Sat_Consulation_start_time: clinicInfo.Sat_Consulation_start_time,
          Sat_Consulation_end_time: clinicInfo.Sat_Consulation_end_time,
          weekday_TOR: clinicInfo.weekday_TOR, //접수시간
          Sat_TOR: clinicInfo.Sat_TOR,
          weekday_TOL_start: clinicInfo.weekday_TOL_start,
          weekday_TOL_end: clinicInfo.weekday_TOL_end,
          sat_TOL_start: clinicInfo.Sat_TOL_start,
          sat_TOL_end: clinicInfo.Sat_TOL_end,
          weekday_TOL_notice: clinicInfo.weekday_TOL_notice,
          sat_TOL_notice: clinicInfo.Sat_TOL_notice,
          weekend_non_consulation_notice: clinicInfo.weekend_non_consulation_notice,
          parking_allow_num: clinicInfo.parking_allow_num,
          parking_cost: clinicInfo.parking_cost,
          parking_others_notice: clinicInfo.parking_others_notice,
        });
        i++;
        console.log(`${i}번째 : ${clinic.name}`);
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

const axios = require("axios");
const convert = require("xml-js");
const iconvlite = require("iconv-lite");

module.exports.getNonPaymentItemHospList = async function getNonPaymentItemHospList(event) {
  const secretKey = "0XnAzkR5iFgXoj2TyjdseowDsMtFV%2FMP5D6nrbEY0VQomcjM5gdx9y%2BNrveV2KRE2ar48boNcPXlXxoWWGm%2Bew%3D%3D";
  const ykiho = "JDQ4MTg4MSM1MSMkMSMkMCMkNjIkMzgxMzUxIzExIyQxIyQzIyQ3MiQ0NjEwMDIjNjEjJDEjJDQjJDgz";
  try {
    const response = await axios.get(`http://apis.data.go.kr/B551182/nonPaymentDamtInfoService/getNonPaymentItemHospList2?ServiceKey=${secretKey}&clCd=41&ykiho=${ykiho}`);
    //const parseResponse = convert.xml2json(response.data, { compact: true, spaces: 4 });
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};

module.exports.duplicateNameClinics = async function duplicateNameClinics(event) {
  try {
    const clinicNames = await sequelize.query("SELECT name, COUNT(name) FROM dental_clinics GROUP BY name HAVING COUNT(name) >= 2;", { type: QueryTypes.SELECT });
    console.log(clinicNames);
    for (const clinicName of clinicNames) {
      const duplicateClinics = await Dental_clinic.findAll({
        where: {
          name: clinicName.name,
        },
      });
      for (const dupliClinic of duplicateClinics) {
        const name = dupliClinic.dataValues.name;
        const locals = dupliClinic.dataValues.local.split(" ");
        await Dental_clinic.update(
          {
            name: `${name}(${locals[0]}-${locals[1]})`,
          },
          {
            where: {
              id: dupliClinic.dataValues.id,
            },
          }
        );
        console.log(`updatedClinic Name: ${name}(${locals[0]}-${locals[1]})`);
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(clinicNames),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.importDentalClinicCity = async function importDentalClinicCity(event) {
  try {
    sequelize.sync({});
    const results = {};
    const clinics = await Dental_clinic.findAll({
      attributes: ["id", "name", "local", "address"],
    });
    for (let clinic of clinics) {
      const clinicSido = clinic.address.split(" ")[0];
      const clinicSigungu = clinic.local.split(" ")[0];
      const clinicEmdCity = clinic.local.split(" ")[1];
      const city = await City.findOne({
        where: {
          sido: clinicSido,
          sigungu: clinicSigungu,
          emdName: clinicEmdCity,
        },
        attributes: ["id", "sido", "sigungu", "emdName"],
      });
      if (city) {
        await city.addDental_clinics(clinic);
        console.log(`${clinic.name} : 있음 (${city.sido} ${city.sigungu} ${city.emdName})`);
        results[clinic.name] = `있음 (${city.sido} ${city.sigungu} ${city.emdName})`;
      } else {
        console.log(`${clinic.name} : 없음`);
        results[clinic.name] = "없음";
      }
    }
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
