const AWS = require("aws-sdk");
const { DB_ENDPOINT } = require('../settings');

AWS.config.update({
  region: "ap-southeast-1",
  // endpoint: DB_ENDPOINT,
});

const docClient = new AWS.DynamoDB.DocumentClient();
const dynamodb = new AWS.DynamoDB();

module.exports = {
  docClient,
  dynamodb,
};