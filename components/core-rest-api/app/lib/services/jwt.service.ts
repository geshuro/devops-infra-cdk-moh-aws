import _ from 'lodash';
import jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Boom, LoggerService } from '@aws-ee/core';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { RestApiSharedConfig } from '../config/shared-config';

function removeNils(obj: Record<string, unknown>) {
  return _.transform<unknown, Record<string, unknown>>(
    obj,
    (result, value, key) => {
      if (value) {
        result[key] = value;
      }
    },
    {},
  );
}

@Injectable()
export class JwtService {
  private readonly config: RestApiSharedConfig;
  private secret: string | undefined;

  constructor(configService: ConfigService, private readonly log: LoggerService) {
    this.config = configService.get<RestApiSharedConfig>(RestApiSharedConfig.KEY)!;
  }

  async sign(payload: any, optionsOverride: jwt.SignOptions = {}): Promise<string> {
    const defaultOptions = JSON.parse(this.config.jwtOptions);

    // Create resultant options and remove Nil values (null or undefined) from the resultant options object.
    // This is done to allow removing an option using "optionsOverride"
    // For example, the defaultOptions "expiresIn": "2 days" but the we want to issue non-expiring token
    // we can pass optionsOverride with "expiresIn": undefined.
    // This will result in removing the "expiresIn" from the resultant options
    const options = removeNils({ ...defaultOptions, ...optionsOverride });

    const secret = await this.getSecret();

    return jwt.sign(payload, secret, options);
  }

  async verify(token: string): Promise<string | jwt.JwtPayload> {
    const secret = await this.getSecret();
    try {
      const payload = jwt.verify(token, secret);
      return payload;
    } catch (error) {
      throw new UnauthorizedException(Boom.create({ error: error as Error, message: 'Invalid Token', safe: true }));
    }
  }

  /**
   * Decodes a token and either returns the token payload or returns the complete decoded token as
   * { payload, header, signature } based on the "complete" flag.
   *
   * @param token The JWT token to decode
   *
   * @param complete A flag indicating whether to return just the payload or return the whole token in
   * { payload, header, signature } format after decoding. Defaults to true i.e., it returns the whole token.
   *
   * @param ignoreExpiration A flag indicating whether the decoding should ignore token expiration. If this flag is
   * false, the decoding will throw exception if an expired token is being decoded. Defaults to true i.e., it ignores expiration.
   *
   * @returns {Promise<*|boolean|undefined>}
   */
  async decode(token: string, { complete = true, ignoreExpiration = true } = {}): Promise<string | jwt.JwtPayload> {
    const secret = await this.getSecret();
    try {
      // using verify method here instead of "decode" method because the "decode" method does not return signature
      // we want to return signature also when complete === true
      return jwt.verify(token, secret, { complete, ignoreExpiration });
    } catch (error) {
      throw new UnauthorizedException(Boom.create({ error: error as Error, message: 'Invalid Token', safe: true }));
    }
  }

  async getSecret(): Promise<string> {
    if (!this.secret) {
      const ssm = new SSMClient({});
      this.log.info(`Getting the "${this.config.paramStoreJwtSecret}" key from the parameter store`);
      const result = await ssm.send(
        new GetParameterCommand({ Name: this.config.paramStoreJwtSecret, WithDecryption: true }),
      );
      this.secret = result.Parameter!.Value!;
    }
    return this.secret;
  }
}
