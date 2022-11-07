import { ManagedPolicy, PolicyStatement } from '@aws-cdk/aws-iam';
import { setLogicalId, MainVpc } from '@aws-ee/core-infra';
import { Runtime, Function as LambdaFunction, Code, FunctionProps } from '@aws-cdk/aws-lambda';
import { Construct, Duration, Stack } from '@aws-cdk/core';
import { SubnetType } from '@aws-cdk/aws-ec2';

export class ApiHandlerLambda extends LambdaFunction {
  private corsAllowList: string[];

  constructor(
    scope: Construct,
    props: {
      apiHandler: Code;
      cwlLambdaPolicy: ManagedPolicy;
      namespace: string;
      dbPrefix: string;
      isVerbose: string;
      paramStoreRoot: string;
      paramStoreJwtSecret: string;
      jwtOptions: string;
      stage: string;
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
    super(scope, 'apiHandler', {
      runtime: Runtime.NODEJS_14_X,
      description: 'Handles all API requests',
      code: props.apiHandler,
      handler: 'index.handler',
      memorySize: 1024,
      timeout: Duration.seconds(6),
      functionName: `${props.namespace}-apiHandler`,
      environment: {
        APP_PARAM_STORE_JWT_SECRET: props.paramStoreJwtSecret,
        APP_JWT_OPTIONS: props.jwtOptions,
        APP_PARAM_STORE_ROOT: props.paramStoreRoot,
        APP_DB_PREFIX: props.dbPrefix,
        APP_SUPPORTED_LANGUAGES: '{"en":"en"}',
        APP_DEFAULT_LANGUAGE: 'en',
        APP_STAGE: props.stage,
      },
      ...vpcOptions,
    });

    this.corsAllowList = [];

    this.setCorsAllowList();

    setLogicalId(this, 'apiHandler');

    this.addEnvironment('APP_API_HANDLER_ARN', this.role!.roleArn);

    this.addToRolePolicy(
      new PolicyStatement({
        sid: 'paramStoreAccess',
        actions: ['ssm:GetParameter'],
        resources: [
          Stack.of(this).formatArn({
            service: 'ssm',
            resource: 'parameter',
            resourceName: `${props.paramStoreRoot}/*`,
          }),
        ],
      }),
    );

    this.role!.addManagedPolicy(props.cwlLambdaPolicy);
  }

  /**
   * Set the allowed referrers for CORS purposes.
   *
   * @param allowedCorsDomain The list of allowed clients for the API
   */
  addAllowedCorsDomain(allowedCorsDomain: string) {
    this.corsAllowList.push(allowedCorsDomain);
    this.setCorsAllowList();
  }

  private setCorsAllowList() {
    this.addEnvironment('APP_CORS_ALLOW_LIST', JSON.stringify(this.corsAllowList));
  }
}
