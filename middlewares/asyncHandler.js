const middy = require('@middy/core');
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpErrorHandler = require('@middy/http-error-handler');

module.exports = (handler) => {
  return middy(handler)
    .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
    .use(httpErrorHandler());
};
