const sinon = require('sinon');
const { beforeEach, afterEach, it } = require('mocha');
const jwt = require('jsonwebtoken');

const { createTask, getAllTasks, getTaskById, updateTaskById, deleteTaskById, register, verifyEmail, myAccount ,login } = require('../handler');
const { docClient } = require('../libs/dynamoDb');
const User = require('../models/User');

const successfulActionResult = { statusCode: 200 };
const badRequestResult = { statusCode: 400 };
const notFoundResult = { statusCode: 404 };
const internalErrorResult = { statusCode: 500 };

describe('handler/createTask', () => {
  let createTaskServiceStub;
  beforeEach(() => {
    createTaskServiceStub = sinon.stub(docClient, 'put');
  });
  afterEach(() => {
    createTaskServiceStub.restore();
  });

  const sample_validBody = `{ "note": "testing create new task" }`;
  const sample_nullBody = null;
  const sample_authorizedEvent = {
    requestContext: {
      authorizer: {
        userEmail: 'test@gmail.com'
      }
    }
  };

  const fn = createTask;

  it('should return failure message if null in body', async () => {
    const result = await fn({
      ...sample_authorizedEvent,
      body: sample_nullBody,
    });
    sinon.assert.match(result, badRequestResult);
  })

  it('should return success message if create task successfully', async () => {
    createTaskServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({})
      };
    });

    const result = await fn({
      ...sample_authorizedEvent,
      body: sample_validBody,
    });
    sinon.assert.match(result, successfulActionResult);
  })

  it('should throw error if service create new task failed', async () => {
    createTaskServiceStub.callsFake(() => {
      return {
        promise: () => Promise.reject(new Error('ValidateError'))
      };
    });

    const result = await fn({
      ...sample_authorizedEvent,
      body: sample_validBody,
    });

    sinon.assert.match(result, internalErrorResult);
    sinon.assert.calledOnce(createTaskServiceStub);
  })
})

describe('handler/getAllTasks', () => {
  let getAllTasksServiceStub;
  beforeEach(() => {
    getAllTasksServiceStub = sinon.stub(docClient, 'query');
  });
  afterEach(() => {
    getAllTasksServiceStub.restore();
  });

  const sample_authorizedEvent = {
    requestContext: {
      authorizer: {
        userEmail: 'test@gmail.com'
      }
    }
  };
  const sample_successResponse = [{
    "5": {
      "note": "Say Konichiwa UIT",
      "userEmail": "test@gmail.com",
      "isChecked": false,
      "taskId": "krh0ns-Sw"
    }
  }];

  const fn = getAllTasks;

  it('should throw error if getAllTasks failed', async () => {
    getAllTasksServiceStub.callsFake(function () {
      return {
        promise: () => Promise.reject(new Error('NetworkError'))
      };
    });

    const result = await fn(sample_authorizedEvent);
    sinon.assert.match(result, internalErrorResult);
  })

  it('should return success message if getAllTasks succeed', async () => {
    getAllTasksServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({ Items: sample_successResponse })
      };
    });

    const result = await fn(sample_authorizedEvent);
    sinon.assert.match(result, successfulActionResult)
  })
})

describe('handler/getTaskById', () => {
  let getTaskServiceStub;
  beforeEach(() => {
    getTaskServiceStub = sinon.stub(docClient, 'get');
  });
  afterEach(() => {
    getTaskServiceStub.restore();
  });

  const sample_validEvent = {
    pathParameters: {
      id: 'test',
    },
  };
  const sample_authorizedEvent = {
    requestContext: {
      authorizer: {
        userEmail: 'test@gmail.com'
      }
    }
  };
  const sample_successResponse = {
    "note": "Do UwU",
    "userEmail": "test@gmail.com",
    "isChecked": false,
    "taskId": "-gNdsuDhO"
  };

  const fn = getTaskById;

  it('should throw error if no body provided', async () => {
    const result = await fn(sample_authorizedEvent);
    sinon.assert.match(result, badRequestResult);
  })

  it('should response code 404 if getTaskById not found', async () => {
    getTaskServiceStub.callsFake(function () {
      return {
        promise: () => Promise.resolve({})
      };
    });

    const result = await fn({
      ...sample_validEvent,
      ...sample_authorizedEvent,
    });
    sinon.assert.match(result, notFoundResult);
  })

  it('should return code 500 if getTaskById got error', async () => {
    getTaskServiceStub.callsFake(function () {
      return {
        promise: () => Promise.reject(new Error('InternalError'))
      };
    });

    const result = await fn({
      ...sample_validEvent,
      ...sample_authorizedEvent,
    });
    sinon.assert.match(result, internalErrorResult);
  })

  it('should return success message if getTaskById succeed', async () => {
    getTaskServiceStub.callsFake(function () {
      return {
        promise: () => Promise.resolve({ Item: sample_successResponse })
      };
    });

    const result = await fn({
      ...sample_validEvent,
      ...sample_authorizedEvent,
    });
    sinon.assert.match(result, successfulActionResult)
  })
})

describe('handler/updateTaskById', () => {
  let updateTaskServiceStub;
  beforeEach(() => {
    updateTaskServiceStub = sinon.stub(docClient, 'update');
  });
  afterEach(() => {
    updateTaskServiceStub.restore();
  });

  const sample_authorizedEvent = {
    requestContext: {
      authorizer: {
        userEmail: 'test@gmail.com'
      }
    }
  };
  const sample_validEvent = {
    pathParameters: {
      id: 'test',
    },
    body: `{ "note": "Do UwU", "isChecked": true }`,
  };
  const sample_onlyIdProvidedEvent = {
    pathParameters: {
      id: 'test',
    },
    body: '{}',
  };
  const sample_successResponse = {
    "note": "Do UwU",
    "userEmail": "test@gmail.com",
    "isChecked": false,
    "taskId": "-gNdsuDhO"
  };

  const fn = updateTaskById;

  it('should throw error if no body and ID are provided', async () => {
    const result = await fn(sample_authorizedEvent);
    sinon.assert.match(result, badRequestResult);
  })

  it('should throw error if body and ID provided but body is empty', async () => {
    const result = await fn({
      ...sample_onlyIdProvidedEvent,
      ...sample_authorizedEvent
    });
    sinon.assert.match(result, badRequestResult);
  })

  it('should throw error if findOneAndUpdateTaskById failed', async () => {
    updateTaskServiceStub.callsFake(() => {
      return {
        promise: () => Promise.reject(new Error('error'))
      }
    });

    const result = await fn({
      ...sample_validEvent,
      ...sample_authorizedEvent
    });
    sinon.assert.match(result, internalErrorResult);
  })

  it('should return success message if findOneAndUpdateTaskById succeed', async () => {
    updateTaskServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({ Attributes: sample_successResponse })
      }
    });

    const result = await fn({
      ...sample_validEvent,
      ...sample_authorizedEvent
    });
    sinon.assert.match(result, successfulActionResult)
  })
})

describe('handler/deleteTaskById', () => {
  let deleteTaskByIdServiceStub;
  beforeEach(() => {
    deleteTaskByIdServiceStub = sinon.stub(docClient, 'delete');
  });

  afterEach(() => {
    deleteTaskByIdServiceStub.restore();
  })

  const sample_authorizedEvent = {
    requestContext: {
      authorizer: {
        userEmail: 'test@gmail.com'
      }
    }
  };
  const sample_validEvent = {
    pathParameters: {
      id: 'test'
    }
  };
  const fn = deleteTaskById;

  it('should throw error if no body and ID are provided', async () => {
    const result = await fn(sample_authorizedEvent);
    sinon.assert.match(result, badRequestResult);
  })

  it('should throw error if findOneAndDeleteTaskById failed', async () => {
    deleteTaskByIdServiceStub.callsFake(() => {
      return {
        promise: () => Promise.reject(new Error('error'))
      }
    });

    const result = await fn({
      ...sample_validEvent,
      ...sample_authorizedEvent
    });
    sinon.assert.match(result, internalErrorResult);
  })

  it('should return success message if findOneAndDeleteTaskById succeed', async () => {
    deleteTaskByIdServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({})
      }
    });

    const result = await fn({
      ...sample_validEvent,
      ...sample_authorizedEvent
    });
    sinon.assert.match(result, successfulActionResult)
  })
})

describe('handler/register', () => {
  const email = 'email@test.com';
  const password = 'password';
  const name = 'name';
  const unprocessedResult = { statusCode: 422 };
  const createdResult = { statusCode: 201 };

  describe('validation', () => {
    it('should return bad request if no body is provided', async () => {
      const result = await register({});
      sinon.assert.match(result, badRequestResult);
    });

    it('should return bad request if no email is provided', async () => {
      const result = await register({
        body: JSON.stringify({
          password,
          name,
        })
      });
      sinon.assert.match(result, badRequestResult);
    });

    it('should return bad request if no password is provided', async () => {
      const result = await register({
        body: JSON.stringify({
          email,
          name
        })
      });
      sinon.assert.match(result, badRequestResult);
    });

    it('should return bad request if no name is provided', async () => {
      const result = await register({
        body: JSON.stringify({
          email,
          password
        })
      });
      sinon.assert.match(result, badRequestResult);
    });
  });

  describe('execution', () => {
    let getUserByEmailStub;
    let saveToDbStub;
    let sendVerifyEmailStub;
    beforeEach(() => {
      getUserByEmailStub = sinon.stub(docClient, 'get');
      saveToDbStub = sinon.stub(User.prototype, 'saveToDb');
      sendVerifyEmailStub = sinon.stub(User.prototype, 'sendVerifyEmail');
    });
    afterEach(() => {
      getUserByEmailStub.restore();
      saveToDbStub.restore();
      sendVerifyEmailStub.restore();
    })

    it('should return unprocessed result if user exists and verified', async () => {
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({
            Item: {
              email,
              name,
              password,
              isVerified: true
            }
          })
        };
      });
      const result = await register({
        body: JSON.stringify({
          email,
          password,
          name
        })
      });
      sinon.assert.match(result, unprocessedResult);
    });

    it('should return internal error if error occur while doing creation', async () => {
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({})
        };
      });
      saveToDbStub.rejects(new Error('validateError'));
      const result = await register({
        body: JSON.stringify({
          email,
          password,
          name
        })
      })
      sinon.assert.match(result, internalErrorResult);
    });

    it('should create new user and send verification email', async () => {
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({})
        };
      });
      saveToDbStub.resolves();
      sendVerifyEmailStub.resolves();
      const result = await register({
        body: JSON.stringify({
          email,
          password,
          name
        })
      });
      sinon.assert.calledWith(saveToDbStub, true);
      sinon.assert.calledOnce(sendVerifyEmailStub);
      sinon.assert.match(result, createdResult);
    });
  });
});

describe('handler/verifyEmail', () => {
  describe('validation', () => {
    it('should return bad request if no token is provided', async () => {
      const result = await verifyEmail({});
      sinon.assert.match(result, badRequestResult);
    });
  });

  describe('execution', () => {
    const sample_validEvent = {
      pathParameters: { token: 'token' }
    }
    const email = 'email@test.com';
    let verifyStub;
    let saveToDbStub;
    let getUserByEmailStub;
    let setVerifiedEmailSpy;
    const sample_foundUser = {
      email: email,
      password: 'password',
      name: 'name',
      isVerified: false
    }
    beforeEach(() => {
      verifyStub = sinon.stub(jwt, 'verify');
      saveToDbStub = sinon.stub(User.prototype, 'saveToDb');
      getUserByEmailStub = sinon.stub(docClient, 'get');
      setVerifiedEmailSpy = sinon.spy(User.prototype, 'setVerifiedEmail');
    });
    afterEach(() => {
      verifyStub.restore();
      saveToDbStub.restore();
      getUserByEmailStub.restore();
      setVerifiedEmailSpy.restore();
    })

    it('should return bad request if token is invalid', async () => {
      verifyStub.throws(new Error('invalid signature'));
      const result = await verifyEmail(sample_validEvent);
      sinon.assert.match(result, badRequestResult);
    });

    it('should return internal error token is valid but finding user encounter error', async () => {
      verifyStub.returns({ email });
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.reject(new Error('connection error'))
        };
      });
      const result = await verifyEmail(sample_validEvent);
      sinon.assert.match(result, internalErrorResult);
    });

    it('should return bad request if token is valid but not found any user', async () => {
      verifyStub.returns({ email });
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({})
        };
      });
      const result = await verifyEmail(sample_validEvent);
      sinon.assert.match(result, badRequestResult);
    });

    it('should return success message if verification is done', async () => {
      verifyStub.returns({ email });
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({ Item: { ...sample_foundUser } })
        };
      });
      const result = await verifyEmail(sample_validEvent);
      sinon.assert.calledOnce(setVerifiedEmailSpy);
      sinon.assert.calledOnce(saveToDbStub);
      sinon.assert.match(result, successfulActionResult);
    });
  });
});

describe('handler/myAccount', () => {
  let getUserByEmailStub;
  beforeEach(() => {
    getUserByEmailStub = sinon.stub(docClient, 'get');
  });
  afterEach(() => {
    getUserByEmailStub.restore();
  })
  const sample_authorizedEvent = {
    requestContext: {
      authorizer: {
        userEmail: 'test@gmail.com'
      }
    }
  };
  const sample_userInfo = {
    email: 'test@gmail.com', 
    password: 'test', 
    name: 'test',
  }
  it('should return internal error if find user encountered error', async () => {
    getUserByEmailStub.callsFake(() => {
      return {
        promise: () => Promise.reject(new Error('Internal error'))
      }
    });
    const result = await myAccount(sample_authorizedEvent);
    sinon.assert.match(result, internalErrorResult);
  });

  it('should return success response if no error encountered', async () => {
    getUserByEmailStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({Item: sample_userInfo})
      }
    });
    const result = await myAccount(sample_authorizedEvent);
    sinon.assert.match(result, successfulActionResult);
  });
});

describe('handler/login', () => {
  const email = 'test@example.com';
  const password = 'password';
  const invalidCredentialsResult = { statusCode: 401 }

  describe('validation', () => {
    it('should return bad request if no body is provided', async () => {
      const result = await login({});
      sinon.assert.match(result, badRequestResult);
    });

    it('should return bad request if no email is provided', async () => {
      const result = await login({ body: JSON.stringify({ password }) });
      sinon.assert.match(result, badRequestResult);
    });

    it('should return bad request if no password is provided', async () => {
      const result = await login({ body: JSON.stringify({ email }) });
      sinon.assert.match(result, badRequestResult);
    });
  });
  describe('execution', () => {
    const sample_foundUserInfo = {
      email,
      password,
    }
    let getUserByEmailStub;
    let matchPasswordStub;
    let getAccessTokenStub;
    let saveToDbStub;
    beforeEach(() => {
      getUserByEmailStub = sinon.stub(docClient, 'get');
      matchPasswordStub = sinon.stub(User.prototype, 'matchPassword');
      getAccessTokenStub = sinon.stub(User.prototype, 'getAccessToken');
      saveToDbStub = sinon.stub(User.prototype, 'saveToDb');
    });

    afterEach(() => {
      getUserByEmailStub.restore();
      matchPasswordStub.restore();
      getAccessTokenStub.restore();
      saveToDbStub.restore();
    });

    it('should return invalid credentials if no user found with provided email', async () => {
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({})
        };
      });
      const result = await login({ body: JSON.stringify({ email, password }) });
      sinon.assert.match(result, invalidCredentialsResult);
    });

    it('should return internal error if finding user encountered error', async () => {
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.reject(new Error('Internal error'))
        };
      });
      const result = await login({ body: JSON.stringify({ email, password }) });
      sinon.assert.match(result, internalErrorResult);
    });

    it('should return need verify email message if user is not verified yet', async () => {
      const unprocessedResult = { statusCode: 422 };
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({
            Item: {
              ...sample_foundUserInfo,
              isVerified: false
            }
          })
        };
      });
      const result = await login({ body: JSON.stringify({ email, password }) });
      sinon.assert.match(result, unprocessedResult);
    });

    it('should return invalid credentials if provided password is not match', async () => {
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({
            Item: {
              ...sample_foundUserInfo,
              isVerified: true
            }
          })
        };
      });
      matchPasswordStub.resolves(false);
      const result = await login({ body: JSON.stringify({ email, password }) });
      sinon.assert.match(result, invalidCredentialsResult);
    });

    it('should return token if credentials match', async () => {
      getUserByEmailStub.callsFake(() => {
        return {
          promise: () => Promise.resolve({
            Item: {
              ...sample_foundUserInfo,
              isVerified: true
            }
          })
        };
      });
      matchPasswordStub.resolves(true);
      getAccessTokenStub.returns('token');
      saveToDbStub.resolves({});
      const result = await login({ body: JSON.stringify({ email, password }) });
      sinon.assert.calledOnce(getAccessTokenStub);
      sinon.assert.match(result, successfulActionResult);
    });
  });
});