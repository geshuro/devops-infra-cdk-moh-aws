import jwtDecode from 'jwt-decode';
import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { Boom } from '@aws-ee/core';

import { RevokedAccessModelDefinition, RevokedAccess, RevokedAccessKey } from '../db/revoked-access.schema';

const disabledUserBlockTimeSecs = 24 * 60 * 60; // 1 day, the max lifetime of an access token

@Injectable()
export class CognitoRevokedAccessService {
  constructor(
    @InjectModel(RevokedAccessModelDefinition.name)
    private revokedAccessModel: Model<RevokedAccess, RevokedAccessKey>,
  ) {}

  async revokeAccess({ token }: { token: string }): Promise<void>;
  async revokeAccess({ username }: { username: string }): Promise<void>;
  async revokeAccess({ token, username }: { token?: string; username?: string }): Promise<void> {
    let record: RevokedAccess;
    if (token) {
      record = this.toTokenRevocationRecord(token);
    } else if (username) {
      record = this.toUserRevocationRecord(username);
    } else {
      throw new InternalServerErrorException(Boom.safeMsg('Either username or token must be provided!'));
    }
    await this.revokedAccessModel.create(record, { overwrite: true, return: 'document' });
  }

  async grantAccess({ username }: { username: string }): Promise<void> {
    const key = { username, sig: '*' };
    const foundRecord = await this.revokedAccessModel.get({ username, sig: '*' });
    if (foundRecord) {
      await this.revokedAccessModel.delete(key);
    }
  }

  /**
   * Checks if a token is revoked or the associated user is blocked.
   */
  async isRevoked({ token }: { token: string }): Promise<boolean> {
    const record = this.toTokenRevocationRecord(token);

    // Checks if the current token is locked
    const sigLocked = await this.revokedAccessModel
      .query('username')
      .eq(record.username)
      .where('sig')
      .eq(record.sig)
      .limit(1)
      .exec();

    if (sigLocked.length > 0) {
      return true;
    }

    // Checks if the user is disabled
    const userLocked = await this.revokedAccessModel
      .query('username')
      .eq(record.username)
      .where('sig')
      .eq('*')
      .limit(1)
      .exec();

    return userLocked.length > 0;
  }

  /**
   * A method responsible for translating token into a token revocation record
   */
  private toTokenRevocationRecord(token: string): RevokedAccess {
    try {
      const payload = jwtDecode<{ username: string; exp?: number }>(token);
      const signature = token.split('.')[2];

      // Note that the max limit for a sort key is 1024 bytes.
      // The JWT signatures are SHA256 (so always 256 bits) which are Base64 URL encoded so should fit in 1024 bytes.

      // Set the record's TTL as the token's expiry (i.e., let DynamoDB clear the record from the revocation table
      // after it is expired)
      return { username: payload.username, sig: signature, ttl: payload.exp ?? 0 };
    } catch (error) {
      throw new UnauthorizedException(Boom.create({ error: error as Error, message: 'Invalid Token', safe: true }));
    }
  }

  /**
   * A method responsible for translating a username into a revocation record.
   */
  private toUserRevocationRecord(username: string): RevokedAccess {
    const currentTimeInSeconds = Math.ceil(Date.now() / 1000);

    // Set the record's TTL as the maximum possible access token expiry (i.e., let DynamoDB clear the record from the
    // revocation table after it is expired)
    return { username, sig: '*', ttl: currentTimeInSeconds + disabledUserBlockTimeSecs };
  }
}
