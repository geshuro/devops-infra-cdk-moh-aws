import { PolicyDocument, PolicyStatement } from '@aws-cdk/aws-iam';

/**
 * CloudFormation execution policy for pre-production accounts
 */
export const cloudFormationExecPolicyForPreProduction = new PolicyDocument({
  statements: [
    new PolicyStatement({
      sid: 'corePermissions',
      actions: [
        'apigateway:*',
        'cloudfront:*',
        'cognito-identity:*',
        'cognito-idp:*',
        'cognito-sync:*',
        'dynamodb:*',
        'iam:*',
        'kms:*',
        'lambda:*',
        'logs:*',
        's3:*',
        'ssm:*',
        'wafv2:*',
        'es:*',
        'states:*',
      ],
      resources: ['*'],
    }),
    new PolicyStatement({
      sid: 'openSearchAccess',
      actions: ['es:*'],
      resources: ['*'],
    }),
    new PolicyStatement({
      sid: 'vpcAccess',
      actions: ['ec2:*'],
      resources: ['*'],
    }),
  ],
});
