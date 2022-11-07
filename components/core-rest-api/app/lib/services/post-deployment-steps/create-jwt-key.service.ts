import { Injectable } from '@nestjs/common';
import { LoggerService } from '@aws-ee/core';
import type { PostDeploymentStep } from '@aws-ee/core-post-deployment';
import { ConfigService } from '@nestjs/config';
import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  ParameterNotFound,
} from '@aws-sdk/client-ssm';
import passwordGenerator from 'generate-password';
import { PostDeploymentConfig } from '../../config/post-deployment-config';
import { RestApiSharedConfig } from '../../config/shared-config';

@Injectable()
export class CreateJwtKeyService implements PostDeploymentStep {
  private readonly config: PostDeploymentConfig;
  private readonly sharedConfig: RestApiSharedConfig;

  constructor(private readonly log: LoggerService, configService: ConfigService) {
    this.config = configService.get(PostDeploymentConfig.KEY)!;
    this.sharedConfig = configService.get(RestApiSharedConfig.KEY)!;
  }

  generatePassword(): string {
    return passwordGenerator.generate({
      length: 12, // 12 characters in password
      numbers: true, // include numbers in password
      symbols: true, // include symbols
      uppercase: true, // include uppercase
      strict: true, // make sure to include at least one character from each pool
    });
  }

  async createJwtSigningKey(): Promise<void> {
    const ssm = new SSMClient({ apiVersion: '2014-11-06' });

    let doesKeyExist = false;
    try {
      await ssm.send(new GetParameterCommand({ Name: this.sharedConfig.paramStoreJwtSecret, WithDecryption: true }));
      doesKeyExist = true;
    } catch (err) {
      if ((err as ParameterNotFound).name !== 'ParameterNotFound') {
        // Swallow "ParameterNotFound" and let all other errors bubble up
        throw err;
      }
    }

    if (doesKeyExist) {
      this.log.info(
        `JWT signing key already exists in parameter store at ${this.sharedConfig.paramStoreJwtSecret}. Did not reset it.`,
      );
      // TODO: Support resetting JWT key
    } else {
      // Auto-generate signing key for the jwt tokens
      const jwtSigningKey = this.generatePassword();

      await ssm.send(
        new PutParameterCommand({
          Name: this.sharedConfig.paramStoreJwtSecret,
          Type: 'SecureString',
          Value: jwtSigningKey,
          Description: `JWT signing key for ${this.config.solutionName}`,
          Overwrite: true,
        }),
      );

      this.log.info(
        `Created JWT signing key and saved it to parameter store at "${this.sharedConfig.paramStoreJwtSecret}"`,
      );
    }
  }

  async execute(): Promise<void> {
    // The following will create new JWT signing key every time it is executed
    // TODO: Do not re-create JWT keys if they already exists, at the same time support for rotating the key
    return this.createJwtSigningKey();
  }

  async cleanup(): Promise<void> {
    // cleanup JWT key from SSM store
    const ssm = new SSMClient({ apiVersion: '2014-11-06' });

    try {
      await ssm.send(
        new DeleteParameterCommand({
          Name: this.sharedConfig.paramStoreJwtSecret,
        }),
      );
      this.log.info(`Deleted JWT signing from parameter store from path "${this.sharedConfig.paramStoreJwtSecret}"`);
    } catch (e) {
      if ((e as ParameterNotFound).name === 'ParameterNotFound') {
        this.log.info(
          `JWT signing does not exist in parameter store at path "${this.sharedConfig.paramStoreJwtSecret}"; nothing to do.`,
        );
      }
    }
  }
}
