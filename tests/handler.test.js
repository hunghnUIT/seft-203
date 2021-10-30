const sinon = require('sinon');
const { beforeEach, afterEach } = require('mocha');

const { createTask, getAllTasks, getTaskById, updateTaskById, deleteTaskById } = require('../handler');
const { docClient } = require('../libs/dynamoDb');

const successfulActionResult = { statusCode: 200 };
const failedActionResult = { statusCode: 400 };
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
  const sample_event = {};
  const sample_taskBody = {
    'userId': 'user_00',
    'taskId': 'op24-m',
    'isChecked': false,
    'note': 'note',
  };

  const fn = createTask;

  it('should return failure message if null in body', async () => {
    const result = await fn({
      ...sample_event,
      body: sample_nullBody,
    });
    sinon.assert.match(result, failedActionResult);
  })

  it('should return success message if create task successfully', async () => {
    createTaskServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({})
      };
    });

    const result = await fn({
      ...sample_event,
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
      ...sample_event,
      body: sample_validBody,
    });

    sinon.assert.match(result, failedActionResult);
    sinon.assert.calledOnce(createTaskServiceStub);
  })
})

describe('handler/getAllTasks', () => {
  let getAllTasksServiceStub;
  beforeEach(() => {
    getAllTasksServiceStub = sinon.stub(docClient, 'scan');
  });
  afterEach(() => {
    getAllTasksServiceStub.restore();
  });

  const sample_successResponse = [{
    "5": {
      "note": "Say Konichiwa UIT",
      "userId": "user_00",
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

    const result = await fn();
    sinon.assert.match(result, internalErrorResult);
  })

  it('should return success message if getAllTasks succeed', async () => {
    getAllTasksServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({ Items: sample_successResponse })
      };
    });

    const result = await fn();
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
  const sample_successResponse = {
    "note": "Do UwU",
    "userId": "user_00",
    "isChecked": false,
    "taskId": "-gNdsuDhO"
  };

  const fn = getTaskById;

  it('should throw error if no body provided', async () => {
    const result = await fn({});
    sinon.assert.match(result, failedActionResult);
  })

  it('should throw error if getTaskById not found', async () => {
    getTaskServiceStub.callsFake(function () {
      return {
        promise: () => Promise.resolve({})
      };
    });

    const result = await fn(sample_validEvent);
    sinon.assert.match(result, notFoundResult);
  })

  it('should return success message if getTaskById succeed', async () => {
    getTaskServiceStub.callsFake(function () {
      return {
        promise: () => Promise.resolve({Item: sample_successResponse})
      };
    });

    const result = await fn(sample_validEvent);
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
    "userId": "user_00",
    "isChecked": false,
    "taskId": "-gNdsuDhO"
  };

  const fn = updateTaskById;

  it('should throw error if no body and ID are provided', async () => {
    const result = await fn({});
    sinon.assert.match(result, failedActionResult);
  })

  it('should throw error if body and ID provided but body is empty', async () => {
    const result = await fn(sample_onlyIdProvidedEvent);
    sinon.assert.match(result, failedActionResult);
  })

  it('should throw error if findOneAndUpdateTaskById failed', async () => {
    updateTaskServiceStub.callsFake(() => {
      return {
        promise: () => Promise.reject(new Error('error'))
      }
    });

    const result = await fn(sample_validEvent);
    sinon.assert.match(result, failedActionResult);
  })

  it('should return success message if findOneAndUpdateTaskById succeed', async () => {
    updateTaskServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({Attributes: sample_successResponse})
      }
    });

    const result = await fn(sample_validEvent);
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

  const sample_validEvent = {
    pathParameters: {
      id: 'test'
    }
  };
  const fn = deleteTaskById;

  it('should throw error if no body and ID are provided', async () => {
    const result = await fn({});
    sinon.assert.match(result, failedActionResult);
  })

  it('should throw error if findOneAndDeleteTaskById failed', async () => {
    deleteTaskByIdServiceStub.callsFake(() => {
      return {
        promise: () => Promise.reject(new Error('error'))
      }
    });

    const result = await fn(sample_validEvent);
    sinon.assert.match(result, failedActionResult);
  })

  it('should return success message if findOneAndDeleteTaskById succeed', async () => {
    deleteTaskByIdServiceStub.callsFake(() => {
      return {
        promise: () => Promise.resolve({})
      }
    });

    const result = await fn(sample_validEvent);
    sinon.assert.match(result, successfulActionResult)
  })
})