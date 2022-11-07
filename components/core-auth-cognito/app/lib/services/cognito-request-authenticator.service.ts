import { Injectable, UnauthorizedException, Optional, InternalServerErrorException } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  APIGatewayRequest,
  AuthenticationInfo,
  CookieTokenReader,
  CookieTokenWriter,
  RequestAuthenticator,
} from '@aws-ee/core-rest-api';
import { Boom, LoggerService, Principal } from '@aws-ee/core';
import { ConfigService } from '@nestjs/config';
import { CognitoApiConfig, CognitoLockoutMode } from '../config/cognito-api-config';
import { groupClaimToUserRoles } from './helpers/utils';
import { CognitoRevokedAccessService } from './cognito-revoked-access.service';

export type Identity = {
  providerName?: string;
  userId?: string;
  providerType?: string;
};

@Injectable()
export class CognitoRequestAuthenticator implements RequestAuthenticator {
  protected tokenReader = new CookieTokenReader();
  protected tokenWriter: CookieTokenWriter;
  protected config: CognitoApiConfig;

  constructor(
    protected readonly log: LoggerService,
    configService: ConfigService,
    @Optional() protected readonly revokedAccessService?: CognitoRevokedAccessService,
  ) {
    this.config = configService.get<CognitoApiConfig>(CognitoApiConfig.KEY)!;
    this.tokenWriter = new CookieTokenWriter(this.config.stage);

    if (this.config.cognitoLockoutMode === CognitoLockoutMode.IMMEDIATE && !this.revokedAccessService) {
      throw new InternalServerErrorException(
        Boom.safeMsg('In IMMEDIATE lockout mode, the RevokedAccessService MUST be provided!'),
      );
    }

    if (this.config.cognitoLockoutMode === CognitoLockoutMode.EVENTUAL && this.revokedAccessService) {
      throw new InternalServerErrorException(
        Boom.safeMsg('In EVENTUAL lockout mode, the RevokedAccessService MUST NOT be instantiated or provided!'),
      );
    }
  }

  async getAuthenticationInfo(req: unknown, res: Response): Promise<AuthenticationInfo | undefined> {
    const auth = (req as APIGatewayRequest).apiGateway?.event?.requestContext?.authorizer;
    const token = this.tokenReader.readToken(req as Request);

    if (!auth || !token) {
      return undefined;
    }

    const isRevoked = await this.revokedAccessService?.isRevoked({ token });
    if (isRevoked) {
      this.tokenWriter.clearToken(res);
      this.tokenWriter.clearRefreshToken(res);
      throw new UnauthorizedException(Boom.safeMsg('The token is revoked'));
    }

    const principal = this.getPrincipal(auth);
    return { principal, token };
  }

  protected getPrincipal(claims: Record<string, string>): Principal {
    const username = claims.username;

    return {
      uid: username,
      username,
      userRoles: groupClaimToUserRoles(claims['cognito:groups'])!,
    };
  }

  // protected getIdentity(claims: Record<string, string>): Identity | undefined {
  //   /*
  //     The `identity` field contains a single serialised object of type `Identity`
  //     The array test is to cover the case of multiple identities.
  //   */
  //   const identitiesStr = claims.identities;
  //   if (identitiesStr) {
  //     const identities = JSON.parse(identitiesStr);
  //     return Array.isArray(identities) ? identities[0] : identities;
  //   }
  //   return undefined;
  // }

  // private getUsername(claims: Record<string, string>): { username: string; usernameInIdp: string } {
  //   /*
  //     We will get the userId from identities structure if present since it doesn't have the custom providerName
  //     prepended
  //   */
  //   let username = claims['cognito:username'];

  //   const identity = this.getIdentity(claims);
  //   if (identity?.providerName && identity.userId) {
  //     username = identity.userId;
  //   }

  //   // The username may contain \\ or | (in case the user is authenticated via some other identity provider
  //   // via federation - such as SAML replace backslash with underscore in such case to satisfy various naming
  //   // constraints in our code base this is because we use the username for automatically naming various dependent
  //   // resources (such as IAM roles, policies, unix user groups etc) The backslash would not work in most of those
  //   // cases
  //   // Grab raw username on the IDP side. This is needed in certain situations
  //   // For example, when creating user home directories on jupyter for LDAP users, the directory name needs to match
  //   // username in IDP (i.e., AD or LDAP)

  //   // Examples of how username may appear:
  //   //   User without federation: johndoe@example.com
  //   //   User with Auth0 federation: auth0|5ef37c962da
  //   //   User with ADFS federation: ADFS\\123abc
  //   //   User with AWS SSO: johndoe@example.com

  //   let usernameInIdp = username;
  //   if (username.includes('\\')) {
  //     usernameInIdp = username.split('\\')[1];
  //     username = username.replace('\\', '_');
  //   }

  //   if (username.includes('|')) {
  //     usernameInIdp = username.split('|')[1];
  //     username = username.replace('|', '_');
  //   }

  //   return { username, usernameInIdp };
  // }
}
