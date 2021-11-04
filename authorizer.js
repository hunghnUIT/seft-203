const jwt = require('jsonwebtoken');

const {
  generateAuthResponse,
} = require('./utils');
const { getUserByEmail  } = require('./services/userService');

module.exports.authorize = async (event, context, callback) => {
  const token = event.authorizationToken.replace('Bearer ', '');
  const methodArn = event.methodArn;

  if (!token || !methodArn) return callback(null, 'Unauthorized');

  // verifies token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded && decoded.email) {
    const user = await getUserByEmail(decoded.email);
    if (user)
      return callback(null, generateAuthResponse(decoded.email, 'Allow', methodArn, {
        userEmail: user.email,
      }));
  }
  return callback(null, generateAuthResponse(decoded.email, 'Deny', methodArn));
};