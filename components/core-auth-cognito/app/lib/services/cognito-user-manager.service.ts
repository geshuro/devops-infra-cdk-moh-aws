import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Boom, LoggerService, User, UserBaseProps, UserInfoProps, UserManager, UserUpdateProps } from '@aws-ee/core';
import {
  CognitoIdentityProviderClient,
  UpdateUserAttributesCommand,
  DeleteUserCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { apiResultToUser, userRecordToCognitoAttrs } from './helpers/utils';

@Injectable()
export class CognitoUserManagerService implements UserManager {
  private cognitoClient = new CognitoIdentityProviderClient({});

  constructor(private readonly log: LoggerService) {}

  async getUser(props: UserInfoProps): Promise<User> {
    try {
      const apiUser = await this.cognitoClient.send(
        new GetUserCommand({
          AccessToken: props.token,
        }),
      );
      const user = apiResultToUser(apiUser, props.principal.userRoles);
      return user;
    } catch (err) {
      this.log.error(err);
      throw new UnauthorizedException(Boom.safeMsg('An error occurred when fetching user info.'));
    }
  }

  async updateUser(props: UserUpdateProps): Promise<User> {
    const existingUser = await this.getUser({ principal: props.principal, token: props.token });

    if (!existingUser) {
      throw new BadRequestException(Boom.safeMsg('User to update was not found.'));
    }

    // Find and update all changed attributes
    const existingCognitoAttrs = userRecordToCognitoAttrs(existingUser);
    const newCognitoAttrs = userRecordToCognitoAttrs(props.updates);

    // Search for new attributes that are missing from or different to the previous data.
    const updatedAttributes = newCognitoAttrs.filter(
      (newAttr) =>
        !existingCognitoAttrs.find(
          (existingAttr) => existingAttr.Name === newAttr.Name && existingAttr.Value === newAttr.Value,
        ),
    );

    if (updatedAttributes.length) {
      await this.cognitoClient.send(
        new UpdateUserAttributesCommand({
          AccessToken: props.token,
          UserAttributes: updatedAttributes,
        }),
      );
    }

    const updatedUser = await this.getUser({ principal: props.principal, token: props.token });
    return updatedUser;
  }

  async deleteUser(props: UserBaseProps): Promise<void> {
    await this.cognitoClient.send(
      new DeleteUserCommand({
        AccessToken: props.token,
      }),
    );
  }
}
