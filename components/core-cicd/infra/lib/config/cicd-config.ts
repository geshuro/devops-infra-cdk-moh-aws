import { IsString, IsIn } from 'class-validator';
import { Region, Regions } from '@aws-ee/common';
import { CoreConfig } from '@aws-ee/core-infra';

export class CoreCicdConfig extends CoreConfig {
  static readonly KEY: string = 'cicd';

  @IsString()
  @IsIn(Regions)
  cicdAwsRegion!: Region;

  @IsString()
  cicdAwsProfile!: string;

  @IsString()
  repositoryName!: string;

  @IsString()
  branch!: string;
}
