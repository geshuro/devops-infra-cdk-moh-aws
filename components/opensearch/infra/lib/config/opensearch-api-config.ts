import { IsString, IsEnum, ValidateIf, IsInt, IsObject } from 'class-validator';
import { EngineVersion } from '@aws-cdk/aws-opensearchservice';
import { EbsDeviceVolumeType } from '@aws-cdk/aws-ec2';
import { OpenSearchMode } from './opensearch-api-stage-config';

const isImportMode = (o: OpenSearchApiConfig) => o.openSearchMode === OpenSearchMode.Import;

export class OpenSearchApiConfig {
  static readonly KEY: string = 'open-search';

  @IsEnum(OpenSearchMode)
  openSearchMode!: OpenSearchMode;

  @IsString()
  @ValidateIf(isImportMode)
  openSearchEndpoint?: string;

  @IsString()
  @ValidateIf(isImportMode)
  openSearchDomainName?: string; // defaults to ${namespace}-os

  @IsObject()
  @ValidateIf(isImportMode)
  openSearchVersion?: EngineVersion = EngineVersion.ELASTICSEARCH_7_10;

  @IsInt()
  openSearchInstanceCount?: number = 1;

  @IsString()
  openSearchInstanceType?: string = 'r6g.large.search';

  @IsInt()
  openSearchVolumeSizeGb?: number = 50;

  @IsString()
  openSearchVolumeType?: EbsDeviceVolumeType = EbsDeviceVolumeType.GP2;
}
