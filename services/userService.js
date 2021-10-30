const { docClient } = require('../libs/dynamoDb');
const { TABLE_NAME } = require('../settings');

exports.findUserByEmail = async () => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };
    
  } catch (error) {
    throw new Error(error.message);
  }
};