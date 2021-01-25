"use strict";
const AWS = require("aws-sdk");
AWS.config.update({ region: "ap-northeast-1" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

module.exports.comment = async function (body) {
  try {
    const messageBody = JSON.stringify(body);
    let params = {
      MessageBody: messageBody,
      QueueUrl: "https://sqs.ap-northeast-1.amazonaws.com/751612718299/commentNotification-dev",
    };
    const data = await sqs.sendMessage(params).promise();
    console.info("SQS Send Message Success", data.MessageId);
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Consumer PUSH successfully",
        input: messageBody,
      }),
    };
    return response;
  } catch (error) {
    console.info("SQS Send Message Error", error);
    return error;
  }
};
