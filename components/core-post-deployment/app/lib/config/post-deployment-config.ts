import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class CorePostDeploymentConfig {
  static KEY = 'corePostDeploymentConfig';

  @IsString()
  @Expose({ name: 'APP_DB_PREFIX' })
  dbPrefix!: string;

  @IsString()
  @Expose({ name: 'APP_LOGGING_BUCKET_NAME' })
  loggingBucketName!: string;
}
