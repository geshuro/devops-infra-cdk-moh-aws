import _ from 'lodash';
import { Injectable, Inject } from '@nestjs/common';
import type { estypes, ApiResponse } from '@elastic/elasticsearch';
import { AuditWriterService, LoggerService, AuditEvent } from '@aws-ee/core';
import { OpenSearchClientService } from './opensearch-client.service';
import { OpenSearchDomainIndexProvider } from '../extensions/opensearch-domain-index.provider';
import { OpenSearchAdvancedSearchField, OpenSearchIndex } from '../models/opensearch-domain';

const defaultHighlight = {
  pre_tags: ['<mark>'],
  post_tags: ['</mark>'],
};

@Injectable()
export class OpenSearchSearchService {
  constructor(
    private readonly clientService: OpenSearchClientService,
    @Inject(OpenSearchDomainIndexProvider)
    private readonly indexProvider: OpenSearchDomainIndexProvider,
    private readonly log: LoggerService,
    private readonly auditWriter: AuditWriterService,
  ) {}

  // Search Elasticsearch for documents that match a supplied query.
  async searchIndex<T>({
    index,
    query,
  }: {
    index: estypes.Indices;
    query: estypes.SearchRequest['body'];
  }): Promise<ApiResponse<estypes.SearchResponse<T>, unknown>> {
    this.log.debug({ msg: 'Elasticsearch Query', index, query });
    return this.clientService.run((client) => client.search<T>({ index, body: query }, { ignore: [404] }));
  }

  /**
   * For a given domain and a query string, return either matching IDs or
   * matching documents for each document that matches the query.
   */
  async basicSearch({
    domain,
    query,
    returnFullDocuments,
    highlightFields = [],
  }: {
    domain: string;
    query: string;
    returnFullDocuments: boolean;
    highlightFields: string[];
  }) {
    // We get the index definitions for the given domain.
    const { indexes } = await this.indexProvider.getDomain(domain);

    const indexNames = Object.keys(indexes);

    await this.auditWriter.write(
      new AuditEvent({
        action: 'basicSearch',
        body: {
          domain,
          query,
          returnFullDocuments,
          highlightFields,
          indexNames,
        },
      }),
    );

    if (returnFullDocuments) {
      return this.basicSearchFullResults({ indexNames, indexes, query, highlightFields });
    }
    return this.basicSearchIdsOnly({ indexNames, indexes, query });
  }

  /**
   * For a given domain and a query string, we return the IDs of all documents
   * that have a field in the index that matches the query.
   */
  private async basicSearchIdsOnly({
    indexNames,
    indexes,
    query,
  }: {
    indexNames: string[];
    indexes: Record<string, OpenSearchIndex>;
    query: string;
  }) {
    const results = await this.getBasicResults({ indexNames, indexes, query });
    return this.listDomainIds(indexes, results);
  }

  /**
   * For a given domain and a query string, we return the full document
   * for each document that has a field in the index that matches the query.
   */
  private async basicSearchFullResults({
    indexNames,
    indexes,
    query,
    highlightFields,
  }: {
    indexNames: string[];
    indexes: Record<string, OpenSearchIndex>;
    query: string;
    highlightFields: string[];
  }) {
    const results = await this.getBasicResults({ indexNames, indexes, query, highlightFields });
    return this.listResultDocuments(results);
  }

  private async listResultDocuments(results: ApiResponse<estypes.SearchResponse<unknown>, unknown>[]) {
    // eslint-disable-next-line you-dont-need-lodash-underscore/flatten
    results = _.flatten(results);

    const documents: Record<string, string[] | string>[] = [];
    // const hits = _.get(results[0], ['hits', 'hits']);
    const hits = results[0]?.body?.hits?.hits;

    _.forEach(hits, (hit) => {
      documents.push(Object.assign(hit._source, hit.highlight)!);
    });

    _.forEach(documents, (document) => {
      _.forOwn(document, (value, _key) => {
        if (Array.isArray(value)) {
          document[_key] = value.join();
        }
      });
    });
    return documents;
  }

  private async getBasicResults({
    indexNames,
    indexes,
    query,
    highlightFields: highlightFieldsArray = [],
  }: {
    indexNames: string[];
    indexes: Record<string, OpenSearchIndex>;
    query: string;
    highlightFields?: string[];
  }) {
    // We loop through each index definition to get the top level and nested
    // mappings and create a query for them. We then "OR" the queries using
    // the Elasticsearch "should" operator.
    const results = await Promise.all(
      indexNames.map((indexName) => {
        const nestedTypes: string[] = [];

        // Add default highlight
        const highlightFields: Record<string, any> = {};
        highlightFieldsArray.forEach((key) => {
          highlightFields[key] = defaultHighlight;
        });

        _.forEach(indexes[indexName].mappings, (mapping) => {
          this.listNestedTypes(mapping, nestedTypes);
        });

        const nestedQueries = nestedTypes.map((nestedType) => ({
          nested: {
            path: nestedType,
            query: {
              query_string: {
                query,
              },
            },
            ignore_unmapped: true,
          },
        }));

        const finalQuery: estypes.SearchRequest['body'] = {
          query: {
            bool: {
              should: [
                ...nestedQueries,
                {
                  query_string: {
                    query,
                  },
                },
              ],
            },
          },
          highlight: {
            fields: highlightFields,
            number_of_fragments: 0,
            encoder: 'html',
          },
        };

        return this.searchIndex({ index: indexName, query: finalQuery });
      }),
    );
    return results;
  }

  /**
   * For a given domain and field values, we return the either IDs or full documents
   * whose values match all of their equivalents in the given field values. The field
   * values are supplied as a map by the query parameter. A field value is the
   * concatenation of its index name and its nested path in the index definition.
   * The components of the concatenation are separated by the '|' character.
   * @param {string} domain
   * @param {Object} query
   * @param {boolean} returnFullDocuments
   */
  async advancedSearch({
    domain,
    query,
    returnFullDocuments,
    highlightFields = [],
  }: {
    domain: string;
    query: Record<string, string>;
    returnFullDocuments: boolean;
    highlightFields: string[];
  }) {
    const parameters = this.listAdvancedSearchParameters(query);
    const { indexes } = await this.indexProvider.getDomain(domain);

    const indexNames = Object.keys(indexes);

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'advancedSearch',
        body: {
          domain,
          query,
          returnFullDocuments,
          highlightFields,
          indexNames,
        },
      }),
    );

    if (returnFullDocuments) {
      return this.advancedSearchFullResults({ indexNames, indexes, parameters, highlightFields });
    }
    return this.advancedSearchIdsOnly({ indexNames, indexes, parameters });
  }

  private async advancedSearchIdsOnly({
    indexNames,
    indexes,
    parameters,
  }: {
    indexNames: string[];
    indexes: Record<string, OpenSearchIndex>;
    parameters: any;
  }) {
    const results = await this.getAdvancedResults({ indexNames, parameters });
    return this.listDomainIds(indexes, results);
  }

  private async advancedSearchFullResults({
    indexNames,
    parameters,
    highlightFields,
  }: {
    indexNames: string[];
    indexes: Record<string, OpenSearchIndex>;
    parameters: any;
    highlightFields: string[];
  }) {
    const results = await this.getAdvancedResults({ indexNames, parameters, highlightFields });
    return this.listResultDocuments(results);
  }

  private async getAdvancedResults({
    indexNames,
    parameters,
    highlightFields: highlightFieldsArray = [],
  }: {
    indexNames: string[];
    parameters: any;
    highlightFields?: string[];
  }) {
    // We loop through each index definition to get the top level and nested
    // mappings of the fields. If the fields of the index match any of the
    // given fields, we construct a query for them. We then combine the
    // queries into a single query using the Elasticsearch "must" operator.
    // This is the equivalent to a logical "AND" operation.
    const results = await Promise.all(
      // TODO: externalize the query building logic into a helper that follows a builder pattern
      indexNames.map(async (indexName) => {
        const queries: estypes.QueryContainer[] = [];

        // Add default highlight
        const highlightFields: Record<string, estypes.HighlightField> = {};
        highlightFieldsArray.forEach((key) => {
          highlightFields[key] = defaultHighlight;
        });

        _.forEach(Object.keys(parameters), (path) => {
          if (!this.isPathOfIndex(path, indexName) || !this.isNestedPath(path)) {
            return;
          }

          _.forEach(Object.keys(parameters[path]), (propertyName) => {
            const strippedPath = this.stripIndexName(path);

            queries.push({
              nested: {
                path: strippedPath,
                query: {
                  query_string: {
                    query: parameters[path][propertyName],
                    fields: [`${strippedPath}.${propertyName}`],
                  },
                },
              },
            });
          });
        });

        if (parameters[indexName]) {
          _.forEach(Object.keys(parameters[indexName]), (propertyName) => {
            queries.push({
              query_string: {
                query: parameters[indexName][propertyName],
                fields: [propertyName],
              },
            });
          });
        }

        // TODO: [] seems wrong
        // if (queries.length === 0) {
        //   return [];
        // }

        const finalQuery: estypes.SearchRequest['body'] = {
          query: {
            bool: {
              must: [...queries],
            },
          },
          highlight: {
            fields: highlightFields,
            number_of_fragments: 0,
            encoder: 'html',
          },
        };

        return this.searchIndex({ index: indexName, query: finalQuery });
      }),
    );
    return results;
  }

  async listAdvancedSearchFields(domain: string): Promise<OpenSearchAdvancedSearchField[]> {
    const { indexes } = await this.indexProvider.getDomain(domain);

    return Object.values(indexes).reduce(
      (prev, index) => [...prev, ...index.advancedSearchFields],
      [] as OpenSearchAdvancedSearchField[],
    );
  }

  private listDomainIds(
    indexes: Record<string, OpenSearchIndex>,
    results: ApiResponse<estypes.SearchResponse<unknown>, unknown>[],
  ) {
    // eslint-disable-next-line you-dont-need-lodash-underscore/flatten
    results = _.flatten(results);

    const domainIds: string[] = [];

    _.forEach(results, (result) => {
      // _.forEach(result.hits.hits, (hit) => {
      _.forEach(result.body.hits.hits, (hit) => {
        const indexName = hit._index;
        const index = indexes[indexName];
        const domainId = _.get(hit._source, index.domainIdPath);

        domainIds.push(domainId);
      });
    });

    // eslint-disable-next-line you-dont-need-lodash-underscore/uniq
    return _.uniq(domainIds);
  }

  private listAdvancedSearchParameters(query: Record<string, string>) {
    const parameters: Record<string, Record<string, string>> = {};
    const keys = Object.keys(query);

    _.forEach(keys, (key) => {
      const value = query[key];

      if (!value) {
        return;
      }

      const lastIndex = key.lastIndexOf('|');

      if (lastIndex === -1) {
        return;
      }

      const nestedTypePath = key.substring(0, lastIndex).replace('|', '.');
      const typeName = key.substring(lastIndex + 1);

      if (!parameters[nestedTypePath]) {
        parameters[nestedTypePath] = {};
      }

      parameters[nestedTypePath][typeName] = value;
    });

    return parameters;
  }

  private listNestedTypes(mapping: estypes.Property | estypes.TypeMapping, nestedTypes: string[], path = '') {
    if ('type' in mapping && mapping.type === 'nested') {
      nestedTypes.push(path);
    }

    if (!mapping.properties) {
      return;
    }

    if (path) {
      path = `${path}.`;
    }

    _.forEach(Object.keys(mapping.properties), (property) => {
      this.listNestedTypes(mapping.properties![property], nestedTypes, `${path}${property}`);
    });
  }

  private stripIndexName(nestedTypeName: string) {
    const index = nestedTypeName.indexOf('.');

    if (index === -1) {
      return nestedTypeName;
    }

    return nestedTypeName.substring(index + 1);
  }

  private isNestedPath(path: string) {
    return path.indexOf('.') !== -1;
  }

  private isPathOfIndex(path: string, indexName: string) {
    return path.startsWith(`${indexName}.`);
  }
}
