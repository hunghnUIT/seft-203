const services = require('./services');
const asyncHandler = require('./middlewares/asyncHandler');

const {
  generateSuccessResponse,
  generateFailureResponse,
  isNotEmptyObj,
  removeUndefinedFields
} = require('./utils');

const graphQLSchema = require('./libs/graphQlSchema');
const graphql = require('graphql');


module.exports.createTask = async function (event, context) {
  try {
    if (event.body) {
      const proceedBody = JSON.parse(event.body);

      if (isNotEmptyObj(proceedBody)) {
        const newTask = await services.createTask(proceedBody.note);

        return generateSuccessResponse(newTask);
      }
    }

    return generateFailureResponse({ message: 'Task\'s note is required' });
  } catch (err) {
    return generateFailureResponse({ message: err.message })
  }
}

module.exports.getAllTasks = async function (event, context) {
  try {
    const tasks = await services.getAllTasks();
  
    return generateSuccessResponse(tasks);
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
}

module.exports.getTaskById = async function (event, context) {
  try {
    if (event?.pathParameters?.id) {
      const task = await services.getTaskById(event.pathParameters.id);

      if (task)
        return generateSuccessResponse(task);
      else
        return generateFailureResponse({ message: 'Not found' }, 404);
    }

    return generateFailureResponse({ message: 'Not enough param' });
  } catch (err) {
    return generateFailureResponse({ message: err.message });
  }
}

module.exports.updateTaskById = async function (event, context) {
  try {
    if (event.pathParameters?.id && event.body) {
      const proceedBody = JSON.parse(event.body);

      if (isNotEmptyObj(proceedBody)) {
        const allowedToUpdateFields = removeUndefinedFields({
          isChecked: proceedBody.isChecked,
          note: proceedBody.note,
        })

        const updateResult = await services.findOneAndUpdateTaskById(event.pathParameters.id, allowedToUpdateFields);

        if (updateResult)
          return generateSuccessResponse(updateResult);
        else
          return generateFailureResponse({ message: 'Not found' }, 404);
      }
    }

    return generateFailureResponse({ message: 'Not enough param and/or update body' });
  } catch (err) {
    return generateFailureResponse({ message: err.message });
  }
}

module.exports.deleteTaskById = async function (event, context) {
  try {
    if (event?.pathParameters?.id) {
      // DynamoDB always execute delete and return {} even that the record not in DB
      await services.findOneAndDeleteTaskById(event.pathParameters.id);
      return generateSuccessResponse({});
    }

    return generateFailureResponse({ message: 'Not enough param' });
  } catch (err) {
    return generateFailureResponse({ message: err.message });
  }
}

module.exports.graphql = async function (event, context) {
  return graphql.graphql(graphQLSchema, event.body)
    .then(result => {
      if (result.hasOwnProperty('data'))
        return generateSuccessResponse(result, 200, true);

      return generateFailureResponse(result, 400, true);
    }
  )
}