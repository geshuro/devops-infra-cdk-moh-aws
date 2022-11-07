import { OpenSearchDomain } from '../models/opensearch-domain';

export const OpenSearchDomainIndexProvider = Symbol('openSearchDomainIndexProvider');

export interface OpenSearchDomainIndexProvider {
  getDomainNames(): Promise<string[]>;
  getDomain(domain: string): Promise<OpenSearchDomain>;
}
