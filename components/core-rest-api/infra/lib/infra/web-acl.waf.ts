import { CfnWebACL, CfnIPSet, CfnWebACLAssociation } from '@aws-cdk/aws-wafv2';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { Construct } from '@aws-cdk/core';
import { MainVpc } from '@aws-ee/core-infra';

const catImg =
  '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' +
  'iv8BhyObDB3R5x0AAAAASUVORK5CYII=';

const blockedPage = `<h1 style="text-align: center;"><strong><span style="color: #ff0000;">403</span></strong></h1>
<p style="text-align: center;"><strong><img src="data:image/png;base64,${catImg}" alt="" /></strong></p>
<p style="text-align: center;">Access from your IP is blocked. Please refer to the documentation.</p>`;

export const enum WebAclMode {
  Cloudfront,
  Regional,
}

interface WebAclPropsCloudfront {
  mode: WebAclMode.Cloudfront;
  namespace: string;
  paramStoreRoot: string;
}

interface WebAclPropsRegional {
  mode: WebAclMode.Regional;
  namespace: string;
  apiGatewayArn: string;
  mainVpc?: MainVpc;
}

export type WebAclProps = WebAclPropsCloudfront | WebAclPropsRegional;

export class WebAcl {
  private websiteWebAcl: CfnWebACL;

  constructor(scope: Construct, props: WebAclProps) {
    const wafScope = props.mode === WebAclMode.Cloudfront ? 'CLOUDFRONT' : 'REGIONAL';

    const allowIpsList = ['127.0.0.1/32'];
    if (props.mode === WebAclMode.Regional && props.mainVpc) {
      // if WAF is being attached to an API GW in VPC them make sure the WAF allows calls from the VPC's
      // private IP range
      allowIpsList.push(props.mainVpc.vpc.vpcCidrBlock);
    }

    const websiteIPAllowList = new CfnIPSet(scope, 'WebsiteIPAllowList', {
      name: `IPSet-${props.namespace}`,
      scope: wafScope,
      description: `This is the WAF v2 IPSet for ${props.namespace}`,
      ipAddressVersion: 'IPV4',
      addresses: allowIpsList,
    });

    this.websiteWebAcl = new CfnWebACL(scope, 'WebsiteWebAcl', {
      name: `ACL-${props.namespace}`,
      scope: wafScope,
      description: `This is the WAF v2 ACL for ${props.namespace}`,
      defaultAction: {
        block: {
          customResponse: {
            responseCode: 403,
            customResponseBodyKey: 'blocked',
          },
        },
      },
      rules: [
        {
          action: { allow: {} },
          name: `IPSetRule-${props.namespace}`,
          priority: 1,
          statement: {
            ipSetReferenceStatement: {
              arn: websiteIPAllowList.attrArn,
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${props.namespace}-ipset`,
            sampledRequestsEnabled: true,
          },
        },
      ],
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${props.namespace}-waf`,
        sampledRequestsEnabled: true,
      },
      customResponseBodies: {
        blocked: {
          contentType: 'TEXT_HTML',
          content: blockedPage,
        },
      },
    });

    this.websiteWebAcl.addDependsOn(websiteIPAllowList);

    if (props.mode === WebAclMode.Cloudfront) {
      new StringParameter(scope, 'WAFAclArn', {
        parameterName: `/${props.paramStoreRoot}/waf-acl-arn`,
        description: 'ARN of WAFv2 Web ACL',
        stringValue: this.websiteWebAcl.attrArn,
      });
    } else {
      new CfnWebACLAssociation(scope, 'WAFAPIGatewayAssociation', {
        webAclArn: this.websiteWebAcl.attrArn,
        resourceArn: props.apiGatewayArn,
      });
    }
  }
}
