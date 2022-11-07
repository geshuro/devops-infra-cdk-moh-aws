// eslint-disable-next-line max-classes-per-file
import { IsString, IsOptional, IsNotEmpty, ValidateNested, IsEnum } from 'class-validator';
import { HostingType, UiStageConfig, VersionDisclaimerInterface } from './ui-stage-config';

class VersionDisclaimer implements VersionDisclaimerInterface {
  @IsString()
  @IsNotEmpty()
  header!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UiConfig implements UiStageConfig {
  static readonly KEY = 'ui';

  @IsString()
  solutionFullName!: string;

  @IsOptional()
  @ValidateNested()
  versionDisclaimer?: VersionDisclaimer;

  @IsEnum(HostingType)
  uiHostingType: HostingType = HostingType.ApiGateway;
}
