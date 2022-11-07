import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class ScreeningConfig {
  static KEY = 'screening';

  @IsOptional()
  @Expose({ name: 'STATE_MACHINE_ARN' })
  stateMachineArn?: string;
}
