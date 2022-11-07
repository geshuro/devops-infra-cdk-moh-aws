import _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { OpenSearchDomain, OpenSearchDomainIndexProvider } from '@aws-ee/opensearch-api';

const MAIN_OPEN_SEARCH_DOMAIN = 'screening-1';

@Injectable()
export class OpenSearchDomainIndexProviderService implements OpenSearchDomainIndexProvider {
  async getDomainNames(): Promise<string[]> {
    return [MAIN_OPEN_SEARCH_DOMAIN];
  }

  getDomain(domain: string): Promise<OpenSearchDomain> {
    if (domain !== MAIN_OPEN_SEARCH_DOMAIN) {
      throw new Error(`Unknown OpenSearch domain [${domain}]`);
    }

    return Promise.resolve<OpenSearchDomain>({
      domain: MAIN_OPEN_SEARCH_DOMAIN,
      indexes: {
        screenings: {
          settings: {
            index: {
              number_of_shards: 1,
              // TODO: use `openSearchReplicasScreeningIndex` config, but since it's just 1 index, that's fine as is
              number_of_replicas: 1,
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              createdAt: { type: 'date', format: 'epoch_millis' },
              createdBy: { type: 'text' },
              status: { type: 'text' },
              clinicalQuestion: { type: 'text' },
              keywords: { type: 'text' },
              picoP: { type: 'text' },
              picoI: { type: 'text' },
              picoC: { type: 'text' },
              picoO: { type: 'text' },
              picoD: { type: 'text' },
            },
          },
          advancedSearchFields: [],
          domainIdPath: 'id',
        },
      },
    });
  }
}
