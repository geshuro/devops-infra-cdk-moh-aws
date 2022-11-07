import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class ScreeningInputConfig {
  static KEY = 'screeningInputConfig';

  @IsOptional()
  @Expose({ name: 'RAW_METADATA_BUCKET' })
  rawMetadataBucket?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'PROCESSED_METADATA_BUCKET' })
  processedMetadataBucket?: string;

  @IsOptional()
  @Expose({ name: 'RAW_PDF_BUCKET' })
  rawPdfBucket?: string;

  @IsOptional()
  @Expose({ name: 'PROCESSED_PDF_BUCKET' })
  processedPdfBucket?: string;
}
