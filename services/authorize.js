const jwt = require("jsonwebtoken");
const { User } = require("../utils/models");
function generateAuthResponse(principalId, context, effect, methodArn) {
  const policyDocument = generatePolicyDocument(effect, methodArn);
  var authResponse = {};
  authResponse.principalId = principalId;
  authResponse.policyDocument = policyDocument;
  authResponse.context = context;
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
    context.callbackWaitsForEmptyEventLoop = false;
    const token = event.authorizationToken;
    const methodArn = event.methodArn;

    if (!token) return callback(null, "Unauthorized");

    // verifies token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findOne({
      attributes: ["id"],
      where: {
        id: decoded.id,
      },
    }).then((user) => {
      if (decoded && user) {
        console.log("exist decoded AND user");
        return callback(null, generateAuthResponse(user.id, user, "Allow", methodArn));
      } else {
        console.log("undefined decoded AND user");
        return callback(null, generateAuthResponse(user.id, user, "Deny", methodArn));
      }
    });
  } catch (error) {
    console.log(error);
  }
};
