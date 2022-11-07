import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class ApiHandlerExtendedConfig {
  static KEY = 'apiHandlerExtendedConfig';

  @IsString()
  @Expose({ name: 'RAW_METADATA_BUCKET' })
  rawMetadataBucket!: string;

  @Expose({ name: 'RAW_PDF_BUCKET' })
  rawPdfBucket!: string;

  @IsString()
  @Expose({ name: 'APP_OPENSEARCH_REPLICAS_SCREENING_INDEX' })
  openSearchReplicasScreeningIndex!: string;
}
