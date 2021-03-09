const axios = require("axios");

const stage = process.env.stage || "dev";
console.log(stage);
var USERTOKEN;
var API_ENDPOINT;
if (stage === "test") {
  API_ENDPOINT = "https://43tbm5rlw1.execute-api.ap-northeast-1.amazonaws.com/test";
  USERTOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjhmZTUwLTdmYmQtMTFlYi1iZGRiLTMxODE5ZTA1YzZlNSIsImlhdCI6MTYxNTE4NDQ5NSwiZXhwIjoxNjQ2NzQyMDk1fQ.m8G3Odh1zXxfxyoEytpuI7q9eS1L7SxGgV8lOQvdmE4";
} else if (stage === "dev") {
  API_ENDPOINT = "https://0l855bcmib.execute-api.ap-northeast-1.amazonaws.com/dev";
  USERTOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjhmZTUwLTdmYmQtMTFlYi1iZGRiLTMxODE5ZTA1YzZlNSIsImlhdCI6MTYxNTE4NDQ5NSwiZXhwIjoxNjQ2NzQyMDk1fQ.m8G3Odh1zXxfxyoEytpuI7q9eS1L7SxGgV8lOQvdmE4";
}

axios.defaults.adapter = require("axios/lib/adapters/http");

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
