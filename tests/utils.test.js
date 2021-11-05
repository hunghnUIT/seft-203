const sinon = require('sinon');
const { beforeEach, afterEach, it } = require('mocha');
const assert = require('assert');

const utils = require('../utils');

describe('utils', () => {
  describe('utils/generateSuccessResponse', () => {
    const sample_data = {
      key: 'value'
    }

    it('should return the right format if graphqlResponseType params is true', () =>{
      const sample_result = {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          ...sample_data
        })
      };
      const result = utils.generateSuccessResponse(sample_data, 200, true);
      assert.deepStrictEqual(sample_result, result);
    });

    it('should return the right format if graphqlResponseType params is false', () =>{
      const sample_result = {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {...sample_data}
        })
      };
      const result = utils.generateSuccessResponse(sample_data, 200, false);
      assert.deepStrictEqual(sample_result, result);
    });
  });

  describe('utils/generateFailureResponse', () => {
    const sample_data = {
      key: 'value'
    }

    it('should return the right format if graphqlResponseType params is true', () =>{
      const sample_result = {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          ...sample_data
        })
      };
      const result = utils.generateFailureResponse(sample_data, 400, true);
      assert.deepStrictEqual(sample_result, result);
    });

    it('should return the right format if graphqlResponseType params is false', () =>{
      const sample_result = {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          data: {...sample_data}
        })
      };
      const result = utils.generateFailureResponse(sample_data, 400, false);
      assert.deepStrictEqual(sample_result, result);
    });
  });

  describe('utils/isNotEmptyObj', () => {
    const sample_notEmptyObj = { key: 'value' };
    const sample_emptyObj = {};
    const sample_invalidInput = null;

    it('should return true if the value is not empty', () => {
      const result = utils.isNotEmptyObj(sample_notEmptyObj);
      assert.deepStrictEqual(true, result);
    });
    
    it('should return false if the value not empty', () => {
      const result = utils.isNotEmptyObj(sample_emptyObj);
      assert.deepStrictEqual(false, result);
    });

    it('should return false if the value not invalid', () => {
      const result = utils.isNotEmptyObj(sample_invalidInput);
      assert.deepStrictEqual(false, result);
    });
  });
});