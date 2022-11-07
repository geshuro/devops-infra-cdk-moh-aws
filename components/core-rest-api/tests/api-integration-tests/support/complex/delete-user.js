/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const {
  utils: { run },
} = require('@aws-ee/api-testing-framework');

/**
 * A function that performs the complex task of deleting a user.
 *
 * @param {string} id The user id (a.k.a uid) to be deleted
 */
async function deleteUser({ aws, id = '' }) {
  // Delete the user from Cognito and the Users table
  const userPoolId = aws.settings.get('userPoolId');
  const cognitoUserPools = await aws.services.cognitoUserPools();

  await run(() => cognitoUserPools.deleteUser({ userPoolId, username: id }));
}

module.exports = { deleteUser };
