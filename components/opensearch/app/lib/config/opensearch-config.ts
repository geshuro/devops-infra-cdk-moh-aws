import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class OpenSearchConfig {
  static KEY = 'opensearch';

  // TODO: Remove this hack to keep OpenSearch quiet; needs refactor
  @IsOptional()
  @Expose({ name: 'APP_OPENSEARCH_ENDPOINT' })
  openSearchEndpoint?: string;

  @IsOptional()
  @Expose({ name: 'APP_OPENSEARCH_VERSION' })
  openSearchVersion?: string;
}
