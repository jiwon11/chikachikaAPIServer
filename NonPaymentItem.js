const axios = require("axios");
const convert = require("xml-js");
const iconvlite = require("iconv-lite");

const getNonPaymentItemHospList = async function () {
  const secretKey = "0XnAzkR5iFgXoj2TyjdseowDsMtFV%2FMP5D6nrbEY0VQomcjM5gdx9y%2BNrveV2KRE2ar48boNcPXlXxoWWGm%2Bew%3D%3D";
  const ykiho = "JDQ4MTg4MSM1MSMkMSMkMCMkNjIkMzgxMzUxIzExIyQxIyQzIyQ3MiQ0NjEwMDIjNjEjJDEjJDQjJDgz";
  try {
    const response = await axios.get(`http://apis.data.go.kr/B551182/nonPaymentDamtInfoService/getNonPaymentItemHospList2?ServiceKey=${secretKey}&clCd=41&ykiho=${ykiho}`);
    console.log(response.data);
    const content = iconvlite.decode(response.data, "UTF-8");
    const parseResponse = convert.xml2json(content, { compact: true, spaces: 4, ignoreDoctype: true, attributesKey: "attributes" });
    console.log(`${parseResponse}`);
  } catch (error) {
    console.log(error);
  }
};

getNonPaymentItemHospList();
