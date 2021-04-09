const jwt = require("jsonwebtoken");
function generateAuthResponse(principalId, effect, methodArn) {
  const policyDocument = generatePolicyDocument(effect, methodArn);
  var authResponse = {};
  authResponse.principalId = principalId;
  authResponse.policyDocument = policyDocument;
  return authResponse;
}

function generatePolicyDocument(effect, methodArn) {
  if (!effect || !methodArn) return null;

  const policyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: methodArn,
      },
    ],
  };

  return policyDocument;
}

module.exports.verifyToken = (event, context, callback) => {
  try {
    const token = event.authorizationToken;
    const methodArn = event.methodArn;
    if (token === undefined && token === "null") {
      return callback("Unauthorized");
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        console.log("exist decoded token");
        return callback(null, generateAuthResponse(decoded.id, "Allow", methodArn));
      } else {
        console.log("undefined decoded token");
        return callback(null, generateAuthResponse(decoded.id, "Deny", methodArn));
      }
    }
    // verifies token
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: `{"statusText": "Server error","message": "${error.message}"}`,
    };
  }
};
