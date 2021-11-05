const jwt = require('jsonwebtoken');

const { docClient } = require('../libs/dynamoDb');
const { TABLE_NAME, PK_VALUE } = require('../settings');
const User = require('../models/User');
const { generateUserSk } = require('../utils');

exports.getUserByEmail = async (userEmail, includePassword = false) => {
  try {
    const sk = generateUserSk(userEmail);
    const params = {
      TableName: TABLE_NAME,
      Key: {
        'pk': PK_VALUE.user,
        'sk': sk,
      },
    };
    const queryResult = await docClient.get(params).promise();
    const userData = queryResult.Item;
    if (userData) {
      const user = new User({ ...userData });
      if(!includePassword) {
        delete user.password;
      }
      return user;
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.createUser = async (user) => {
  try {
    const { email, password, name } = user;
    const newUser = new User({ email, password, name});
    await newUser.saveToDb(true);
    return newUser;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.checkVerifyEmailToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env['JWT_SECRET']);
    // Get password unless password will be overwritten to undefined due to saveToDb func
    const user = await this.getUserByEmail(decoded.email, true);

    // Not found token or token expires
    if (!user) {
      throw new Error('invalid signature');
    }

    user.setVerifiedEmail();
    await user.saveToDb();

    return user;
  } catch (error) {
    if (error.message === 'invalid signature')
      throw new Error('invalid signature');
    else
      throw new Error(error.message);
  }
};