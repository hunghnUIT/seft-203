const jwt = require('jsonwebtoken');

const utils = require('./utils');
const services = require('./services/userService');

module.exports.authorize = async (event, context, callback) => {
  const token = event.authorizationToken.replace('Bearer ', '');
  const methodArn = event.methodArn;

  if (!token || !methodArn) return callback(null, 'Unauthorized');

  // verifies token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded && decoded.email) {
    const user = await services.getUserByEmail(decoded.email);
    if (user) {
      const allowResponse = utils.generateAuthResponse(decoded.email, 'Allow', methodArn, {
        userEmail: user.email,
      });
      return callback(null, allowResponse);
    }
  }
  const denyResponse = utils.generateAuthResponse(decoded.email, 'Deny', methodArn);
  return callback(null, denyResponse);
};