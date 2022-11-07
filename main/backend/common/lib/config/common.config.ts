import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class CommonConfig {
  static KEY = 'common';

  @IsString()
  @Expose({ name: 'APP_DB_PREFIX' })
  dbPrefix!: string;
}
