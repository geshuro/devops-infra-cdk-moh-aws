import { Module, Global } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { BackendCommonModule } from '@aws-ee/backend-common';
import { configDbPrefixLoader } from '@aws-ee/common';
import { UserModelDefinition } from '@aws-ee/core';

import { CoreAuthCognitoPostConfirmModule } from '@aws-ee/core-auth-cognito';

const dbModels = [UserModelDefinition];
@Global()
@Module({
  imports: [
    BackendCommonModule,
    DynamooseModule.forRoot({ model: { create: false, prefix: configDbPrefixLoader() } }),
    DynamooseModule.forFeature(dbModels),
    CoreAuthCognitoPostConfirmModule,
  ],
  exports: [BackendCommonModule],
})
export class SignUpConfirmationHandlerModule {}
