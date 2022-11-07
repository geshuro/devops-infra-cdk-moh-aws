/* eslint-disable camelcase */
import { User } from '@aws-ee/core';
import type {
  AdminGetUserCommandOutput,
  GetUserCommandOutput,
  AttributeType,
  GroupType,
  UserType,
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoGroupPrefix = 'rbac:';

type ApiOutput = UserType | AdminGetUserCommandOutput | GetUserCommandOutput;

/**
 * Converts a user record into Cognito attributes that can be passed to Cognito's user management APIs
 */
export function userRecordToCognitoAttrs(user: Partial<User>): AttributeType[] {
  const attributeMap = [];

  if (user.email) {
    attributeMap.push({
      Name: 'email',
      Value: user.email,
    });
  }

  if (user.firstName) {
    attributeMap.push({
      Name: 'given_name',
      Value: user.firstName,
    });
  }

  if (user.lastName) {
    attributeMap.push({
      Name: 'family_name',
      Value: user.lastName,
    });
  }

  const customClaims = Object.keys(user.claims ?? {}).map((key) => ({ Name: key, Value: user.claims?.[key] }));

  return [...attributeMap, ...customClaims];
}

export function toAttributeMap(attributes?: AttributeType[]): Record<string, string> {
  if (!attributes) {
    return {};
  }
  return attributes.reduce((prev, attr) => ({ ...prev, [attr.Name!]: attr.Value! }), {});
}

export const cognitoApiGroupsToUserRoles = (groups?: GroupType[]): string[] =>
  (groups ?? [])
    .filter((group) => group.GroupName?.startsWith(cognitoGroupPrefix))
    .map((group) => group?.GroupName?.replace(cognitoGroupPrefix, '') ?? '');

export const toSolutionListUser = (user: UserType): User => apiResultToUser(user);

export function apiResultToUser(user: ApiOutput, userRoles?: string[]): User {
  const attributes = toAttributeMap(
    (user as UserType).Attributes || (user as AdminGetUserCommandOutput | GetUserCommandOutput).UserAttributes,
  );

  delete attributes.sub;
  delete attributes.email_verified;
  const { email, given_name, family_name, ...rest } = attributes;

  let enabled = true;
  if (typeof (user as AdminGetUserCommandOutput).Enabled === 'boolean') {
    enabled = (user as AdminGetUserCommandOutput).Enabled!;
  }

  return new User({
    uid: user.Username, // There is a UUID in the sub claim but the Cognito APIs don't use it
    enabled,
    email,
    firstName: given_name,
    lastName: family_name,
    username: user.Username,
    userRoles,
    claims: rest,
  });
}

export function groupClaimToUserRoles(groupClaim?: string | string[]): string[] {
  if (!groupClaim) {
    return [];
  }
  let groupClaimArr: string[];
  if (Array.isArray(groupClaim)) {
    groupClaimArr = groupClaim;
  } else {
    groupClaimArr = JSON.parse(groupClaim);
  }
  return groupClaimArr.filter(isCognitoRoleGroup).map((group) => groupNameToUserRole(group)!);
}

export const groupNameToUserRole = (groupName?: string): string | undefined =>
  groupName?.replace(cognitoGroupPrefix, '');

export const toCognitoRoleGroupName = (userRole: string): string => `${cognitoGroupPrefix}${userRole}`;

export const isCognitoRoleGroup = (groupName?: string): boolean => !!groupName?.startsWith(cognitoGroupPrefix);
