import { Construct, Annotations, CfnOutput } from '@aws-cdk/core';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { CoreStage, CoreConfig, Stack, CoreStack, StackOutputService } from '@aws-ee/core-infra';
import type { IDistribution } from '@aws-cdk/aws-cloudfront';
import { ConfigService } from '@nestjs/config';
import { Bucket } from '@aws-cdk/aws-s3';
import { ApiStack } from '@aws-ee/core-rest-api-infra';

import { WebsiteDeployment } from './website.deployment';
import { CoreUiAssets } from './core-ui-assets.provider';
import { UiConfig } from '../config/ui-config';
import { WebsiteBucket } from './website.bucket';
import { HostingType } from '../config/ui-stage-config';
import { WebDistribution } from './web-distribution.cloudfront';
import { WafStack } from './waf.stack';
import { PrivateHostingApiGatewayUpdates } from './private-hosting-api-gateway.updates';

@Injectable()
export class UiStack extends Stack {
  public readonly websiteBucket: Bucket;
  public readonly websiteUrl: string;

  private distribution?: IDistribution;

  constructor(
    @Inject(CoreStage) stage: Construct,
    @Inject(CoreUiAssets) assets: CoreUiAssets,
    coreStack: CoreStack,
    stackOutputService: StackOutputService,
    configService: ConfigService,
    apiStack: ApiStack,
    @Optional() wafStack?: WafStack,
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    const uiConfig = configService.get<UiConfig>(UiConfig.KEY)!;
    super(stage, 'ui', {
      description: 'Contains the web UI',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });

    const websiteBucketName = `${coreConfig.globalNamespace}-website`;

    this.websiteBucket = new WebsiteBucket(this, {
      name: websiteBucketName,
      loggingBucket: coreStack.loggingBucket,
      enableS3Hosting: uiConfig.uiHostingType === HostingType.CloudFront,
    });

    if (uiConfig.uiHostingType === HostingType.CloudFront) {
      /**
       * Public hosting
       */
      if (!wafStack) {
        throw new Error('The WAF stack is required for public hosting!');
      }
      const wafArn = wafStack.getWafArn(this);
      const backendUrl = stackOutputService.get({ stack: apiStack, outputName: 'ApiUrl', defaultValue: '' });
      let apiBaseUrl = '';
      try {
        const parsedApiUrl = new URL(backendUrl);
        apiBaseUrl = `${parsedApiUrl.protocol}//${parsedApiUrl.host}`;
      } catch {
        Annotations.of(this).addWarning(
          'Unable to parse the backend URL. This may happen on the first deployment or after a failed deployment.',
        );
      }

      this.distribution = new WebDistribution(this, {
        backendUrl: apiBaseUrl,
        namespace: coreConfig.namespace,
        websiteBucket: this.websiteBucket,
        loggingBucket: coreStack.loggingBucket,
        wafArn,
      });

      apiStack.apiHandler.addAllowedCorsDomain(`https://${this.distribution.distributionDomainName}`);

      if (coreConfig.isDevelopmentEnv) {
        apiStack.apiHandler.addAllowedCorsDomain('http://localhost:3000');
      }

      this.websiteUrl = `https://${this.distribution.distributionDomainName}/`;

      new CfnOutput(apiStack, 'WebsiteUrl', {
        value: this.websiteUrl,
      });

      new CfnOutput(apiStack, 'WebsiteRootPath', {
        value: '',
      });
    } else {
      /**
       * Private hosting
       */
      new PrivateHostingApiGatewayUpdates(apiStack, {
        api: apiStack.api.api,
        websiteBucket: this.websiteBucket,
        websiteBucketName,
      });

      if (coreConfig.isDevelopmentEnv) {
        apiStack.apiHandler.addAllowedCorsDomain('http://localhost:3000');
      }

      this.websiteUrl = apiStack.api.url;

      new CfnOutput(apiStack, 'WebsiteUrl', {
        value: this.websiteUrl,
      });

      new CfnOutput(apiStack, 'WebsiteRootPath', {
        value: `/${coreConfig.envName}`,
      });
    }

    new WebsiteDeployment(this, {
      websiteBucket: this.websiteBucket,
      sources: assets.web,
      distribution: this.distribution,
    });
  }
}
