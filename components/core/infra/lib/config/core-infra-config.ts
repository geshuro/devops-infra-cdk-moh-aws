import { IsString } from 'class-validator';

export class CoreInfraConfig {
  static readonly KEY: string = 'core-infra';

  @IsString()
  infraDir!: string;
}
