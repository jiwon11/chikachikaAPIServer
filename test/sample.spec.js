const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const stageArg = process.argv.filter((x) => x.startsWith("-stage="))[0];
const stage = stageArg ? stageArg.split("=")[1] : "dev";
console.log("stage:", stage);
var USERTOKEN;
var API_ENDPOINT;
if (stage === "test") {
  API_ENDPOINT = "https://43tbm5rlw1.execute-api.ap-northeast-1.amazonaws.com/test";
  USERTOKEN = process.env.USERTOKEN;
} else if (stage === "dev") {
  API_ENDPOINT = "https://0l855bcmib.execute-api.ap-northeast-1.amazonaws.com/dev";
  USERTOKEN = process.env.USERTOKEN;
}

axios.defaults.adapter = require("axios/lib/adapters/http");
describe("GET search", () => {
  test("GET search Treatments", async () => {
    const res = await axios
      .get(`${API_ENDPOINT}/search/treatments?q=${encodeURIComponent("스케일링")}`, {
        headers: {
          Authorization: USERTOKEN,
        },
      })
      .then((response) => response);
    expect(res.status).toBe(200);
  });
});
