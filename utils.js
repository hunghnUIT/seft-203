/**
 * @param {Object} data returning data in *object* type
 * @param {Number} statusCode status code, *default is 200*
 * @returns Response object in standard format
 * @updated 9/16/2021, `data` in responseBody change to `...data` to match with graphQL format
 */
exports.generateSuccessResponse = (data, statusCode = 200) => {
  let responseBody = {
    success: true,
    ...data
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
exports.generateFailureResponse = (data, statusCode = 400) => {
  const responseBody = {
    success: false,
    ...data
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