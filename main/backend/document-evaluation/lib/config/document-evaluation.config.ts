import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class DocumentEvaluationConfig {
  static KEY = 'screening';

  @IsString()
  @Expose({ name: 'COMPREHEND_BUCKET' })
  comprehendBucketName!: string;

  @IsOptional()
  @Expose({ name: 'COMPREHEND_ROLE' })
  comprehendRole?: string;

  @IsOptional()
  @Expose({ name: 'ACCOUNT_ID' })
  accountId?: string;
}
