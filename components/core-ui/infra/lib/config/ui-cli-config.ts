import { IsString } from 'class-validator';

export class UiCliConfig {
  static readonly KEY = 'ui';

  @IsString()
  uiDir!: string;
}
