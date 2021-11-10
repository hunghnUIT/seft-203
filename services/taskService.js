const shortid = require('shortid');
const { docClient } = require('../libs/dynamoDb');
const { PK_VALUE, TABLE_NAME } = require('../settings');
const { 
  generateUpdateExpression, 
  generateUpdateExpressionAttributeValues, 
  generateTaskSk, 
  generateQueryableFieldValue 
} = require('../utils');
const { queryAll } = require('../helpers/dynamoDb');


/**
 * @returns return all tasks in *array* type
 */
exports.getAllTasks = async (userEmail) => {
  let queryResults = [];
  let items = null;
  const sk_pattern = generateTaskSk(userEmail);
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': PK_VALUE.task,
      ':sk': sk_pattern
    }
  };

  do {
    items = await docClient.query(params).promise();
    queryResults = queryResults.concat(items.Items);

    params.ExclusiveStartKey = items.LastEvaluatedKey;
  }
  while (items.LastEvaluatedKey);

  return queryResults;
}

/**
 * @param {String} note Note of task
 * @returns created task
 */
exports.createTask = async (userEmail, note) => {
  try {
    const newTaskId = shortid.generate();
    const sk = generateTaskSk(userEmail, newTaskId);
    const isCheckedValue = false;
    const queryableValue = generateQueryableFieldValue([userEmail, isCheckedValue])

    const item = {
      'pk': PK_VALUE.task,
      'sk': sk,
      'isChecked': isCheckedValue,
      'note': note,
      'queryableField': queryableValue
    };
    const params = {
      TableName: TABLE_NAME,
      Item: item,
      ReturnValues: 'ALL_OLD',
    };
    await docClient.put(params).promise();

    return item;
  } catch (error) {
    throw new Error('Create new task failed. Error: ' + error.message);
  }
}

/**
 * @param {string} id id of task
 * @returns task in *object* type if found, else *undefined* instead
 */
exports.getTaskById = async (userEmail, id) => {
  try {
    const sk = generateTaskSk(userEmail, id);
    const params = {
      TableName: TABLE_NAME,
      Key: {
        'pk': PK_VALUE.task,
        'sk': sk,
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
exports.findOneAndUpdateTaskById = async (userEmail, id, newData) => {
  try {
    const proceedData = { ...newData };
    if (proceedData.hasOwnProperty('isChecked')) {
      proceedData.queryableField = generateQueryableFieldValue([userEmail, proceedData.isChecked])
    }

    const sk = generateTaskSk(userEmail, id);
    const updateExpression = generateUpdateExpression(proceedData);
    const expressionAttributeValues = generateUpdateExpressionAttributeValues(proceedData);

    const params = {
      TableName: TABLE_NAME,
      Key: {
        'pk': PK_VALUE.task,
        'sk': sk,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
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
exports.findOneAndDeleteTaskById = async (userEmail, id) => {
  try {
    const sk = generateTaskSk(userEmail, id);
    const params = {
      TableName: TABLE_NAME,
      Key: {
        'pk': PK_VALUE.task,
        'sk': sk,
      },
    };
    await docClient.delete(params).promise();
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.searchTaskByNote = async (userEmail, note, isChecked) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'queryableIndex',
      KeyConditionExpression: 'pk = :pk AND begins_with(queryableField, :queryable)',
      FilterExpression: 'contains(note, :note)',
      ExpressionAttributeValues: {
        ':pk': PK_VALUE.task,
        ':queryable': `${userEmail}::${isChecked}`,
        ':note': note
      },
    };
    const queryResult = await docClient.query(params).promise();
    return queryResult.Items;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.reportCheckedTask = async (userEmail, isCheckedValue) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'queryableIndex',
      KeyConditionExpression: 'pk = :pk AND begins_with(queryableField, :queryable)',
      ExpressionAttributeValues: {
        ':pk': PK_VALUE.task,
        ':queryable': `${userEmail}::${isCheckedValue}`,
      },
    };

    const result = await queryAll(params, docClient);
    return {
      [isCheckedValue ? 'totalCheckedTasks' : 'totalUncheckedTasks']: result.length
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
