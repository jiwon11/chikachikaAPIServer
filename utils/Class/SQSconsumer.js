"use strict";
const AWS = require("aws-sdk");
AWS.config.update({ region: "ap-northeast-1" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

module.exports.comment = async function (body) {
  try {
    const messageBody = JSON.stringify(body);
    let params = {
      MessageBody: messageBody,
      QueueUrl: `https://sqs.ap-northeast-1.amazonaws.com/751612718299/commentNotification-${process.env.stage}`,
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

module.exports.reply = async function (body) {
  try {
    const messageBody = JSON.stringify(body);
    let params = {
      MessageBody: messageBody,
      QueueUrl: `https://sqs.ap-northeast-1.amazonaws.com/751612718299/replyNotification-${process.env.stage}`,
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

module.exports.like = async function (body) {
  try {
    const messageBody = JSON.stringify(body);
    let params = {
      MessageBody: messageBody,
      QueueUrl: `https://sqs.ap-northeast-1.amazonaws.com/751612718299/likeNotification-${process.env.stage}`,
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

module.exports.report = async function (body) {
  try {
    const messageBody = JSON.stringify(body.slackBody);
    const messageGroupId = body.group;
    const messageDeduplicationId = `${body.id}`;
    console.log(messageGroupId);
    let params = {
      MessageBody: messageBody,
      QueueUrl: `https://sqs.ap-northeast-1.amazonaws.com/751612718299/reportNotification-${process.env.stage}.fifo`,
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: messageDeduplicationId,
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

module.exports.billsVerify = async function billsVerify(body) {
  try {
    const messageBody = JSON.stringify({ reviewId: body.reviewId });
    const messageGroupId = body.group;
    const messageDeduplicationId = `${body.id}`;
    console.log(messageBody);
    let params = {
      MessageBody: messageBody,
      QueueUrl: `https://sqs.ap-northeast-1.amazonaws.com/751612718299/billsVerifyNotification-${process.env.stage}.fifo`,
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: messageDeduplicationId,
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
    console.error(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
