import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { Injectable, UnauthorizedException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticationInfo } from '@aws-ee/core-rest-api';
import { Boom, LoggerService } from '@aws-ee/core';
import { CognitoRequestAuthenticator } from './cognito-request-authenticator.service';
import { CognitoRevokedAccessService } from './cognito-revoked-access.service';

@Injectable()
export class CognitoLocalRequestAuthenticator extends CognitoRequestAuthenticator {
  constructor(
    log: LoggerService,
    configService: ConfigService,
    @Optional() revokedAccessService?: CognitoRevokedAccessService,
  ) {
    super(log, configService, revokedAccessService);
  }

  override async getAuthenticationInfo(req: Request, res: Response): Promise<AuthenticationInfo | undefined> {
    const token = this.tokenReader.readToken(req);

    if (!token) {
      return undefined;
    }

    const isRevoked = await this.revokedAccessService?.isRevoked({ token });
    if (isRevoked) {
      this.tokenWriter.clearToken(res);
      this.tokenWriter.clearRefreshToken(res);
      throw new UnauthorizedException(Boom.safeMsg('The token is revoked'));
    }

    const auth = jwt.decode(token) as jwt.JwtPayload;

    const principal = this.getPrincipal(auth);

    return { principal, token };
  }

  // protected override getIdentity(claims: Record<string, unknown>): Identity | undefined {
  //   // Federated Identities are provided in an `identities` array
  //   // This will not be present for a native user, so null-checking is necessary.
  //   // Note that this is only a deserialised array in the case of local development where
  //   // the token is unpacked directly
  //   return (claims.identities as Identity[])?.[0];
  // }
}
