import * as path from 'path';
import { IBucket } from '@aws-cdk/aws-s3';
import { Construct } from '@aws-cdk/core';
import {
  OriginAccessIdentity,
  CloudFrontWebDistribution,
  PriceClass,
  ViewerProtocolPolicy,
  CloudFrontAllowedMethods,
  FunctionEventType,
  Function as CloudFrontFunction,
} from '@aws-cdk/aws-cloudfront';
import { cloudFrontFunctionCodeFromFile } from '@aws-ee/core-infra';

export interface WebDistributionProps {
  backendUrl: string;
  namespace: string;
  websiteBucket: IBucket;
  loggingBucket: IBucket;
  wafArn: string;
}

export class WebDistribution extends CloudFrontWebDistribution {
  constructor(scope: Construct, props: WebDistributionProps) {
    const cloudFrontOAI = new OriginAccessIdentity(scope, 'CloudFrontOAI', {
      comment: `OAI for ${props.websiteBucket.bucketName}`,
    });

    const webSecurityHandler = new CloudFrontFunction(scope, 'webSecurityHandler', {
      functionName: `${props.namespace}-webSecurityHandler`,
      code: cloudFrontFunctionCodeFromFile({
        fileName: path.join(__dirname, 'handlers/web-security.handler.ts'),
        replacements: {
          API_BASE_URL: props.backendUrl,
          OTHER_CONNECT_SRC: '', // TODO: Extend this from configs
          OTHER_IMG_SRC: '',
          OTHER_FRAME_SRC: '',
        },
      }),
    });

    super(scope, 'WebsiteCloudFrontWeb', {
      comment: `Web Distribution for ${props.namespace}`,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: PriceClass.PRICE_CLASS_100,
      webACLId: props.wafArn,
      originConfigs: [
        {
          behaviors: [
            {
              allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              isDefaultBehavior: true,
              compress: true,
              functionAssociations: [
                {
                  eventType: FunctionEventType.VIEWER_RESPONSE,
                  function: webSecurityHandler,
                },
              ],
            },
          ],
          s3OriginSource: {
            s3BucketSource: props.websiteBucket,
            originAccessIdentity: cloudFrontOAI,
          },
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 300,
        },
      ],
      loggingConfig: {
        bucket: props.loggingBucket,
        prefix: 'cf-ui/',
      },
    });
  }
}
