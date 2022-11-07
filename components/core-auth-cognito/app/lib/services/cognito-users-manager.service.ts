import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersManager, Boom, ListResult, User, CreateUser, LoggerService } from '@aws-ee/core';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  AdminCreateUserCommandOutput,
  AdminListGroupsForUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  CreateGroupCommand,
  ListUsersCommand,
  ListUsersCommandInput,
  UsernameExistsException,
  ResourceNotFoundException,
  GetGroupCommand,
  MessageActionType,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  isCognitoRoleGroup,
  toCognitoRoleGroupName,
  toSolutionListUser,
  apiResultToUser,
  cognitoApiGroupsToUserRoles,
  userRecordToCognitoAttrs,
  groupNameToUserRole,
} from './helpers/utils';
import { CognitoCommonConfig } from '../config/cognito-common-config';
import { CognitoRevokedAccessService } from './cognito-revoked-access.service';

@Injectable()
export class CognitoUsersManagerService implements UsersManager {
  private config: CognitoCommonConfig;
  private cognitoClient = new CognitoIdentityProviderClient({});

  constructor(
    configService: ConfigService,
    private log: LoggerService,
    @Optional() private readonly revokedAccessService?: CognitoRevokedAccessService,
  ) {
    this.config = configService.get<CognitoCommonConfig>(CognitoCommonConfig.KEY)!;
  }

  async getUser(uid: string): Promise<User | undefined> {
    const userProps = {
      UserPoolId: this.config.userPoolId,
      Username: uid,
    };
    try {
      const [getUserResponse, listGroupsResponse] = await Promise.all([
        this.cognitoClient.send(new AdminGetUserCommand(userProps)),
        this.cognitoClient.send(new AdminListGroupsForUserCommand(userProps)),
      ]);
      return apiResultToUser(getUserResponse, cognitoApiGroupsToUserRoles(listGroupsResponse.Groups));
    } catch (e) {
      if ((e as UserNotFoundException).name === 'UserNotFoundException') {
        throw new NotFoundException(Boom.safeMsg('The user was not found'));
      }
      throw e;
    }
  }

  private async listUserGroups(uid: string): Promise<string[]> {
    const userProps = {
      UserPoolId: this.config.userPoolId,
      Username: uid,
      Limit: 60,
    };
    const listGroupsResponse = await this.cognitoClient.send(new AdminListGroupsForUserCommand(userProps));

    return listGroupsResponse.Groups?.map((group) => group.GroupName!) ?? [];
  }

  async listUsers(props: {
    maxResults?: number | undefined;
    nextToken?: string | undefined;
    fields?: string[] | undefined;
  }): Promise<ListResult<User>> {
    const callProps: ListUsersCommandInput = {
      UserPoolId: this.config.userPoolId,
      Limit: props.maxResults,
      PaginationToken: props.nextToken,
    };
    if (props.fields?.length) {
      callProps.AttributesToGet = props.fields;
    }
    const result = await this.cognitoClient.send(new ListUsersCommand(callProps));

    return {
      count: result.Users?.length ?? 0,
      items: result.Users?.map(toSolutionListUser) ?? [],
      nextToken: result.PaginationToken,
    };
  }

  async getIssuerId(): Promise<string> {
    return this.config.authProviderId;
  }

  async createUser(user: CreateUser): Promise<User> {
    // SAML users are auto-created so we do not expect this method to be called for those
    // Create native user pool user
    const createUserParams: AdminCreateUserCommandInput = {
      UserPoolId: this.config.userPoolId,
      Username: user.email,
      UserAttributes: userRecordToCognitoAttrs(user),
    };

    if (user.temporaryPassword) {
      createUserParams.TemporaryPassword = user.temporaryPassword;
      createUserParams.MessageAction = MessageActionType.SUPPRESS;
    }

    let createUserResult: AdminCreateUserCommandOutput;
    try {
      createUserResult = await this.cognitoClient.send(new AdminCreateUserCommand(createUserParams));
    } catch (clientError) {
      // In cases where a Cognito user pool is configured to use email addresses as the primary username, the user's
      // email is passed as their username during creation but the username created in the pool is a UUID. As a
      // result the userService's call to getUserByPrincipal() may not find the user and an additional check is
      // check is needed here.
      if ((clientError as UsernameExistsException).name === 'UsernameExistsException') {
        throw new ConflictException(Boom.safeMsg('Cannot add user. The user already exists.'));
      }
      throw new InternalServerErrorException(
        Boom.msg('Error creating user in Cognito user pool').withPayload(clientError),
      );
    }

    // Disable user if not enabled
    if (!user.enabled) {
      try {
        await this.revokedAccessService?.revokeAccess({ username: createUserParams.Username! });
      } catch (error) {
        // The revocation is a precaution only
        // if it fails, we should carry on with the actual Cognito disabling call
        this.log.error('Failed to set user revocation lock', error);
      }
      await this.cognitoClient.send(
        new AdminDisableUserCommand({
          UserPoolId: this.config.userPoolId,
          Username: createUserResult.User!.Username,
        }),
      );
    }

    // Add user to the relevant group
    await this.ensureGroupsForUserRoles(user.userRoles);

    for (const userRole of user.userRoles) {
      await this.cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: this.config.userPoolId,
          Username: createUserResult.User!.Username,
          GroupName: toCognitoRoleGroupName(userRole),
        }),
      );
    }

    return apiResultToUser(createUserResult.User!, user.userRoles);
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<User> {
    const existingUser = await this.getUser(uid);
    const cognitoCalls: Promise<unknown>[] = [];

    if (!existingUser) {
      throw new BadRequestException(Boom.safeMsg('User to update was not found.'));
    }

    const baseCognitoParams = { UserPoolId: this.config.userPoolId, Username: existingUser.username };

    // Find and update all changed attributes
    const existingCognitoAttrs = userRecordToCognitoAttrs(existingUser);
    const newCognitoAttrs = userRecordToCognitoAttrs(updates);

    // Search for new attributes that are missing from or different to the previous data.
    const updatedAttributes = newCognitoAttrs.filter(
      (newAttr) =>
        !existingCognitoAttrs.find(
          (existingAttr) => existingAttr.Name === newAttr.Name && existingAttr.Value === newAttr.Value,
        ),
    );

    if (updatedAttributes.length) {
      cognitoCalls.push(
        this.cognitoClient.send(
          new AdminUpdateUserAttributesCommand({ ...baseCognitoParams, UserAttributes: updatedAttributes }),
        ),
      );
    }

    // Change the enabled status of needed
    if (typeof updates.enabled === 'boolean' && updates.enabled !== existingUser.enabled) {
      if (updates.enabled) {
        cognitoCalls.push(this.cognitoClient.send(new AdminEnableUserCommand(baseCognitoParams)));
        await this.revokedAccessService?.grantAccess({ username: uid });
      } else {
        cognitoCalls.push(this.cognitoClient.send(new AdminDisableUserCommand(baseCognitoParams)));
        await this.revokedAccessService?.revokeAccess({ username: uid });
      }
    }

    // Change the user's role if requested
    if (Array.isArray(updates.userRoles)) {
      // 1. Make sure that the target groups exists
      await this.ensureGroupsForUserRoles(updates.userRoles);

      // 2. Get existing groups and remove user from the ones that should no longer be associated
      const existingRoles = (await this.listUserGroups(uid)).filter(isCognitoRoleGroup).map(groupNameToUserRole);
      for (const existingRole of existingRoles) {
        if (!updates.userRoles.includes(existingRole!)) {
          cognitoCalls.push(
            this.cognitoClient.send(
              new AdminRemoveUserFromGroupCommand({
                ...baseCognitoParams,
                GroupName: toCognitoRoleGroupName(existingRole!),
              }),
            ),
          );
        }
      }

      // 3. Add the user to the new groups
      for (const newRole of updates.userRoles) {
        if (!existingRoles.includes(newRole)) {
          cognitoCalls.push(
            this.cognitoClient.send(
              new AdminAddUserToGroupCommand({
                ...baseCognitoParams,
                GroupName: toCognitoRoleGroupName(newRole),
              }),
            ),
          );
        }
      }
    }

    await Promise.all(cognitoCalls);

    const updatedUser = await this.getUser(uid);
    return updatedUser!;
  }

  async deleteUser(uid: string): Promise<void> {
    const deleteParams = { UserPoolId: this.config.userPoolId, Username: uid };

    await this.revokedAccessService?.revokeAccess({ username: uid });
    await this.cognitoClient.send(new AdminDeleteUserCommand(deleteParams));
  }

  private async ensureGroupsForUserRoles(userRoles: string[]) {
    for (const userRole of userRoles) {
      const groupName = toCognitoRoleGroupName(userRole);
      let groupExists = false;
      try {
        await this.cognitoClient.send(
          new GetGroupCommand({ UserPoolId: this.config.userPoolId, GroupName: groupName }),
        );
        groupExists = true;
      } catch (e) {
        // ResourceNotFoundException is expected for a group that we've not created yet
        if ((e as ResourceNotFoundException).name !== 'ResourceNotFoundException') {
          throw e;
        }
      }

      if (!groupExists) {
        await this.cognitoClient.send(
          new CreateGroupCommand({
            UserPoolId: this.config.userPoolId,
            GroupName: groupName,
            Description: `Autogenerated group for role ${userRole}`,
          }),
        );
      }
    }
  }
}
