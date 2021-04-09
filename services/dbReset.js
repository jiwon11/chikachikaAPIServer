const { sequelize, Sequelize } = require("../utils/models");
const { Dental_clinic, Korea_holiday, City, NewTown, Sido, Sigungu } = require("../utils/models");
const { QueryTypes } = require("sequelize");

const request = require("request");
const parser = require("fast-xml-parser");
const db = require("../utils/models");

const zerofill = function (number, digit) {
  return ("00000000" + number).slice(-digit);
};

const getHolidaysByMonth = function (year, month) {
  const secretKey = "0XnAzkR5iFgXoj2TyjdseowDsMtFV%2FMP5D6nrbEY0VQomcjM5gdx9y%2BNrveV2KRE2ar48boNcPXlXxoWWGm%2Bew%3D%3D";
  const url = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo" + "?solYear=" + year + "&solMonth=" + zerofill(month, 2) + "&ServiceKey=" + secretKey;
  return new Promise(function (resolve, reject) {
    request(url, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        reject(error);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error("HTTP Error"));
        return;
      }

      if (!parser.validate(body)) {
        reject(new Error("XML parsing failed"));
        return;
      }

      const parsedXml = parser.parse(body);

      if (parsedXml.OpenAPI_ServiceResponse && parsedXml.OpenAPI_ServiceResponse.cmmMsgHeader) {
        const header = parsedXml.OpenAPI_ServiceResponse.cmmMsgHeader;

        reject(new Error(header.returnAuthMsg || header.errMsg || header.returnReasonCode));
        return;
      }

      if (!parsedXml.response || !parsedXml.response.body) {
        reject(new Error("Response format error"));
        return;
      }

      /*
             {
                items : {
                    item : [   항목이 1개일 경우엔 item에 Array가 아니라 Object로 바로 들어가 있음, 0개일 경우엔 '' 가 들어가 있음.
                        ...
                    ]
                },
                numOfRows: [Number],
                pageNo: [Number],
                totalCount: [Number]
             }
             */
      const data = parsedXml.response.body;
      const holidays = [];
      const addDay = (item) => {
        if (item.isHoliday !== "Y") return;

        item.locdate += "";

        const pushItem = {
          name: item.dateName,
          year: parseInt(item.locdate.substr(0, 4)),
          month: parseInt(item.locdate.substr(4, 2)),
          day: parseInt(item.locdate.substr(6, 2)),
        };
        pushItem.date = [pushItem.year, zerofill(pushItem.month, 2), zerofill(pushItem.day, 2)].join("-");

        holidays.push(pushItem);
      };

      if (data.totalCount && data.totalCount > 1) {
        data.items.item.forEach((item) => {
          addDay(item);
        });
      } else if (data.totalCount === 1) {
        addDay(data.items.item);
      }

      resolve(holidays);
    });
  });
};

const getHolidaysByMonthCount = function (year, month, monthCount = 1) {
  const promiseList = [];

  // 추가 월만큼 반복해서 추가
  for (let i = 0; i < monthCount; i++) {
    const targetYear = year + Math.floor((month + i - 1) / 12);
    const targetMonth = (month + i) % 12 || 12;

    promiseList.push(
      new Promise(function (resolve, reject) {
        setTimeout(function () {
          getHolidaysByMonth(targetYear, targetMonth)
            .then((r) => {
              resolve(r);
            })
            .catch((r) => {
              reject(r);
            });
        }, 100 * Math.max(i - 10, 0)); // 한번에 요청이 많이 나가면 뱉길래 10개 이상부터는 지연시간을 둠
      })
    );
  }

  return Promise.all(promiseList).then((r) => {
    return r.reduce(function (sum, current) {
      return sum.concat(current);
    }, []);
  });
};

module.exports.dbSync = async function dbSync(event) {
  try {
    sequelize.sync({});
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "ok" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.handler = async function dbReset(event) {
  /*
    const clinicNames = await sequelize.query("SELECT name, COUNT(name) FROM dental_clinics GROUP BY name HAVING COUNT(name) >= 2;", { type: QueryTypes.SELECT });
    console.log(clinicNames);
    clinicNames.forEach(async (clinicName) => {
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
    });
    */
  /*
  var year = "2021";
  try {
    const results = await getHolidaysByMonthCount(2021, 1, 12);
    for (const holiday of results) {
      await Korea_holiday.create(
        {
          name: holiday.name,
          date: `${holiday.date}T00:00:00Z`,
        },
        {
          timestamps: false,
        }
      );
    }
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
    const groupingCities = await City.findAll({
      attributes: [
        "id",
        "sido",
        "sigungu",
        "emdName",
        "legalCity",
        [Sequelize.literal("CONCAT(sido,' ', sigungu,' ',emdName)"), "fullCityName"],
        [Sequelize.literal("GROUP_CONCAT(IF(legalCity != emdName, legalCity, NULL))"), "relativeAddress"],
        [Sequelize.literal("(SELECT COUNT(*) FROM dental_clinics WHERE dental_clinics.cityId = cities.id)"), "clinicsNum"],
      ],
      group: "emdName",
      raw: true,
    });
    for (const groupingCity of groupingCities) {
      await City.update(
        {
          relativeAddress: groupingCity.relativeAddress,
        },
        {
          where: {
            id: groupingCity.id,
          },
        }
      );
    }
    return {
      statusCode: 500,
      body: JSON.stringify(groupingCities),
    };
    */
  try {
    const regex = /\([^)]*\)$/;
    const clinics = await Dental_clinic.findAll({});
    for (const clinic of clinics) {
      await Dental_clinic.update(
        {
          originalName: clinic.name.replace(regex, ""),
        },
        {
          where: {
            id: clinic.id,
          },
        }
      );
      console.log(clinic.name);
    }
    return {
      statusCode: 200,
      body: `Done`,
    };
  } catch (err) {
    console.info("Error login", err);
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${err.message}"}`,
    };
  }
};
//const clinics = await Dental_clinic.findAll({ group: "name" });

/**
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZiMDYxN2IwLTMzYzAtMTFlYi05MmRlLWUzZmIzYjRlMDI2NCIsImlhdCI6MTYwNjgxODk1MCwiZXhwIjoxNjM4Mzc2NTUwfQ.3-PEUaAWAW6sjl7TuKNzSHlTlK8p7myWG8nedNZ3nFE
 */

module.exports.importDentalClinic = async function importDentalClinic(event) {
  try {
    const clinicInfos = require("../dental_clinic_json/general_hospital_database.json");
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
      attributes: ["id", "name", "local", "address", "geographLong", "geographLat"],
      where: {
        cityId: null,
      },
    });
    for (let clinic of clinics) {
      const clinicSido = clinic.address.split(" ")[0];
      const clinicSigungu = clinic.address.split(" ")[1];
      const clinicEmdCity = clinic.local.split(" ")[1];
      /*
      const city = await City.findOne({
        where: {
          sido: clinicSido,
          sigungu: clinicSigungu,
          emdName: clinicEmdCity,
        },
        attributes: ["id", "sido", "sigungu", "emdName"],
      });
      */
      const city = await City.findOne({
        attributes: ["id", "sido", "sigungu", "emdName", "legalCity"],
        where: Sequelize.literal(`MBRContains(geometry,ST_GeomFromText("point(${clinic.geographLong} ${clinic.geographLat})"))`),
      });
      console.log(clinic.geographLong, clinic.geographLat);
      if (city) {
        await city.addDental_clinics(clinic);
        console.log(`${clinic.name} : 있음 (${city.sido} ${city.sigungu} ${city.emdName})`);
        results[clinic.name] = `있음 (${city.sido} ${city.sigungu} ${city.emdName})`;
      } else {
        return {
          statusCode: 404,
          body: `${clinic.name} : 없음`,
        };
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

module.exports.newTownCity = async function newTownCity(event) {
  try {
    const newTown = await NewTown.create({
      where: {
        name: "",
      },
    });
    const newTownCities = await City.findAll({
      where: {
        id: {
          [Sequelize.Op.or]: [],
        },
      },
      attributes: {
        exclude: ["geometry"],
      },
    });
    for (const city of newTownCities) {
      await City.update(
        {
          newTownId: GwanggyoNewTown.id,
        },
        {
          where: {
            id: city.id,
          },
        }
      );
    }
    return {
      statusCode: 200,
      body: JSON.stringify(newTownCities),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
module.exports.transparentClinics = async function transparentClinics(event) {
  try {
    const transparentClinics = require("../dental_clinic_json/transparentClinics.json");
    const none = [];
    const over = [];
    for (var transparents of transparentClinics) {
      const clinic = await Dental_clinic.findAll({
        attributes: ["id"],
        where: {
          [Sequelize.Op.or]: [
            {
              [Sequelize.Op.and]: [
                {
                  name: {
                    [Sequelize.Op.like]: `%${transparents.clinicName}%`,
                  },
                },
                {
                  address: {
                    [Sequelize.Op.like]: `%${transparents.address.split(" ")[1]}%`,
                  },
                },
                {
                  [Sequelize.Op.or]: [
                    {
                      address: {
                        [Sequelize.Op.like]: `%${transparents.address.split(" ")[2]}%`,
                      },
                    },
                    {
                      local: {
                        [Sequelize.Op.like]: `%${transparents.address.split(" ")[2]}%`,
                      },
                    },
                    {
                      address: {
                        [Sequelize.Op.like]: `%${transparents.address.split(" ")[3]}%`,
                      },
                    },
                  ],
                },
              ],
            },
            {
              telNumber: transparents.colNumber,
            },
          ],
        },
      });
      if (clinic.length === 0) {
        none.push(transparents.clinicName);
      } else if (clinic.length > 1) {
        over.push({ name: transparents.clinicName, list: clinic });
      } else {
        await Dental_clinic.update(
          { realNameCampaign: true },
          {
            where: {
              id: clinic[0].id,
            },
          }
        );
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ noneSize: none.length, none: none, overSize: over.length, over: over }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.dentalClinicLocalUpdate = async function dentalClinicLocalUpdate(event) {
  try {
    const clinics = await Dental_clinic.findAll();
    for (const clinic of clinics) {
      const city = await City.findOne({
        where: {
          id: clinic.cityId,
        },
      });
      console.log(city.fullCityName);
      await clinic.update({
        local: city.fullCityName,
      });
      console.log(clinic.name);
    }
    return {
      statusCode: 200,
      body: `{"message": "OK"}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.sidoSigungu = async function sidoSigungu(event) {
  try {
    const sigungus = await City.findAll({
      attributes: ["sido", "sigungu"],
    });
    for (const sigungu of sigungus) {
      const existSigungu = await Sigungu.findAll({
        where: {
          fullName: `${sigungu.sido} ${sigungu.sigungu}`,
        },
      });
      if (existSigungu.length === 0) {
        await Sigungu.create({
          name: sigungu.sigungu,
          fullName: `${sigungu.sido} ${sigungu.sigungu}`,
        });
        console.log(`${sigungu.sido} ${sigungu.sigungu}`);
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(sigungus),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
module.exports.fullCityName = async function fullCityName(event) {
  try {
    const cities = await City.findAll({});
    for (const city of cities) {
      console.log(`${city.sido} ${city.sigungu} ${city.emdName}(${city.legalCity})`);
      if (city.emdName === city.adCity) {
        await city.update({
          fullCityName: `${city.sido} ${city.sigungu} ${city.emdName}`,
        });
      } else {
        await city.update({
          fullCityName: `${city.sido} ${city.sigungu} ${city.emdName}(${city.adCity})`,
        });
      }
    }
    return {
      statusCode: 200,
      body: "OK",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.communitiesTagArray = async function communitiesTagArray(event) {
  try {
    const communities = await db.Community.findAll({});
    for (const community of communities) {
      var clinics = await community.getClinics();
      var treatmentItems = await community.getTreatmentItems();
      var symptomItems = await community.getSymptomItems();
      var cityTags = await community.getCityTags({ attributes: ["fullCityName"] });
      var generalTags = await community.getGeneralTags();
      const tagObjects = clinics.concat(treatmentItems, symptomItems, cityTags, generalTags);
      const tagNames = tagObjects.map((tag) => (tag.hasOwnProperty("originalName") ? tag.originalName : tag.dataValues.hasOwnProperty("fullCityName") ? tag.dataValues.fullCityName : tag.name));
      console.log(tagNames);
      await community.update({
        tagArray: { name: tagNames },
      });
    }
    return {
      statusCode: 200,
      body: "OK",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.clinicNameSpaceRemove = async function clinicNameSpaceRemove(event) {
  try {
    const clinics = await Dental_clinic.findAll();
    for (const clinic of clinics) {
      await clinic.update({
        name: clinic.name.replace(/ /gi, ""),
        originalName: clinic.originalName.replace(/ /gi, ""),
      });
      console.log(clinic.name);
    }
    return {
      statusCode: 200,
      body: `{"message": "OK"}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};

module.exports.subwayImport = async function subwayImport(event) {
  try {
    const subwayLists = await db.Subway.findAll();
    for (const subway of subwayLists) {
      console.log(subway);
      const subwayCities = await City.findAll({
        where: Sequelize.literal(`MBRContains(geometry,ST_GeomFromText("point(${subway.geographLong} ${subway.geographLat})"))`),
      });
      if (subwayCities) {
        await subway.addCities(subwayCities);
      }
    }
    /*
    const subwayLists = await db.Subway.findAll();
    for (const subway of subwayLists) {
      const subwayName = subway.name[subway.name.length - 1] === "역" ? subway.name.substring(0, subway.name.length - 1) : subway.name;
      await subway.update({
        name: subwayName,
      });
      console.log(subwayName);
      
      const subwayCity = await City.current(subway.geographLong, subway.geographLat);
      if (subwayCity) {
        await subway.update({
          cityId: subwayCity.id,
        });
        console.log(subwayCity.fullCityName);
      }
    }
    const subway = await db.Subway.findOne({
      where: {
        id: 1,
      },
      include: [
        {
          model: db.City,
          attributes: ["fullCityName"],
        },
      ],
    });
    */
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
module.exports.addtreatmentItems = async function addtreatmentItems(event) {
  try {
    const treatmentItems = require("../dental_clinic_json/treatments.json");
    for (const treatment of treatmentItems) {
      if (treatment.technicalName !== "") {
        const exTreatment = await db.Treatment_item.findOne({
          where: {
            technicalName: treatment.technicalName,
          },
        });
        if (!exTreatment) {
          await db.Treatment_item.create({
            technicalName: treatment.technicalName,
            usualName: treatment.usualName ? treatment.usualName : treatment.technicalName,
            engTechnicalName: treatment.engTechnicalName,
          });
        } else {
          await exTreatment.update({
            technicalName: treatment.technicalName,
            usualName: treatment.usualName ? treatment.usualName : treatment.technicalName,
            engTechnicalName: treatment.engTechnicalName,
          });
        }
        console.log(treatment.technicalName);
      }
    }
    return {
      statusCode: 200,
      body: `{"message": ${treatmentItems}}`,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
