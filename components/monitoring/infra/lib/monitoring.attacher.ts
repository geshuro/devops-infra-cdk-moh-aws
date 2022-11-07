import { Watchful } from 'cdk-watchful';
import { RestApi } from '@aws-cdk/aws-apigateway';
import { Node } from 'constructs';
import { IConstruct } from '@aws-cdk/core';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CoreStage } from '@aws-ee/core-infra';

@Injectable()
export class MonitoringAttacher implements OnModuleInit {
  constructor(@Inject(CoreStage) private readonly stage: IConstruct) {}

  onModuleInit() {
    // Attach a dashboard for every API Gateway
    Node.of(this.stage)
      .findAll()
      .filter((node) => node instanceof RestApi)
      .forEach((node) => {
        const api = node as RestApi;
        const watchful = new Watchful(api, api.restApiName);
        watchful.watchApiGateway(api.restApiName, api);
      });
  }
}
