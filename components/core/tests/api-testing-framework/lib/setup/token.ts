import _ from 'lodash';
import assert from 'assert';
import type { Aws } from '../aws/init-aws';

export async function getToken({
  aws,
  username,
  password,
}: {
  aws: Aws;
  username: string;
  password: string;
}): Promise<string> {
  assert(username, 'username is required');
  assert(password, 'password is required');

  const userPoolId = aws.settings.get('userPoolId');
  const appClientId = aws.settings.get('appClientId');

  const cognitoUserPools = await aws.services.cognitoUserPools();
  if (_.isEmpty(cognitoUserPools)) {
    throw new Error('No "cognitoUserPools" AWS service class registered. Cannot authenticate test user.');
  }

  return cognitoUserPools.authenticate({ userPoolId, appClientId, username, password });
}
