import {
  LambdaRestApi,
  LambdaRestApiProps,
  LogGroupLogDestination,
  EndpointType,
  IAuthorizer,
  AuthorizationType,
  ResponseType,
  Method,
  CfnMethod,
} from '@aws-cdk/aws-apigateway';
import { InterfaceVpcEndpoint } from '@aws-cdk/aws-ec2';
import { AnyPrincipal, Effect, PolicyDocument, PolicyStatement } from '@aws-cdk/aws-iam';
import { Function as LambdaFunction } from '@aws-cdk/aws-lambda';
import { CfnOutput, Construct, Stack } from '@aws-cdk/core';
import { LogGroup } from '@aws-cdk/aws-logs';
import { MainVpc } from '@aws-ee/core-infra';

type WritableLambdaRestApiProps = { -readonly [P in keyof LambdaRestApiProps]: LambdaRestApiProps[P] };

export class RestApiGateWay extends Construct {
  public readonly api: LambdaRestApi;
  private readonly privateMethods: Method[] = [];

  public get url(): string {
    return this.api.url;
  }

  public get arn(): string {
    return Stack.of(this).formatArn({
      service: 'apigateway',
      resource: `/restapis/${this.api.restApiId}/stages/${this.api.deploymentStage.stageName}`,
    });
  }

  constructor(
    scope: Construct,
    props: {
      apiHandlerLambda: LambdaFunction;
      stage: string;
      namespace: string;
      endpointType?: EndpointType;
      mainVpc?: MainVpc;
    },
  ) {
    super(scope, 'RestApi');
    const logGroup = new LogGroup(scope, 'ApiLogGroup');
    const restApiProps: WritableLambdaRestApiProps = {
      restApiName: `${props.namespace}-api`,
      handler: props.apiHandlerLambda,
      proxy: false,
      deployOptions: {
        stageName: props.stage,
        accessLogDestination: new LogGroupLogDestination(logGroup),
      },
    };

    if (props.endpointType === EndpointType.PRIVATE) {
      // The API GW need to be deployed with private VPC endpoint
      // Make sure VPC is specified
      const mainVpc = props.mainVpc;
      if (!mainVpc?.vpc || !mainVpc?.vpcApiGatewayEndpoint) {
        throw new Error(
          `Missing VPC configuration. When deploying private API Gateway (when endpointType = 'PRIVATE') "vpcId" and "vpcApiGatewayEndpoint" must be specified.`,
        );
      }

      // Look up the vpc endpoint
      const apiGwVpcEndpoint = InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(scope, 'ApiGwVpcEndpoint', {
        port: 443,
        vpcEndpointId: mainVpc.vpcApiGatewayEndpoint,
      });

      // Attach the VPC Endpoint to the API
      // Specify endpointConfiguration when the endpointType is PRIVATE or REGIONAL
      // No need to specify endpointConfiguration when endpointType is EDGE since that's the default
      restApiProps.endpointConfiguration = {
        types: [EndpointType.PRIVATE],
        vpcEndpoints: [apiGwVpcEndpoint],
      };

      // Only allow calls to the API via the VPC Endpoint
      restApiProps.policy = new PolicyDocument({
        statements: [
          new PolicyStatement({
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
            effect: Effect.DENY,
            conditions: {
              StringNotEquals: {
                'aws:SourceVpce': apiGwVpcEndpoint.vpcEndpointId,
              },
            },
          }),
          new PolicyStatement({
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
            effect: Effect.ALLOW,
          }),
        ],
      });
    }

    // Specify endpointConfiguration when the endpointType is PRIVATE or REGIONAL
    // No need to specify endpointConfiguration when endpointType is EDGE since that's the default
    if (props.endpointType === EndpointType.REGIONAL) {
      restApiProps.endpointConfiguration = {
        types: [EndpointType.REGIONAL],
      };
    }

    this.api = new LambdaRestApi(scope, `Api`, restApiProps);

    this.buildApi();

    new CfnOutput(scope, `ApiUrl`, {
      value: this.api.url,
    });
  }

  /**
   * Apply an authorizer to all API methods that are considered private.
   *
   * The only non-private methods are the ones used to initiate a login and to perform
   * an OAUTH2 Auth Code flow token exchange.
   */
  applyAuthToPrivateMethods(auth: { authorizer: IAuthorizer; authorizationType: AuthorizationType }): void {
    for (const method of this.privateMethods) {
      const cfnMethod = method.node.defaultChild as CfnMethod;
      cfnMethod.authorizationType = auth.authorizationType;
      cfnMethod.authorizerId = auth.authorizer.authorizerId;
    }
  }

  private buildApi(): void {
    // api
    const apiRes = this.api.root.addResource('api');

    // api/{proxy+}
    const apiProxy = apiRes.addProxy({
      anyMethod: false,
    });
    this.privateMethods.push(
      apiProxy.addMethod('GET'),
      apiProxy.addMethod('POST'),
      apiProxy.addMethod('PUT'),
      apiProxy.addMethod('DELETE'),
    );

    // This method enables CORS for all endpoints.
    // The actual CORS response is compiled in the API By NestJS
    apiProxy.addMethod('OPTIONS');

    // api/oauth2
    const oauth2 = apiRes.addResource('oauth2');

    // api/oauth2/authorize
    const authorize = oauth2.addResource('authorize');
    authorize.addMethod('POST'); // public endpoint

    // api/oauth2/token
    const token = oauth2.addResource('token');
    token.addMethod('POST'); // public endpoint

    // api/oauth2/refresh
    const refresh = oauth2.addResource('refresh');
    refresh.addMethod('POST'); // public endpoint

    // api/oauth2/logout
    const logout = oauth2.addResource('logout');
    logout.addMethod('POST'); // public endpoint

    /* 
       This sets the correct response headers when the Authorizer Lambda rejects the call.
       If this is not configured, a cross origin consumer would be blocked
       from receiving the 401 response.
     */
    this.api.addGatewayResponse('UnauthorizedResponse', {
      type: ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'Access-Control-Allow-Origin': 'method.request.header.Origin',
        'Access-Control-Allow-Credentials': "'true'",
      },
    });
  }
}
