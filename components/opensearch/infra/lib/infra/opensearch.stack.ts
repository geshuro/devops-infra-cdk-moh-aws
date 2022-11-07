import { Inject, Injectable, Optional } from '@nestjs/common';
import { Construct, RemovalPolicy, Annotations } from '@aws-cdk/core';
import { ConfigService } from '@nestjs/config';
import { SubnetType } from '@aws-cdk/aws-ec2';
import { Key } from '@aws-cdk/aws-kms';
import { CoreConfig, CoreStage, MainVpc, Stack } from '@aws-ee/core-infra';
import { IDomain, Domain, DomainProps, EngineVersion } from '@aws-cdk/aws-opensearchservice';

import { OpenSearchApiConfig } from '../config/opensearch-api-config';
import { OpenSearchMode } from '../config/opensearch-api-stage-config';

@Injectable()
export class OpenSearchStack extends Stack {
  private config: OpenSearchApiConfig;

  readonly domain: IDomain;

  constructor(
    @Inject(CoreStage) stage: Construct,
    configService: ConfigService,
    @Optional() @Inject(MainVpc) mainVpc: MainVpc,
  ) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'opensearch', {
      description: 'Contains an OpenSearch domain',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });
    this.config = configService.get<OpenSearchApiConfig>(OpenSearchApiConfig.KEY)!;
    const removalPolicy = coreConfig.isDevelopmentEnv ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

    if (this.config.openSearchMode === OpenSearchMode.Create) {
      const key = new Key(this, 'OpenSearchEncryptionKey', {
        alias: `${coreConfig.namespace}-os-key`,
        enableKeyRotation: true,
        removalPolicy,
      });

      let domainProps: DomainProps = {
        domainName: this.config.openSearchDomainName || `${coreConfig.namespace}-os`,
        version: this.config.openSearchVersion!,
        capacity: {
          dataNodes: this.config.openSearchInstanceCount,
          dataNodeInstanceType: this.config.openSearchInstanceType,
        },
        ebs: {
          enabled: true,
          iops: 0,
          volumeSize: this.config.openSearchVolumeSizeGb,
          volumeType: this.config.openSearchVolumeType,
        },
        automatedSnapshotStartHour: 1,
        advancedOptions: {
          'rest.action.multi.allow_explicit_index': 'true',
        },
        removalPolicy,
        encryptionAtRest: { enabled: true, kmsKey: key },
        nodeToNodeEncryption: true,
      };

      if (mainVpc) {
        Annotations.of(this).addInfo('The OpenSearch domain uses a VPC endpoint.');
        domainProps = {
          ...domainProps,
          vpc: mainVpc.vpc,
          vpcSubnets: [{ subnetType: SubnetType.PRIVATE }],
          securityGroups: [mainVpc.defaultSecurityGroup],
          zoneAwareness: {
            enabled: false,
          },
        };
      } else {
        Annotations.of(this).addInfo('The OpenSearch domain uses an internet endpoint.');
      }
      this.domain = new Domain(this, 'OpenSearch', domainProps);
    } else {
      this.domain = Domain.fromDomainEndpoint(this, 'OpenSearch', this.config.openSearchEndpoint!);
    }
  }

  get openSearchVersion(): EngineVersion {
    return this.config.openSearchVersion!;
  }
}
