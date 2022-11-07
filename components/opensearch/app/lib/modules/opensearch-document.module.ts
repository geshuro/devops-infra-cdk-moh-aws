import { Global, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configEnvLoader } from '@aws-ee/common';
import { OpenSearchConfig } from '../config/opensearch-config';
import { OpenSearchClientService } from '../services/opensearch-client.service';
import { OpenSearchDocumentService } from '../services/opensearch-document.service';
import { OpenSearchIndexService } from '../services/opensearch-index.service';

const providers: Provider[] = [OpenSearchClientService, OpenSearchDocumentService, OpenSearchIndexService];

/**
 * This module provides the service for CRUDing data to OpenSearch.
 *
 * For example, use this module in a Lambda that streams from DynamoDB or Kinesis.
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ cache: true, isGlobal: true, load: [configEnvLoader(OpenSearchConfig)] })],
  providers,
  exports: providers,
})
export class OpenSearchDocumentModule {}
