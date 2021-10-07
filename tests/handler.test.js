const sinon = require('sinon');
const { beforeEach, afterEach } = require('mocha');

const { createTask } = require('../handler');
const services = require('../services');

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

  const successfulActionResult = { statusCode: 200 };
  const failedActionResult = { statusCode: 400 };

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