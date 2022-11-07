import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostDeploymentStack } from '@aws-ee/core-post-deployment-infra';
import { CognitoInfra } from './cognito.infra';
import { CognitoConfig } from '../config/cognito-config';

@Injectable()
export class PostDeploymentUpdates {
  constructor(configService: ConfigService, cognitoInfra: CognitoInfra, postDeploymentStack: PostDeploymentStack) {
    const config = configService.get<CognitoConfig>(CognitoConfig.KEY)!;

    postDeploymentStack.postDeploymentLambda
      .addEnvironment('APP_USER_POOL_ID', cognitoInfra.userPool.userPoolId)
      .addEnvironment('APP_ADMIN_PRINCIPALS', JSON.stringify(config.adminPrincipals));

    postDeploymentStack.postDeploymentLambda.addToRolePolicy(
      new PolicyStatement({
        sid: 'cognitoUserPoolAccess',
        actions: [
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:CreateGroup',
          'cognito-idp:GetGroup',
        ],
        resources: [cognitoInfra.userPool.userPoolArn],
      }),
    );
  }
}
