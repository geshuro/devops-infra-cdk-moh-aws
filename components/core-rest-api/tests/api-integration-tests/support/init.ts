import _ from 'lodash';

import { getToken } from '@aws-ee/api-testing-framework';

import { createUser } from './complex/create-user';

class MissingStackOutputError extends Error {
  constructor(readonly stackName: string, readonly outputName: string) {
    super(`No "${outputName}" output defined by stack "${stackName}"`);
  }
}

export async function init({ settings, aws }) {
  const [cloudFormation, parameterStore, cognitoUserPools] = await Promise.all([
    aws.services.cloudFormation(),
    aws.services.parameterStore(),
    aws.services.cognitoUserPools(),
  ]);

  // There are a few settings that we need to derive and add to the settings
  const envName = settings.get('envName');
  const awsRegionShortName = settings.get('awsRegionShortName');
  const solutionName = settings.get('solutionName');

  const authStackName = `${envName}-${awsRegionShortName}-${solutionName}-auth`;
  const apiStackName = `${envName}-${awsRegionShortName}-${solutionName}-api`;

  settings.set('authStackName', authStackName);
  settings.set('apiStackName', apiStackName);

  // The api endpoint from CloudFormation if not local
  let apiEndpoint;
  let websiteUrl;

  // If isLocal = false, we get the api endpoint from the backend stack outputs
  if (settings.get('isLocal')) {
    apiEndpoint = settings.get('localApiEndpoint');
    websiteUrl = 'http://localhost';
  } else {
    apiEndpoint = await cloudFormation.getStackOutputValue(apiStackName, 'ApiUrl');
    if (_.isEmpty(apiEndpoint)) throw new MissingStackOutputError(apiStackName, 'ApiUrl');

    websiteUrl = await cloudFormation.getStackOutputValue(apiStackName, 'WebsiteUrl');
    if (_.isEmpty(websiteUrl)) throw new MissingStackOutputError(apiStackName, 'WebsiteUrl');
  }

  settings.set('apiEndpoint', apiEndpoint);
  settings.set('websiteUrl', websiteUrl);

  // Get Cognito user pool info from backend stack
  const userPoolId = await cloudFormation.getStackOutputValue(authStackName, 'UserPoolId');
  if (_.isEmpty(userPoolId)) throw new MissingStackOutputError(authStackName, 'UserPoolId');

  const appClientId = await cloudFormation.getStackOutputValue(authStackName, 'ApiIntegrationTestAppClient');
  if (_.isEmpty(appClientId)) throw new MissingStackOutputError(authStackName, 'ApiIntegrationTestAppClient');

  const awsRegion = settings.get('awsRegion');
  const authenticationProviderId = `https://cognito-idp.${awsRegion}.amazonaws.com/${userPoolId}`;

  settings.set('userPoolId', userPoolId);
  settings.set('appClientId', appClientId);
  settings.set('authenticationProviderId', authenticationProviderId);

  // Try to get the default test admin password from Parameter Store and ensure the user exists
  const adminEmail = settings.get('apiIntegrationTestAdminEmail');
  const paramStoreRoot = settings.get('paramStoreRoot');
  const adminPasswordParamKey = `${paramStoreRoot}/api-integration-tests/admin-password`;

  let adminPassword;
  try {
    adminPassword = _.first(
      await Promise.all([
        parameterStore.getParameter(adminPasswordParamKey),
        cognitoUserPools.getUser({ userPoolId, username: adminEmail }),
      ]),
    );
  } catch (error) {
    // Create the default test admin if it doesn't exist
    if (_.includes(['ParameterNotFound', 'UserNotFoundException'], _.get(error, 'code'))) {
      const adminUser = {
        email: adminEmail,
        firstName: 'API Integration',
        lastName: 'Test Admin',
        userRoles: ['admin'],
      };
      const createUserResult = await createUser({ aws, user: adminUser });

      // Store the new admin's password in Parameter Store
      adminPassword = createUserResult.password;
      await parameterStore.putParameter(adminPasswordParamKey, adminPassword, true);
    } else {
      throw new Error(`Failed to retrieve test admin details: ${_.get(error, 'message', error)}`);
    }
  }

  settings.set('password', adminPassword);

  // Get token for default admin
  const adminToken = await getToken({ aws, username: adminEmail, password: adminPassword });
  settings.set('adminToken', adminToken);
}
