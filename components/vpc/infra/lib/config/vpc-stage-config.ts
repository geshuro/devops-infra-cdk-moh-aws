import { VpcProps } from '@aws-cdk/aws-ec2';

export enum VpcMode {
  /**
   * Import an existing VPC
   */
  Import,

  /**
   * Create a new VPC with default settings
   */
  Create,

  /**
   * No VPC is used
   */
  None,
}

export interface VpcImportStageConfig {
  /**
   * The mode of VPC creation.
   *
   * `VpcMode.Import` - use an existing VPC
   *
   * `VpcMode.Create` - create a new VPC
   *
   * NOTE: `Create` mode spins up a VPC with default
   * settings. We recommend to use this for development only.
   */
  vpcMode: VpcMode.Import;

  /**
   * ID of the existing VPC
   */
  vpcId: string;

  /**
   * ID of the default security group
   */
  defaultSecurityGroupId: string;

  /**
   * Does the existing VPC contain an endpoint for the
   * API gateway.
   *
   * @default true
   */
  vpcHasApiGatewayInterface?: boolean;

  /**
   * The ID of the existing API Gateway endpoint.
   * Must be set to a value if `vpcHasApiGatewayInterface` is `true`
   */
  vpcApiGatewayEndpoint?: string;
}

export interface VpcCreateStageConfig {
  vpcMode: VpcMode.Create;

  /**
   * Should a VPC endpoint be created for the API Gateway.
   *
   * @default true
   */
  vpcHasApiGatewayInterface?: boolean;

  vpcOptions?: VpcProps;
}

export interface VpcNoneStageConfig {
  vpcMode: VpcMode.None;
}

export type VpcStageConfig = VpcImportStageConfig | VpcCreateStageConfig | VpcNoneStageConfig;
