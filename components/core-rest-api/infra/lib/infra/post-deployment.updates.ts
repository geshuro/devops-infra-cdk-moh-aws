import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostDeploymentStack } from '@aws-ee/core-post-deployment-infra';
import { CoreConfig } from '@aws-ee/core-infra';

import { RestApiConfig } from '../config/rest-api-config';

@Injectable()
export class PostDeploymentUpdates {
  constructor(configService: ConfigService, postDeploymentStack: PostDeploymentStack) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    const restApiConfig = configService.get<RestApiConfig>(RestApiConfig.KEY)!;

    postDeploymentStack.postDeploymentLambda
      .addEnvironment('APP_PARAM_STORE_JWT_SECRET', restApiConfig.paramStoreJwtSecret)
      .addEnvironment('APP_JWT_OPTIONS', restApiConfig.jwtOptions!)
      .addEnvironment('APP_SOLUTION_NAME', coreConfig.solutionName);

    postDeploymentStack.postDeploymentLambda.addToRolePolicy(
      new PolicyStatement({
        sid: 'paramStoreAccess',
        actions: ['ssm:GetParameter', 'ssm:PutParameter', 'ssm:DeleteParameter'],
        resources: [
          postDeploymentStack.formatArn({
            service: 'ssm',
            resource: 'parameter',
            resourceName: `${coreConfig.paramStoreRoot}/*`,
          }),
        ],
      }),
    );
  }
}
