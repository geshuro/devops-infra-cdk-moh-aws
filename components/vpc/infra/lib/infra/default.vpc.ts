import { Inject, Injectable } from '@nestjs/common';
import { Construct } from '@aws-cdk/core';
import { ConfigService } from '@nestjs/config';
import { CoreConfig, CoreStage, MainVpc, Stack } from '@aws-ee/core-infra';
import {
  IVpc,
  Vpc,
  InterfaceVpcEndpointAwsService,
  InterfaceVpcEndpoint,
  GatewayVpcEndpointAwsService,
  SubnetType,
  SecurityGroup,
  ISecurityGroup,
} from '@aws-cdk/aws-ec2';
import { VpcConfig } from '../config/vpc-config';
import { VpcMode } from '../config/vpc-stage-config';

@Injectable()
export class DefaultVpc extends Stack implements MainVpc {
  private config: VpcConfig;
  private createdVpc?: Vpc;
  private importedVpc?: IVpc;
  private vpcApiGatewayInterface?: InterfaceVpcEndpoint;

  public readonly defaultSecurityGroup: ISecurityGroup;

  constructor(@Inject(CoreStage) stage: Construct, configService: ConfigService) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    const config = configService.get<VpcConfig>(VpcConfig.KEY)!;

    super(stage, 'vpc', {
      description: 'Contains the main VPC along with related resources',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
      // If we need to lookup an existing VPC, we need to provide an env with aws account and region to the
      // stack constructor, "Vpc.fromLookup" does not work when env is not specified
      // see https://docs.aws.amazon.com/cdk/v2/guide/environments.html for details
      env:
        config.vpcMode === VpcMode.Create
          ? undefined
          : { account: coreConfig.awsAccountId, region: coreConfig.awsRegion },
    });
    this.config = config;

    if (this.config.vpcMode === VpcMode.Create) {
      this.createdVpc = new Vpc(this, 'main', this.config.vpcOptions);
      if (this.config.vpcHasApiGatewayInterface) {
        this.vpcApiGatewayInterface = this.createdVpc.addInterfaceEndpoint('ApiEndpoint', {
          service: InterfaceVpcEndpointAwsService.APIGATEWAY,
        });
      }

      this.defaultSecurityGroup = SecurityGroup.fromSecurityGroupId(
        this,
        'DefaultSecurityGroup',
        this.createdVpc.vpcDefaultSecurityGroup,
      );

      // Add a DynamoDB endpoint
      this.createdVpc.addGatewayEndpoint('DynamoDbEndpoint', {
        service: GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [{ subnetType: SubnetType.PRIVATE_WITH_NAT }],
      });

      // Add an S3 endpoint
      this.createdVpc.addGatewayEndpoint('S3Endpoint', {
        service: GatewayVpcEndpointAwsService.S3,
        subnets: [{ subnetType: SubnetType.PRIVATE_WITH_NAT }],
      });

      // The VPC needs an SSM interface endpoint to safely communicate with SSM
      this.createdVpc.addInterfaceEndpoint('SsmEndpoint', {
        service: InterfaceVpcEndpointAwsService.SSM,
      });
    } else {
      this.importedVpc = Vpc.fromLookup(this, 'main', {
        vpcId: this.config.vpcId,
      });

      this.defaultSecurityGroup = SecurityGroup.fromLookupById(
        this,
        'DefaultSecurityGroup',
        this.config.defaultSecurityGroupId!,
      );
    }
  }

  get vpc(): IVpc {
    return this.createdVpc || this.importedVpc!;
  }

  get vpcApiGatewayEndpoint(): string {
    if (!this.config.vpcHasApiGatewayInterface) {
      return '';
    }
    return this.isImportMode ? this.config.vpcApiGatewayEndpoint! : this.vpcApiGatewayInterface!.vpcEndpointId;
  }

  private get isImportMode() {
    return this.config.vpcMode === VpcMode.Import;
  }
}
