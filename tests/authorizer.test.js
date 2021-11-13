const sinon = require('sinon');
const { beforeEach, afterEach, it } = require('mocha');
const jwt = require('jsonwebtoken');

const { authorize } = require('../authorizer');
const utils = require('../utils');
const userService = require('../services/userService');

describe('authorizer/authorize', () => {
  let verifyStub;
  let generateAuthResponseSpy;
  let getUserByEmailStub;
  const sample_validEvent = {
    authorizationToken: 'Bearer token',
    methodArn: 'arn:testing'
  };
  const sample_invalidEvent = {
    authorizationToken: '',
  };
  let callbackStub = sinon.stub();
  const email = 'test@example.com';
  

  beforeEach(() => {
    verifyStub = sinon.stub(jwt, 'verify');
    generateAuthResponseSpy = sinon.spy(utils, 'generateAuthResponse');
    getUserByEmailStub = sinon.stub(userService, 'getUserByEmail');
  });

  afterEach(() => {
    callbackStub.reset();
    verifyStub.restore();
    generateAuthResponseSpy.restore();
    getUserByEmailStub.restore();
  });

  it('should callback with "unauthorized" params if no token or methodArn provided', async () => {
    await authorize(sample_invalidEvent, null, callbackStub);
    sinon.assert.calledWith(callbackStub, null, 'Unauthorized');
  });

  it('should generateAuthResponse with "Deny" params if no email decoded', async () => {
    verifyStub.returns({});
    await authorize(sample_validEvent, null, callbackStub);
    sinon.assert.calledWith(generateAuthResponseSpy, undefined, 'Deny', 'arn:testing');
  });

  it('should generateAuthResponse with "Deny" params if no user found', async () => {
    verifyStub.returns({ email });
    getUserByEmailStub.resolves(null);
    await authorize(sample_validEvent, null, callbackStub);
    sinon.assert.calledWith(generateAuthResponseSpy, email, 'Deny', 'arn:testing');
  });

  it('should generateAuthResponse with "Deny" params if user found but token is invalid', async () => {
    verifyStub.returns({ email });
    getUserByEmailStub.resolves({ 
      email,
      checkUniqueValidToken: () => false
    });
    await authorize(sample_validEvent, null, callbackStub);
    sinon.assert.calledWith(generateAuthResponseSpy, email, 'Deny', 'arn:testing');
  });

  it('should generateAuthResponse with "Allow" params if user found and token is valid', async () => {
    verifyStub.returns({ email });
    getUserByEmailStub.resolves({ 
      email,
      checkUniqueValidToken: () => true
    });
    await authorize(sample_validEvent, null, callbackStub);
    sinon.assert.calledWith(generateAuthResponseSpy, email, 'Allow', 'arn:testing', {
      userEmail: email
    });
  });
});