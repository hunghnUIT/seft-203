const { SK_PATTERN_VALUE } = require('./settings')

/**
 * @param {Object} data returning data in *object* type
 * @param {Number} statusCode status code, *default is 200*
 * @returns Response object in standard format
 * @updated 9/16/2021, `data` in responseBody change to `...data` to match with graphQL format
 */
exports.generateSuccessResponse = (data, statusCode = 200, graphqlResponseType = false) => {
  let responseBody = {
    success: true,
  }
  if (graphqlResponseType) {
    responseBody = { ...responseBody, ...data};
  }
  else {
    responseBody.data = data;
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify(responseBody),
  }
}

/**
 * @param {Object} data returning data
 * @param {Number} statusCode status code, *default is 400*
 * @returns Response object in standard format
 * @updated 9/16/2021, `data` in responseBody change to .`..data` to match with graphQL format
 */
exports.generateFailureResponse = (data, statusCode = 400, graphqlResponseType = false) => {
  let responseBody = {
    success: false,
  }
  if (graphqlResponseType) {
    responseBody = { ...responseBody, ...data};
  }
  else {
    responseBody.data = data;
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify(responseBody),
  }
}

exports.isNotEmptyObj = (obj) => {
  try {
    return Object.keys(obj).length;
  } catch (error) {
    console.log(error.message);

    return false;
  }
}

exports.removeUndefinedFields = (obj) => JSON.parse(JSON.stringify(obj));

const removeLastComma = (str) => {
  const strLength = str.length;

  return str.slice(0,strLength - 1);
}

exports.generateUpdateExpression = (data) => {
  let result = 'set ';

  for (const key in data) {
    result += `${key}= :${key},`;
  }

  // Remove the last comma (,)
  result = removeLastComma(result);

  return result;
}

exports.generateUpdateExpressionAttributeValues = (data) => {
  let result = {};

  for (const key in data) {
    result[`:${key}`] = data[key];
  }

  return result;
}

/**
 * @param {String} userEmail userEmail
 * @param {String} taskId taskId, if ***no taskId provided***, taskId in SK will be replaced with ***empty string***
 * @returns SK string corresponding to sk for task
 */
exports.generateTaskSk = (userEmail, taskId) => {
  let sk = SK_PATTERN_VALUE.task;
  sk = sk.replace('${userEmail}', userEmail);
  if (taskId)
    sk = sk.replace('${taskId}', taskId);
  else
    sk = sk.replace('${taskId}', '');
  return sk;
};

exports.generateUserSk = (userEmail) => {
  let sk = SK_PATTERN_VALUE.user;
  sk = sk.replace('${userEmail}', userEmail);
  return sk;
};

exports.generateAuthResponse = (principalId, effect, methodArn) => {
  const policyDocument = generatePolicyDocument(effect, methodArn);

  return {
    principalId,
    policyDocument
  };
}

const generatePolicyDocument = (effect, methodArn) => {
  if (!effect || !methodArn) return null;

  const policyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: methodArn
      }
    ]
  };

  return policyDocument;
}