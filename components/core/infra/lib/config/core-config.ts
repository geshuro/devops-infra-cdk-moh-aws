import { IsString, IsEnum, Length, IsIn, IsNumberString, Matches, IsObject } from 'class-validator';
import { Region, Regions, RegionNames } from '@aws-ee/common';
import { PolicyDocument } from '@aws-cdk/aws-iam';

import { CoreStageConfig, EnvType } from './core-stage-config';

export class CoreConfig implements CoreStageConfig {
  static readonly KEY: string = 'core';

  @IsString()
  @Length(2, 10)
  @Matches(/^[a-z]*$/, {
    message: 'envName must contain only lowercase letters (a-z)',
  })
  envName!: string;

  @IsString()
  awsProfile!: string;

  @IsString()
  @IsIn(Regions)
  awsRegion!: Region;

  @Length(12, 12)
  @IsNumberString({ no_symbols: true })
  awsAccountId!: string;

  @IsString()
  @Length(2, 20)
  @Matches(/^[a-z]*$/, {
    message: 'solutionName must contain only lowercase letters (a-z)',
  })
  solutionName!: string;

  @IsEnum(EnvType)
  envType!: EnvType;

  @IsObject()
  cloudFormationExecPolicy!: PolicyDocument;

  get isDevelopmentEnv(): boolean {
    return this.envType === EnvType.Dev;
  }

  get awsRegionShortName(): string {
    return RegionNames[this.awsRegion!];
  }

  get namespace(): string {
    return `${this.envName}-${this.awsRegionShortName}-${this.solutionName}`;
  }

  get globalNamespace(): string {
    return `${this.awsAccountId}-${this.namespace}`;
  }

  get dbPrefix(): string {
    return this.namespace;
  }

  get paramStoreRoot(): string {
    return `${this.envName}/${this.solutionName}`;
  }

  get service(): string {
    return `${this.awsRegionShortName}-${this.solutionName}`;
  }
}
