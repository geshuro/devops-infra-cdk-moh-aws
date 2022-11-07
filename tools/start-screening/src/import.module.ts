import { Module, Global } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';

import { LoggerService } from '@aws-ee/core';

import { config } from './screening-request.config';
import { ImportService } from './services/import.service';

process.env.AWS_REGION = config.awsRegion;
process.env.AWS_PROFILE = config.awsProfile;
process.env.APP_DB_PREFIX = config.dbPrefix;

const providers = [ImportService, { provide: LoggerService, useValue: console }];

@Global()
@Module({
  imports: [
    DynamooseModule.forRoot({ model: { create: false, prefix: config.dbPrefix } }),
  ],
  providers,
  exports: providers,
})
export class ImportModule {}
