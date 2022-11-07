import { Construct } from '@aws-cdk/core';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreStage, CoreConfig, Stack, SSMParameterReader } from '@aws-ee/core-infra';
import { WebAcl, WebAclMode } from '@aws-ee/core-rest-api-infra';

@Injectable()
export class WafStack extends Stack {
  private readonly paramStoreRoot: string;

  constructor(configService: ConfigService, @Inject(CoreStage) stage: Construct) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'waf', {
      description: 'Contains the Web Application Firewall',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
      env: {
        region: 'us-east-1',
      },
    });
    this.paramStoreRoot = coreConfig.paramStoreRoot;

    new WebAcl(this, {
      mode: WebAclMode.Cloudfront,
      namespace: coreConfig.namespace,
      paramStoreRoot: coreConfig.paramStoreRoot,
    });
  }

  getWafArn(scope: Construct): string {
    Stack.of(scope).addDependency(this);
    const wafReader = new SSMParameterReader(scope, 'WafReader', {
      parameterName: `/${this.paramStoreRoot}/waf-acl-arn`,
      resourceId: 'wafaclarn',
      resources: [
        this.formatArn({
          service: 'ssm',
          region: 'us-east-1',
          resource: 'parameter',
          resourceName: `${this.paramStoreRoot}/waf-acl-arn`,
        }),
      ],
      region: 'us-east-1',
    });

    return wafReader.getParameterValue();
  }
}
