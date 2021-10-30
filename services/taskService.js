const shortid = require('shortid');
const {
  docClient
} = require('../libs/dynamoDb');
const { USER_ID, TABLE_NAME } = require('../settings');
const { generateUpdateExpression, generateUpdateExpressionAttributeValues } = require('../utils');



/**
 * @returns return all tasks in *array* type
 */
exports.getAllTasks = async () => {
  const scanResults = [];
  let items = null;
  const params = {
    TableName: TABLE_NAME,
  };

  do {
    items = await docClient.scan(params).promise();
    items.Items.forEach((item) => scanResults.push(item));

    params.ExclusiveStartKey = items.LastEvaluatedKey;
  }
  while (items.LastEvaluatedKey);

  return scanResults;
}

/**
 * @param {String} note Note of task
 * @returns created task
 */
exports.createTask = async (note) => {
  try {
    const newTaskId = shortid.generate();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        'userId': USER_ID,
        'taskId': newTaskId,
        'isChecked': false,
        'note': note,
      },
      ReturnValues: 'ALL_OLD',
    };
    await docClient.put(params).promise();

    return {
      'userId': USER_ID,
      'taskId': newTaskId,
      'isChecked': false,
      'note': note,
    };
  } catch (error) {
    throw new Error('Create new task failed. Error: ' + error.message);
  }
}

/**
 * @param {string} id id of task
 * @returns task in *object* type if found, else *undefined* instead
 */
exports.getTaskById = async (id) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        'userId': USER_ID,
        'taskId': id,
      },
    };
    const foundItem = await docClient.get(params).promise();

    return foundItem.Item;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * @param {string} id id of task
 * @returns task in *object* type if found, else *undefined* instead
 */
exports.findOneAndUpdateTaskById = async (id, newData) => {
  try {
    const updateExpression = generateUpdateExpression(newData);
    const expressionAttributeValues = generateUpdateExpressionAttributeValues(newData);

    const params = {
      TableName: TABLE_NAME,
      Key: {
        'userId': USER_ID,
        'taskId': id,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues:'ALL_NEW',
    };
    const updatedItem = await docClient.update(params).promise();

    return updatedItem.Attributes;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * @param {String} id Deleting task's Id
 * @returns *True* if succeed, *false* otherwise
 */
exports.findOneAndDeleteTaskById = async (id) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        'userId': USER_ID,
        'taskId': id,
      },
    };
    await docClient.delete(params).promise();
  } catch (error) {
    throw new Error(error.message);
  }
}


// Demo function
/**
//  * @param {Number} timestamp 
//  * @returns *array* of matching query items
//  */
// const findTasksByCreateTime = async (timestamp) => {
//   try {
//     const params = {
//       TableName : TABLE_NAME,
//       KeyConditionExpression: "#id >= :id",
//       ExpressionAttributeNames:{
//           "#id": "taskId"
//       },
//       ExpressionAttributeValues: {
//           ":id": timestamp
//       }
//     };

//     const result = await docClient.query(params).promise();

//     return result;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// }