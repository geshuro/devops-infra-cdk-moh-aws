/**
 * A function that performs the complex task of creating a user.
 */
async function createUser({ aws, user }) {
  // Create user in Cognito
  const userPoolId = aws.settings.get('userPoolId');

  const cognitoUserPools = await aws.services.cognitoUserPools();
  const { password } = await cognitoUserPools.createUser({ userPoolId, user });

  return { password };
}

module.exports = { createUser };
