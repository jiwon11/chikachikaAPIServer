const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const stageArg = process.argv.filter((x) => x.startsWith("-stage="))[0];
const stage = stageArg ? stageArg.split("=")[1] : "dev";
console.log("stage:", stage);
var USERTOKEN;
var API_ENDPOINT;
var STATUS;
if (stage === "test") {
  API_ENDPOINT = "https://test-api.chikachika-app.com";
  USERTOKEN = process.env.USERTOKEN;
  STATUS = 200;
} else if (stage === "dev") {
  API_ENDPOINT = "https://dev-api.chikachika-app.com";
  USERTOKEN = process.env.USERTOKEN;
  STATUS = 200;
} else if (stage === "prod") {
  API_ENDPOINT = "https://api.chikachika-app.com";
  USERTOKEN = process.env.USERTOKEN;
  STATUS = 401;
}

axios.defaults.adapter = require("axios/lib/adapters/http");
describe("GET search", () => {
  test("GET search keyWord Search", async () => {
    const res = await axios
      .get(`${API_ENDPOINT}/search/review?query=${encodeURIComponent("인천")}&lat=37.29404121591071&long=127.04600809585094&type=All&limit=10&offset=0&order=createdAt&region=all&cityId=-1`, {
        headers: {
          Authorization: USERTOKEN,
        },
      })
      .then((response) => response)
      .catch((error) => error.response);
    console.log(res);
    expect(res.status).toBe(STATUS);
  }, 30000);
});
