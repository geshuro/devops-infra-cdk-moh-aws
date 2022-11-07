import _ from 'lodash';

const errorCode = () => {
  const http = {
    badRequest: 400,
    concurrentUpdate: 400,
    // Make sure you know the difference between forbidden and unauthorized
    // (see https://stackoverflow.com/questions/3297048/403-forbidden-vs-401-unauthorized-http-responses)
    unauthorized: 401,
    invalidCredentials: 401,
    forbidden: 403,
    invalidToken: 403,
    notFound: 404,
    alreadyExists: 400,
    // Used when a conflicting operation is being performed (e.g. updating an item when a newer
    // revision of the same is updated by someone else before that)
    outdatedUpdateAttempt: 409,
    timeout: 408,
    payloadTooLarge: 413,
    uriTooLong: 414,
    badImplementation: 500,
    internalError: 500,
  };

  return {
    http: {
      status: http,
      code: _.mapValues(http, (ignore, key) => key),
    },
    others: {
      // This is when axios sends a request but does not receive a response
      noResponse: 'noResponse',
      // This is when there is an error forming the axios request object
      incorrectRequest: 'incorrectRequest',
    },
  };
};

const codes = errorCode();
export default codes;
