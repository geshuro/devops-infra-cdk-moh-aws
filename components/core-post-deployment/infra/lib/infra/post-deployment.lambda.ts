import { Runtime, Function as LambdaFunction, Code, FunctionProps } from '@aws-cdk/aws-lambda';
import { Construct, Duration } from '@aws-cdk/core';
import { SubnetType } from '@aws-cdk/aws-ec2';
import { MainVpc, setLogicalId } from '@aws-ee/core-infra';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

export class PostDeploymentLambda extends LambdaFunction {
  constructor(
    scope: Construct,
    props: {
      postDeploymentHandler: Code;
      cwlLambdaPolicy: ManagedPolicy;
      namespace: string;
      dbPrefix: string;
      loggingBucketName: string;
      mainVpc?: MainVpc;
    },
  ) {
    let vpcOptions: Partial<FunctionProps> = {};
    if (props.mainVpc) {
      vpcOptions = {
        vpc: props.mainVpc.vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE },
        securityGroups: [props.mainVpc.defaultSecurityGroup],
      };
    }
    super(scope, 'postDeployment', {
      runtime: Runtime.NODEJS_14_X,
      description: 'Performs post deployment init and update tasks',
      code: props.postDeploymentHandler,
      handler: 'index.handler',
      memorySize: 1024,
      timeout: Duration.minutes(15),
      functionName: `${props.namespace}-postDeployment`,
      environment: {
        APP_DB_PREFIX: props.dbPrefix,
        APP_LOGGING_BUCKET_NAME: props.loggingBucketName,
      },
      ...vpcOptions,
    });

    setLogicalId(this, 'postDeploymentHandler');

    this.role!.addManagedPolicy(props.cwlLambdaPolicy);
  }
}
