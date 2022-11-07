import { Construct } from '@aws-cdk/core';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreStage, CoreConfig, MainVpc, Stack, CoreStack } from '@aws-ee/core-infra';

import { CoreRestApiAssets } from './core-rest-api-assets.provider';
import { RestApiGateWay } from './restapi.apigateway';
import { ApiHandlerLambda } from './api-handler.lambda';
import { RestApiConfig } from '../config/rest-api-config';
import { WebAcl, WebAclMode } from './web-acl.waf';

@Injectable()
export class ApiStack extends Stack {
  public readonly api: RestApiGateWay;
  public readonly apiHandler: ApiHandlerLambda;

  constructor(
    @Inject(CoreStage) stage: Construct,
    @Inject(CoreRestApiAssets) restAssets: CoreRestApiAssets,
    @Optional() @Inject(MainVpc) mainVpc: MainVpc,
    configService: ConfigService,
    coreStack: CoreStack,
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    const restApiConfig = configService.get<RestApiConfig>(RestApiConfig.KEY)!;
    super(stage, 'api', {
      description: 'Contains the API and core Dynamo DB tables',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });

    const settings = {
      dbPrefix: coreConfig.dbPrefix,
      stage: coreConfig.envName,
      isVerbose: 'false',
      namespace: coreConfig.namespace,
      paramStoreRoot: coreConfig.paramStoreRoot,
      paramStoreJwtSecret: restApiConfig.paramStoreJwtSecret,
      jwtOptions: restApiConfig.jwtOptions!,
      endpointType: restApiConfig.endpointType,
    };

    this.apiHandler = new ApiHandlerLambda(this, {
      apiHandler: restAssets.apiHandler,
      cwlLambdaPolicy: coreStack.cloudwatchLambdaPolicy,
      mainVpc,
      ...settings,
    });

    this.api = new RestApiGateWay(this, {
      apiHandlerLambda: this.apiHandler,
      mainVpc,
      ...settings,
    });

    new WebAcl(this, {
      mode: WebAclMode.Regional,
      namespace: coreConfig.namespace,
      apiGatewayArn: this.api.arn,
      mainVpc,
    });
  }
}
