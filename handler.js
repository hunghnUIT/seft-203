const {
  getAllTasks,
  getTaskById,
  findOneAndDeleteTaskById,
  findOneAndUpdateTaskById
} = require('./services');
const services = require('./services');

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
  const tasks = await getAllTasks();

  return generateSuccessResponse(tasks);
}

module.exports.getTaskById = async function (event, context) {
  try {
    if (event?.pathParameters?.id) {
      const task = await getTaskById(event.pathParameters.id);

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

        const updateResult = await findOneAndUpdateTaskById(event.pathParameters.id, allowedToUpdateFields);

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
      const deleteResult = await findOneAndDeleteTaskById(event.pathParameters.id);

      if (deleteResult)
        return generateSuccessResponse({});
      else
        return generateFailureResponse({ message: 'Not found' }, 404);
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
        return generateSuccessResponse(result);

      return generateFailureResponse(result);
    }
    )
}