import { IsString, IsBoolean, IsOptional, IsEnum, ValidateIf, IsObject } from 'class-validator';
import { VpcProps } from '@aws-cdk/aws-ec2';
import { VpcMode } from './vpc-stage-config';

export class VpcConfig {
  static readonly KEY: string = 'vpc';

  @IsEnum(VpcMode)
  vpcMode?: VpcMode = VpcMode.None;

  @IsString()
  @IsOptional()
  vpcId?: string;

  @IsString()
  @IsOptional()
  defaultSecurityGroupId?: string;

  @IsBoolean()
  @IsOptional()
  vpcHasApiGatewayInterface?: boolean = true;

  @IsString()
  @ValidateIf((c: VpcConfig) => c.vpcMode === VpcMode.Import && c.vpcHasApiGatewayInterface === true)
  vpcApiGatewayEndpoint?: string;

  @IsOptional()
  @IsObject()
  vpcOptions?: VpcProps = {};
}
