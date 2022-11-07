/* eslint-disable no-console */
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { APIGatewayRequestAuthorizerHandler, APIGatewayRequestAuthorizerEvent } from 'aws-lambda';

const methodArnRegexp = /^(arn:[\w-]+:[\w-]+:[\w-]+:[\w-]+:[\w-]+)\/([^/]+)\/([^/]+)(.+)$/;

interface ParsedMethodArn {
  arnPrefix: string;
  stageName: string;
  httpMethod: string;
  path: string;
}

const config = loadConfig();

const verifier = CognitoJwtVerifier.create({
  userPoolId: config.userPoolId,
  tokenUse: 'access',
  clientId: config.clientId,
});

const fieldsToStringify = ['identities', 'cognito:groups'];

/**
 * The error needs to be thrown exactly like this for the API Gateway
 * to read it as a 401!
 */
const newUnauthorizedError = () => new Error('Unauthorized');

/**
 * The main entry point to this lambda
 */
export const handler: APIGatewayRequestAuthorizerHandler = async (event) => {
  const methodArn = parseMethodArn(event.methodArn);
  if (!methodArn) {
    throw new Error(`invalid method arn: ${event.methodArn}`);
  }

  const token = getToken(event);

  if (!token) {
    throw newUnauthorizedError();
  }

  let decodedToken;
  try {
    decodedToken = await verifier.verify(token);
  } catch (e) {
    console.error(e);
    throw newUnauthorizedError();
  }

  const context = sanitizeResponseContext(decodedToken);

  return {
    principalId: decodedToken.sub,
    policyDocument: buildRestApiPolicy(methodArn),
    context,
  };
};

/**
 * Load config from process environment.
 *
 * We're not using `class-validator` here because it adds 1MB
 * to the package size.
 */
function loadConfig() {
  const isString = (s?: string) => {
    if (!s) {
      throw new Error('Invalid configuration!');
    }
    return s;
  };

  // aws-jwt-verify: "clientId must be provided or set to null explicitly"
  const clientId = process.env.APP_USER_POOL_CLIENT_ID || null;

  if (!clientId) {
    console.warn('Audience validation is disabled. This should only happen in a DEV environment!');
  }

  return {
    userPoolId: isString(process.env.APP_USER_POOL_ID),
    clientId,
  };
}

/**
 * Load token from the `token` cookie
 *
 * @example
 * event = {
 *   headers: {
 *     Cookie:  'hello=otherCookie; token=eyAbcdefghi'
 *   }
 * }
 */
const getToken = (event: APIGatewayRequestAuthorizerEvent) =>
  // browser sends `Cookie` header capitalized (applicable for local development), but API Gateway has it lower-cased
  ((event.headers?.Cookie || event.headers?.cookie) ?? '')
    .split(';')
    .map((cookie) => cookie.trim())
    .filter((cookie) => !!cookie)
    .map((cookie) => cookie.split('='))
    .find((cookie) => cookie[0] === 'token')?.[1];

/**
 * Parses a method arn as provided by API GW
 */
function parseMethodArn(s: string): ParsedMethodArn | undefined {
  const matched = methodArnRegexp.exec(s);
  if (!matched) {
    return undefined;
  }
  const [, arnPrefix, stageName, httpMethod, path] = matched;
  return {
    arnPrefix,
    stageName,
    httpMethod,
    path,
  };
}

/**
 * Assembles a method arn from its parts
 */
const stringifyMethodArn = ({ arnPrefix, stageName = '*', httpMethod = '*', path = '/*' }: ParsedMethodArn) =>
  `${arnPrefix}/${stageName}/${httpMethod}${path}`;

/**
 * Build an appropriate IAM policy to return from the authorizer back to the gateway
 */
const buildRestApiPolicy = ({ arnPrefix, stageName }: ParsedMethodArn) => ({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: 'execute-api:Invoke',
      Resource: stringifyMethodArn({
        arnPrefix,
        stageName,
        httpMethod: '*',
        path: '/*',
      }),
    },
  ],
});

/**
 * Filter all non-simple values from the token so it can go into the context object
 */
const sanitizeResponseContext = (context: object) =>
  Object.entries(context).reduce((acc, [key, value]) => {
    let val;
    if (fieldsToStringify.includes(key)) {
      val = JSON.stringify(value);
    } else if (['string', 'boolean', 'number'].includes(typeof value)) {
      val = value;
    }

    if (val) {
      return { ...acc, [key]: val };
    }
    return acc;
  }, {});
