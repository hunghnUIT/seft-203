const sinon = require('sinon');
const { beforeEach, afterEach } = require('mocha');

const { createTask, getAllTasks } = require('../handler');
const services = require('../services');

const successfulActionResult = { statusCode: 200 };
const failedActionResult = { statusCode: 400 };

describe('handler/createTask', () => {
  let createTaskServiceStub;
  beforeEach(() => {
    createTaskServiceStub = sinon.stub(services, 'createTask');
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
    createTaskServiceStub.returns(sample_taskBody);

    const result = await fn({
      ...sample_event,
      body: sample_validBody,
    });
    sinon.assert.match(result, successfulActionResult);
  })

  it('should throw error if service create new task failed', async () => {
    createTaskServiceStub.throws(new Error('ValidateError'));

    const result = await fn({
      ...sample_event,
      body: sample_validBody,
    });

    sinon.assert.match(result, failedActionResult);
    sinon.assert.calledOnce(createTaskServiceStub);
  })
})

describe('handle/getAllTasks', () => {
  let getAllTasksServiceStub;
  beforeEach(() => {
    getAllTasksServiceStub = sinon.stub(services, 'getAllTasks');
  });
  afterEach(() => {
    getAllTasksServiceStub.restore();
  });

  const sample_successResponse = {
    "5": {
        "note": "Say Konichiwa UIT",
        "userId": "user_00",
        "isChecked": false,
        "taskId": "krh0ns-Sw"
    },
    "success": true
  };

  const fn = getAllTasks

  it('should throw error if getAllTasks failed', async () => {
    getAllTasksServiceStub.throws(new Error('NetworkError'));

    const result = await fn();
    sinon.assert.match(result, failedActionResult);
  })

  it('should return success message if getAllTasks succeed', async () => {
    getAllTasksServiceStub.returns(sample_successResponse);

    const result = await fn();
    sinon.assert.match(result, successfulActionResult)
  })
})