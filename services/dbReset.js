const { sequelize } = require("../utils/models");
const { Dental_clinic, Korea_holiday } = require("../utils/models");
const { QueryTypes } = require("sequelize");

const request = require("request");
const parser = require("fast-xml-parser");

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
