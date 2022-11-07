import { UserPool, UserPoolClient } from '@aws-cdk/aws-cognito';
import { ManagedPolicy } from '@aws-cdk/aws-iam';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct, Duration } from '@aws-cdk/core';

export interface AuthorizerLambdaProps {
  namespace: string;
  userPool: UserPool;
  cwlLambdaPolicy: ManagedPolicy;
}

export class AuthorizerLambda extends NodejsFunction {
  constructor(scope: Construct, props: AuthorizerLambdaProps) {
    super(scope, 'AuthorizerLambda', {
      entry: `${__dirname}/../lambda/authorizer.ts`,
      description: 'Authorizes requests against the API Gateway',
      functionName: `${props.namespace}-authorizer`,
      timeout: Duration.seconds(6),
      runtime: Runtime.NODEJS_14_X,
    });

    this.addEnvironment('APP_USER_POOL_ID', props.userPool.userPoolId);
    this.role!.addManagedPolicy(props.cwlLambdaPolicy);
  }

  /**
   * Make the authorizer ensure that all tokens come from a specific client
   */
  validateUserPoolClient(userPoolClient: UserPoolClient) {
    this.addEnvironment('APP_USER_POOL_CLIENT_ID', userPoolClient.userPoolClientId);
  }
}
