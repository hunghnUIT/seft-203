const taskServices = require('./services/taskService');
const userServices = require('./services/userService');
const asyncHandler = require('./middlewares/asyncHandler');
const assert = require('assert');

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
        const newTask = await taskServices.createTask(proceedBody.note);

        return generateSuccessResponse(newTask);
      }
    }

    return generateFailureResponse({ message: 'Task\'s note is required' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500)
  }
}

module.exports.getAllTasks = async function (event, context) {
  try {
    const tasks = await taskServices.getAllTasks();

    return generateSuccessResponse(tasks);
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
}

module.exports.getTaskById = async function (event, context) {
  try {
    if (event?.pathParameters?.id) {
      const task = await taskServices.getTaskById(event.pathParameters.id);

      if (task)
        return generateSuccessResponse(task);
      else
        return generateFailureResponse({ message: 'Not found' }, 404);
    }

    return generateFailureResponse({ message: 'Not enough param' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
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

        const updateResult = await taskServices.findOneAndUpdateTaskById(event.pathParameters.id, allowedToUpdateFields);

        return generateSuccessResponse(updateResult);
        // Should I find task before update to identify does task exist
        // that help avoiding create a new task when update not exist task?
      }
    }

    return generateFailureResponse({ message: 'Not enough param and/or update body' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
}

module.exports.deleteTaskById = async function (event, context) {
  try {
    if (event?.pathParameters?.id) {
      // DynamoDB always execute delete and return {} even that the record not in DB
      await taskServices.findOneAndDeleteTaskById(event.pathParameters.id);
      return generateSuccessResponse({});
    }

    return generateFailureResponse({ message: 'Not enough param' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
}

module.exports.graphql = async function (event, context) {
  return graphql.graphql(graphQLSchema, event.body)
    .then(result => {
      if (result.hasOwnProperty('data'))
        return generateSuccessResponse(result, 200, true);

      return generateFailureResponse(result, 400, true);
    })
}

module.exports.register = async function (event, context) {
  try {
    if (event.body) {
      const proceedBody = JSON.parse(event.body);
      const { name, email, password } = proceedBody;
      assert(email, 'email is required');
      assert(password, 'password is required');
      assert(name, 'name is required');

      const checkUserExist = await userServices.getUserByEmail(email);
      if (checkUserExist && checkUserExist.isVerified)
        return generateFailureResponse({ message: 'User already exists' }, 422);

      const newUser = await userServices.createUser(proceedBody);
      await newUser.sendVerifyEmail(event);

      return generateSuccessResponse({ message: 'Waiting for email verification' }, 201);
    }

    return generateFailureResponse({ message: 'Event body is required' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500)
  }

  // User.findOne({ email: email }, async (err, user) => {
  //   if (err) {
  //     console.log(err);
  //     return next(new ErrorResponse(err.message), err.code || 500);
  //   }

  //   if (user) {
  //     user.name = name;
  //     user.password = password || ""; // Add default value for showing error for password

  //     await user.save().catch(err => next(new ErrorResponse(err.message)));
  //   }
  //   else
  //     user = await User.create({ email, name, password }).catch(err => next(new ErrorResponse(err.message)));

  //   if (user) {
  //     const requestVerify = await requestVerifyEmail(req, email).catch(err => next(new ErrorResponse(err.message, err.code)));
  //     if (requestVerify)
  //       return res.status(200).json({
  //         success: true,
  //         message: 'Waiting for the verification of email'
  //       });
  //   }
  //   else
  //     return next(new ErrorResponse('Can not create user'));
  // });
}

module.exports.getUserByEmail = async (event, context) => {
  try {
    if (event.pathParameters?.userEmail) {
      const result = await userServices.getUserByEmail(event.pathParameters.userEmail);
      return generateSuccessResponse(result);
    }

    return generateFailureResponse({ message: 'Not enough params' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
};

module.exports.createUser = async (event, context) => {
  try {
    if (event.body) {
      const proceedBody = JSON.parse(event.body);
      assert(proceedBody.email, 'email is required');
      assert(proceedBody.password, 'password is required');
      assert(proceedBody.name, 'name is required');

      if (isNotEmptyObj(proceedBody)) {
        const newUser = await userServices.createUser(proceedBody);

        return generateSuccessResponse(newUser);
      }
    }

    return generateFailureResponse({ message: 'Event body is required' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500)
  }
};