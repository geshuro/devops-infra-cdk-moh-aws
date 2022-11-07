import { ConfigService } from '@nestjs/config';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PostDeploymentStep } from '@aws-ee/core-post-deployment';
import { Boom, LoggerService, UsersService } from '@aws-ee/core';
import { CognitoPostDeploymentConfig } from '../config/cognito-post-deployment-config';
import { CognitoCommonConfig } from '../config/cognito-common-config';

type CreateUsersError = { payload?: string[] };

@Injectable()
export class CognitoProvisionerPluginService implements PostDeploymentStep {
  commonConfig: CognitoCommonConfig;
  config: CognitoPostDeploymentConfig;

  constructor(
    private readonly usersService: UsersService,
    private readonly log: LoggerService,
    configService: ConfigService,
  ) {
    this.config = configService.get<CognitoPostDeploymentConfig>(CognitoPostDeploymentConfig.KEY)!;
    this.commonConfig = configService.get<CognitoCommonConfig>(CognitoCommonConfig.KEY)!;
  }

  async execute(): Promise<void> {
    // Create initial admin users in pool
    this.log.info('Creating configured admin users');

    const adminPrincipals = this.config.adminPrincipals;
    const users = adminPrincipals.map((principal) => ({
      ...principal,
      username: principal.email,
      userRoles: ['admin'],
    }));

    try {
      await this.usersService.createUsers({ users });
    } catch (bulkErrors) {
      const realErrorMsgs: string[] = [];
      const errorMsgs = (bulkErrors as CreateUsersError)?.payload;
      if (Array.isArray(errorMsgs)) {
        errorMsgs.forEach((errorMsg) => {
          if (errorMsg.endsWith('Cannot add user. The user already exists.')) {
            this.log.warn(errorMsg);
          } else {
            realErrorMsgs.push(errorMsg);
          }
        });
      }

      if (realErrorMsgs.length) {
        throw new InternalServerErrorException(
          Boom.msg('Error(s) encountered creating admin users').withPayload({ errors: realErrorMsgs }),
        );
      }
    }
  }
}
