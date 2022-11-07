/* eslint-disable import/no-import-module-exports */
/* eslint-disable @typescript-eslint/no-var-requires */
import crypto from 'crypto';
import type { CognitoIdentityServiceProvider } from 'aws-sdk';
import { generatePassword } from '@aws-ee/api-testing-framework';

interface UserNotFoundException {
  code: 'UserNotFoundException';
}

interface ResourceNotFoundException {
  code: 'ResourceNotFoundException';
}

class CognitoUserPools {
  public aws: any;
  public sdk: CognitoIdentityServiceProvider;

  // The aws javascript sdk client name
  static readonly clientName = 'CognitoIdentityServiceProvider';

  constructor({ aws, sdk }: { aws: any; sdk: CognitoIdentityServiceProvider }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async createUser({ userPoolId, user: { userRoles, email, firstName, lastName, username = null } }) {
    // Create a new, random password for the user
    const password = generatePassword();

    // Create user in Cognito
    let createUserResp: CognitoIdentityServiceProvider.AdminCreateUserResponse;
    try {
      createUserResp = await this.sdk
        .adminCreateUser({
          UserPoolId: userPoolId,
          Username: username ?? email,
          TemporaryPassword: password,
          MessageAction: 'SUPPRESS', // Don't send invite email with temp password to new user
          UserAttributes: [
            {
              Name: 'email',
              Value: email,
            },
            {
              Name: 'given_name',
              Value: firstName,
            },
            {
              Name: 'family_name',
              Value: lastName,
            },
          ],
        })
        .promise();

      await this.ensureGroupsForUserRoles({ userPoolId, userRoles });

      for (const userRole of userRoles) {
        await this.sdk
          .adminAddUserToGroup({
            UserPoolId: userPoolId,
            Username: username ?? email,
            GroupName: toCognitoRoleGroupName(userRole),
          })
          .promise();
      }
    } catch (error) {
      throw new Error(`Error encountered creating user with email "${email}": ${(error as Error)?.message ?? error}`);
    }
    const userId = createUserResp?.User?.Username;

    return { userId, password };
  }

  async getUser({ userPoolId, username }) {
    return this.sdk.adminGetUser({ UserPoolId: userPoolId, Username: username }).promise();
  }

  async deleteUser({ userPoolId, username }) {
    try {
      await this.sdk
        .adminDeleteUser({
          UserPoolId: userPoolId,
          Username: username,
        })
        .promise();
    } catch (error) {
      if ((error as UserNotFoundException).code === 'UserNotFoundException') {
        // Duplicate deletes may happen. Ignoring...
      } else {
        throw new Error(
          `Error encountered deleting user with username "${username}": ${(error as Error).message ?? error}`,
        );
      }
    }
  }

  async authenticate({ userPoolId, appClientId, username, password }) {
    // Get app client secret
    const describeClientResp = await this.sdk
      .describeUserPoolClient({ UserPoolId: userPoolId, ClientId: appClientId })
      .promise();

    const appClientSecret = describeClientResp.UserPoolClient?.ClientSecret;

    // Build secret hash from app client secret
    const message = Buffer.from(username + appClientId, 'utf-8');
    const key = Buffer.from(appClientSecret!, 'utf-8');
    const secretHash = crypto.createHmac('sha256', key).update(message).digest('base64');

    // Authenticate user
    let authResponse: CognitoIdentityServiceProvider.AdminInitiateAuthResponse;
    try {
      authResponse = await this.sdk
        .adminInitiateAuth({
          AuthFlow: 'ADMIN_NO_SRP_AUTH',
          UserPoolId: userPoolId,
          ClientId: appClientId,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
            SECRET_HASH: secretHash,
          },
        })
        .promise();

      // If this is the first time the user has authenticated, respond to NEW_PASSWORD_REQUIRED request by "resetting"
      // the password to the same password already used
      if (authResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        authResponse = await this.sdk
          .adminRespondToAuthChallenge({
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            UserPoolId: userPoolId,
            ClientId: appClientId,
            ChallengeResponses: {
              USERNAME: username,
              NEW_PASSWORD: password,
              SECRET_HASH: secretHash,
            },
            Session: authResponse.Session,
          })
          .promise();
      }
    } catch (error) {
      throw new Error(`Failed to authenticate user "${username}": ${(error as Error).message ?? error}`);
    }

    // Confirm we actually got a token from the authentication process
    const token = authResponse.AuthenticationResult?.AccessToken;
    if (!token) {
      throw new Error(`Failed to get token for user "${username}"`);
    }

    return token;
  }

  async ensureGroupsForUserRoles({ userPoolId, userRoles }) {
    for (const userRole of userRoles) {
      const groupName = toCognitoRoleGroupName(userRole);
      let groupExists = false;
      try {
        await this.sdk.getGroup({ UserPoolId: userPoolId, GroupName: groupName }).promise();
        groupExists = true;
      } catch (e) {
        // ResourceNotFoundException is expected for a group that we've not created yet
        if ((e as ResourceNotFoundException).code !== 'ResourceNotFoundException') {
          throw e;
        }
      }

      if (!groupExists) {
        await this.sdk
          .createGroup({
            UserPoolId: userPoolId,
            GroupName: groupName,
            Description: `Autogenerated group for role ${userRole}`,
          })
          .promise();
      }
    }
  }
}

const toCognitoRoleGroupName = (userRole) => `rbac:${userRole}`;

// The framework is expecting this method. This is how the framework registers your aws services.
export async function registerServices({ registry }) {
  registry.set('cognitoUserPools', CognitoUserPools);
}
