import type { IVpc, ISecurityGroup } from '@aws-cdk/aws-ec2';

export const MainVpc = Symbol('mainVpc');

export interface MainVpc {
  readonly vpc: IVpc;
  readonly defaultSecurityGroup: ISecurityGroup;
  readonly vpcApiGatewayEndpoint: string;
}
