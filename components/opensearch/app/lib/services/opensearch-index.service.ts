import { Injectable } from '@nestjs/common';
import type { estypes } from '@elastic/elasticsearch';
import { LoggerService } from '@aws-ee/core';
import { OpenSearchClientService } from './opensearch-client.service';

@Injectable()
export class OpenSearchIndexService {
  constructor(private readonly clientService: OpenSearchClientService, private readonly log: LoggerService) {}

  async deleteIndex(index: string) {
    // can't check if the index exists, as this will lead to a potential concurrency bug, which prevents an index from being deleted.
    // seems like OpenSearch expects some delay between requests to an index.
    this.log.info(`Deleting index [${index}]`);
    const client = await this.clientService.client();
    return client.indices.delete({ index });
  }

  async createSearchIndexIfAbsent(
    index: string,
    mappings: Record<string, estypes.TypeMapping> | estypes.TypeMapping,
    settings?: Record<string, any>,
  ): Promise<void> {
    const exists = await this.existsSearchIndex(index);
    if (!exists) {
      this.log.info(`Creating index [${index}]`);
      const apiResult = await this.createSearchIndex(index, mappings, settings);
      this.log.info(`Index [${index}] created successfully.`, apiResult);
    } else {
      this.log.info(`Index [${index}] exists. Skipping.`);
    }
  }

  private async existsSearchIndex(index: string): Promise<boolean> {
    const client = await this.clientService.client();
    const response = await client.indices.exists({ index });
    return response.body;
  }

  private async createSearchIndex(
    index: string,
    mappings: Record<string, estypes.TypeMapping> | estypes.TypeMapping,
    settings?: Record<string, any>,
  ) {
    this.log.debug(`Create opensearch index: ${index}`);
    const client = await this.clientService.client();
    return client.indices.create({ index, body: { mappings, settings } });
  }
}
