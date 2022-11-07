import {
  AwsIntegration,
  CfnRestApi,
  ContentHandling,
  IntegrationResponse,
  MethodResponse,
  Model,
  PassthroughBehavior,
  RestApi,
} from '@aws-cdk/aws-apigateway';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import { Construct, Stack } from '@aws-cdk/core';

export interface PrivateHostingApiGatewayUpdatesProps {
  api: RestApi;
  websiteBucketName: string;
  websiteBucket: IBucket;
}

export class PrivateHostingApiGatewayUpdates {
  constructor(scope: Construct, props: PrivateHostingApiGatewayUpdatesProps) {
    const websiteBucketArnForObjects = Stack.of(scope).formatArn({
      service: 's3',
      account: '',
      region: '',
      resource: props.websiteBucketName,
      resourceName: '*',
    });

    const integrationRole = new Role(scope, 'RoleWebsiteApiGatewayS3Integration', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        s3Access: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:GetObject'],
              resources: [websiteBucketArnForObjects],
            }),
          ],
        }),
      },
    });

    props.websiteBucket.addToResourcePolicy(
      new PolicyStatement({
        principals: [new ServicePrincipal('apigateway.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [websiteBucketArnForObjects],
      }),
    );

    const integrationResponses: IntegrationResponse[] = [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': 'integration.response.header.Content-Type',
          'method.response.header.Content-Length': 'integration.response.header.Content-Length',
          'method.response.header.Date': 'integration.response.header.Date',
        },
      },
      {
        statusCode: '403',
        responseTemplates: {
          'application/json': JSON.stringify({
            message: 'Page not found',
          }),
        },
      },
      {
        statusCode: '404',
        responseTemplates: {
          'application/json': JSON.stringify({
            message: 'Page not found',
          }),
        },
      },
    ];

    const webRootIntegration = new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${props.websiteBucketName}/index.html`,
      options: {
        credentialsRole: integrationRole,
        requestParameters: {
          'integration.request.header.Accept': 'method.request.header.Accept',
          'integration.request.header.Content-Type': 'method.request.header.Content-Type',
        },
        contentHandling: ContentHandling.CONVERT_TO_TEXT,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        integrationResponses,
      },
    });

    const methodResponses: MethodResponse[] = [
      {
        statusCode: '200',
        responseModels: { 'application/json': Model.EMPTY_MODEL },
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Content-Length': true,
          'method.response.header.Date': true,
        },
      },
    ];

    props.api.root.addMethod('GET', webRootIntegration, {
      requestParameters: {
        'method.request.header.Accept': true,
        'method.request.header.Content-Type': true,
      },
      methodResponses,
    });

    const websiteApiResource = props.api.root.addProxy();

    const webIntegration = new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${props.websiteBucketName}/{proxy}`,
      options: {
        credentialsRole: integrationRole,
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
          'integration.request.header.Accept': 'method.request.header.Accept',
          'integration.request.header.Content-Type': 'method.request.header.Content-Type',
        },
        contentHandling: ContentHandling.CONVERT_TO_TEXT,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          // If the requested path doesn't contain a period (i.e., it does not have an
          // extension), assume routing is handled by the React app and return index.html.
          'application/json': `
            #if(!$input.params('proxy').contains('.'))
              #set($context.requestOverride.path.proxy = 'index.html')
            #end
          `,
        },
        integrationResponses,
      },
    });

    websiteApiResource.addMethod('GET', webIntegration, {
      requestParameters: {
        'method.request.path.proxy': true,
        'method.request.header.Accept': true,
        'method.request.header.Content-Type': true,
      },
      methodResponses,
    });

    // The L2 construct does not allow to amend the Binary Media types
    // Need to use the L1 escape hatch
    const cfnApi = props.api.node.defaultChild as CfnRestApi;
    cfnApi.binaryMediaTypes = ['image/png', 'image/gif', 'image/x-icon', 'image/webp', '*/*'];
  }
}
