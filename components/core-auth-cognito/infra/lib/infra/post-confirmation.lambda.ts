import { UserPool, UserPoolOperation } from '@aws-cdk/aws-cognito';
import { ManagedPolicy, PolicyStatement } from '@aws-cdk/aws-iam';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct, Duration } from '@aws-cdk/core';

export interface PostConfirmationLambdaProps {
  namespace: string;
  userPoolArn: string;
  userPool: UserPool;
  cwlLambdaPolicy: ManagedPolicy;
}

export class PostConfirmationLambda extends NodejsFunction {
  private idpRoleMapping: Record<string, string> = {};

  constructor(scope: Construct, props: PostConfirmationLambdaProps) {
    super(scope, 'CognitoPostConfirmationLambda', {
      entry: `${__dirname}/../lambda/post-confirmation.ts`,
      description: 'Runs after a new self sign up or federated user is confirmed with Cognito',
      functionName: `${props.namespace}-postConfirmation`,
      timeout: Duration.seconds(6),
      runtime: Runtime.NODEJS_14_X,
    });

    this.addToRolePolicy(
      new PolicyStatement({
        sid: 'userPoolAccess',
        actions: ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:GetGroup', 'cognito-idp:CreateGroup'],
        resources: [props.userPoolArn],
      }),
    );

    this.role!.addManagedPolicy(props.cwlLambdaPolicy);

    props.userPool.addTrigger(UserPoolOperation.POST_CONFIRMATION, this);
  }

  setUserRoleForSelfSignUp(userRole: string): void {
    this.addEnvironment('APP_SELF_SIGNUP_USER_ROLE', userRole);
  }

  setUserRoleForExternalIdentityProvider(identityProviderName: string, userRole: string): void {
    this.idpRoleMapping[identityProviderName] = userRole;
    this.addEnvironment('APP_EXTERNAL_IDP_USER_ROLES', JSON.stringify(this.idpRoleMapping));
  }
}
