module.exports.comment = (event) => {
  try {
    const body = JSON.parse(event.Records[0].body);
    console.log(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `{"statusText": "Unaccepted","message": "${error.message}"}`,
    };
  }
};
