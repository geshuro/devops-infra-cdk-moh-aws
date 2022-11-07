import { ManagedPolicy, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct, Stack, ArnFormat } from '@aws-cdk/core';

// IAM Policy for AWS CloudWatch Log access by the Lambda functions
export class CloudwatchLambdaPolicy extends ManagedPolicy {
  constructor(
    scope: Construct,
    props: {
      service: string;
      envName: string;
    },
  ) {
    super(scope, 'CwlLambdaPolicy');

    this.addStatements(
      new PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          Stack.of(this).formatArn({
            service: 'logs',
            resource: 'log-group',
            resourceName: `/aws/lambda/${props.service}-${props.envName}-*`,
            arnFormat: ArnFormat.COLON_RESOURCE_NAME,
          }),
          Stack.of(this).formatArn({
            service: 'logs',
            resource: 'log-group',
            resourceName: `/aws/lambda/${props.service}-${props.envName}-*:log-stream:*`,
            arnFormat: ArnFormat.COLON_RESOURCE_NAME,
          }),
        ],
      }),
    );
  }
}
