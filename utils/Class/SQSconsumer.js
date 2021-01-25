"use strict";
const AWS = require("aws-sdk");
AWS.config.update({ region: "ap-northeast-1" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

module.exports.comment = (body, context, callback) => {
  const messageBody = JSON.stringify(body);
  let params = {
    MessageBody: messageBody,
    QueueUrl: "https://sqs.ap-northeast-2.amazonaws.com/478069740483/sampleQueue",
  };
  sqs
    .sendMessage(params)
    .promise()
    .then((data) => {
      console.info("SQS Send Message Success", data.MessageId);
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          message: "Go Serverless v1.0! Your function executed successfully!",
          input: messageBody,
        }),
      };
      return response;
    })
    .catch((error) => {
      console.info("SQS Send Message Error", error);
      return error;
    });
};
