const taskServices = require('./services/taskService');
const userServices = require('./services/userService');
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
    const userEmail = event.requestContext.authorizer.userEmail;
    if (event.body) {
      const proceedBody = JSON.parse(event.body);

      if (isNotEmptyObj(proceedBody)) {
        const newTask = await taskServices.createTask(userEmail, proceedBody.note);

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
    const userEmail = event.requestContext.authorizer.userEmail;
    const tasks = await taskServices.getAllTasks(userEmail);

    return generateSuccessResponse(tasks);
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
}

module.exports.getTaskById = async function (event, context) {
  try {
    const userEmail = event.requestContext.authorizer.userEmail;
    if (event?.pathParameters?.id) {
      const task = await taskServices.getTaskById(userEmail, event.pathParameters.id);

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
    const userEmail = event.requestContext.authorizer.userEmail;
    if (event.pathParameters?.id && event.body) {
      const proceedBody = JSON.parse(event.body);

      if (isNotEmptyObj(proceedBody)) {
        const allowedToUpdateFields = removeUndefinedFields({
          isChecked: proceedBody.isChecked,
          note: proceedBody.note,
        })

        const updateResult = await taskServices.findOneAndUpdateTaskById(userEmail, event.pathParameters.id, allowedToUpdateFields);

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
    const userEmail = event.requestContext.authorizer.userEmail;
    if (event?.pathParameters?.id) {
      // DynamoDB always execute delete and return {} even that the record not in DB
      await taskServices.findOneAndDeleteTaskById(userEmail, event.pathParameters.id);
      return generateSuccessResponse({});
    }

    return generateFailureResponse({ message: 'Not enough param' });
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
}

module.exports.searchTaskByNote = async function (event, context) {
  try {
    const userEmail = event.requestContext.authorizer.userEmail;
    const keyword = event.queryStringParameters.keyword;
    const filter = event.queryStringParameters.filter || '';
    if (event.queryStringParameters.keyword) {
      const result = await taskServices.searchTaskByNote(userEmail, keyword, filter);
      return generateSuccessResponse(result);
    }
    return generateFailureResponse({ message: 'Not enough params' });
  } catch (error) {
    return generateFailureResponse({ message: error.message }, 500);
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
    if (err.message.includes('is required'))
      return generateFailureResponse({ message: err.message }, 400);
    else
      return generateFailureResponse({ message: err.message }, 500);
  }
};

module.exports.verifyEmail = async function(event, context) {
  try {
    if (event.pathParameters?.token) {
      const verifiedUser = await userServices.checkVerifyEmailToken(event.pathParameters.token);
      return {
        statusCode: 200,
        "headers": {
          'Content-Type': 'text/html',
        },
        body: `
          <html>
            <body>
              <span style="width: 100%; text-align: center;">
                <h3>
                  <span style="color:green; font-size:2rem">&#127881;</span>
                      Congratulations
                  <span style="color:green; font-size:2rem">&#127881;</span>
                </h3>
                <h3>Your email address <a style="text-decoration: none;" href="mailto:${verifiedUser.email}">${verifiedUser.email}</a> has been verified.</h3>
              </span>
            </body>
          </html>`,
      }
    }
    return generateFailureResponse({ message: 'No token provided' }, 400);
  } catch (err) {
    if (err.message === 'invalid signature')
      return generateFailureResponse({ message: 'Invalid or expired token' }, 400);
    return generateFailureResponse({ message: err.message }, 500);
  }
};

// module.exports.getUserByEmail = async (event, context) => {
//   try {
//     if (event.pathParameters?.userEmail) {
//       const result = await userServices.getUserByEmail(event.pathParameters.userEmail);
//       return generateSuccessResponse(result);
//     }

//     return generateFailureResponse({ message: 'Not enough params' });
//   } catch (err) {
//     return generateFailureResponse({ message: err.message }, 500);
//   }
// };

module.exports.myAccount = async (event, context) => {
  try {
    const result = await userServices.getUserByEmail(event.requestContext.authorizer.userEmail);
    return generateSuccessResponse(result);
  } catch (err) {
    return generateFailureResponse({ message: err.message }, 500);
  }
};

module.exports.login = async (event, context) => {
  try {
    if (event.body) {
      const proceedBody = JSON.parse(event.body);
      const { email, password } = proceedBody;
      assert(email, 'email is required');
      assert(password, 'password is required');

      const user = await userServices.getUserByEmail(email, true);
      if (!user)
        return generateFailureResponse({ message: 'Invalid credentials' }, 401);
      if (!user.isVerified)
        return generateFailureResponse({ message: 'Please verify your email first' }, 422);

      const isMatchPassword = await user.matchPassword(password);
      if (!isMatchPassword)
        return generateFailureResponse({ message: 'Invalid credentials' }, 401);

      const token = user.getAccessToken();
      await user.setToken(token);
      await user.saveToDb();
      return generateSuccessResponse({ accessToken: token }, 200);
    }
    return generateFailureResponse({ message: 'Email and password are required' });
  } catch (err) {
    if (err.message.includes('is required'))
      return generateFailureResponse({ message: err.message }, 400);
    else
      return generateFailureResponse({ message: err.message }, 500);
  }
};

module.exports.logout = async function (event, context) {
  try {
    const user = await userServices.getUserByEmail(event.requestContext.authorizer.userEmail, true);
    await user.setToken('');
    await user.saveToDb();
    return generateSuccessResponse({}, 200);
  } catch (error) {
    return generateFailureResponse({ message: error.message }, 500);
  }
};

module.exports.report = async function (event, context) {
  try {
    const userEmail = event.requestContext.authorizer.userEmail;
    const collection = event.pathParameters.collection;
    const field = event.pathParameters.field;

    if (collection && field) {
      switch (collection) {
        case 'tasks':
          if (field === 'isChecked') {
            const checkedTasksResult = await taskServices.reportCheckedTask(userEmail, true);
            const uncheckedTasksResult = await taskServices.reportCheckedTask(userEmail, false);
            return generateSuccessResponse({ 
              ...checkedTasksResult,
              ...uncheckedTasksResult
            });
          }
          break;
        default:
          break;
        }
      return generateFailureResponse({ message: `Report with ${collection} on field ${field} is not implemented` }, 500);
    }
    return generateFailureResponse({ message: 'Not enough params' });
  } catch (error) {
    return generateFailureResponse({ message: error.message }, 500);
  }
}

module.exports.importTask = async function (event, context) {
  try {
    const userEmail = event.requestContext.authorizer.userEmail;
    const rawData = event.body;
    assert.deepStrictEqual(typeof rawData, 'string', 'expected string body');

    if (rawData) {
      const proceedData = rawData.split('\r\n');
      const importCount = await taskServices.importTask(userEmail, proceedData);
      return generateSuccessResponse({ message: `Imported ${importCount} tasks` });
    }

    return generateFailureResponse({ message: 'Body is required' });
  } catch (error) {
    if (error.message === 'invalid data') {
      return generateFailureResponse({ message: 'invalid data' });
    }
    return generateFailureResponse({ message: error.message }, 500);
  }
};
