import { Injectable, Inject } from '@nestjs/common';
import { PostDeploymentStep } from '@aws-ee/core-post-deployment';
import { OpenSearchIndexService } from '../opensearch-index.service';
import { OpenSearchDomainIndexProvider } from '../../extensions/opensearch-domain-index.provider';

/**
 * A post-deployment service to initialize OpenSearch with the required indices.
 */
@Injectable()
export class CreateIndexes implements PostDeploymentStep {
  constructor(
    private readonly indexService: OpenSearchIndexService,
    @Inject(OpenSearchDomainIndexProvider)
    private readonly indexProvider: OpenSearchDomainIndexProvider,
  ) {}

  async execute(): Promise<void> {
    const domains = await this.indexProvider.getDomainNames();
    for (const domain of domains) {
      const { indexes } = await this.indexProvider.getDomain(domain);
      await Promise.all(
        Object.keys(indexes).map((indexName) =>
          this.indexService.createSearchIndexIfAbsent(
            indexName,
            indexes[indexName].mappings,
            indexes[indexName].settings,
          ),
        ),
      );
    }
  }
}
