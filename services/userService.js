const { docClient } = require('../libs/dynamoDb');
const { TABLE_NAME, PK_VALUE } = require('../settings');
const User = require('../models/User');
const { generateUserSk } = require('../utils');

exports.getUserByEmail = async (userEmail) => {
  try {
    const sk = generateUserSk(userEmail);
    const params = {
      TableName: TABLE_NAME,
      Key: {
        'pk': PK_VALUE.user,
        'sk': sk,
      },
    };
    const user = await docClient.get(params).promise();
    return user.Item
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.createUser = async (user) => {
  try {
    const { email, password, name } = user;
    const newUser = await new User({ email, password, name});
    await newUser.saveToDb();
    return newUser;
  } catch (error) {
    throw new Error(error.message);
  }
};