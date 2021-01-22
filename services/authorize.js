const jwt = require("jsonwebtoken");
const { User } = require("../utils/models");
function generateAuthResponse(principalId, effect, methodArn) {
  const policyDocument = generatePolicyDocument(effect, methodArn);

  return {
    principalId,
    policyDocument,
  };
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
      return callback(null, generateAuthResponse(user, "Allow", methodArn));
    } else {
      console.log("undefined decoded AND user");
      return callback(null, generateAuthResponse(user, "Deny", methodArn));
    }
  });
};
