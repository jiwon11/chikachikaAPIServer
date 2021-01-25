const AWS = require("aws-sdk");
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();

module.exports.comment = (event, context, callback) => {
  const queueUrl = event.QueueUrl;
  const message = event.Message;
  const params = {
    QueueUrl: queueUrl,
    ReceiptHandle: message.ReceiptHandle,
  };
  sqs
    .deleteMessage(params)
    .promise()
    .then(() => {
      callback();
    })
    .catch((err) => {
      callback(err);
    });
};
