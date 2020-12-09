const awsServerlessExpress = require("aws-serverless-express-binary");
const express = require("express");
const ApiError = require("../utils/error");
const bodyParser = require("body-parser");
const v1 = require("./v1");

const app = express();

const { sequelize } = require("../utils/models");
sequelize.sync({});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use("/api/v1", v1);

app.use((err, req, res, next) => {
  console.error(err);
  const error = {
    code: 500,
    name: "internal-server-error",
    message: err.message,
  };
  if (err instanceof ApiError) {
    error.code = err.code;
    error.name = err.name;
  }
  res.status(error.code).send({ error });
});

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
};
