import type { estypes } from '@elastic/elasticsearch';

export interface OpenSearchDomain {
  domain: string;
  indexes: Record<string, OpenSearchIndex>;
}

export interface OpenSearchIndex {
  /**
   * Everything under mappings is the OpenSearch definition
   * of the index and is sent as is to OpenSearch.
   */
  mappings: Record<string, estypes.TypeMapping> | estypes.TypeMapping;

  /**
   * Extra settings for the index.
   * This is passed to OpenSearch when the index is created.
   */
  settings?: Record<string, any>;

  /**
   * Everything under advancedSearchFields defines the searchable
   * fields for the Advanced Search UI. The ID of the field is a
   * unique ID that is composed of the concatenation of the
   * index name and the nested path of the field. The components
   * in the concatenation are separated by the '|' character.
   * '.' is not used as a separator, because MobX does not like
   * '.' in field names. The label of the field is the name of the
   * field that appears in the Advanced Search UI.
   */
  advancedSearchFields: OpenSearchAdvancedSearchField[];

  /**
   * The domain ID path is the path to the ID of the document in
   * an instance of an object described by the document mapping.
   * The path format is the same as path format used by the lodash _.get
   * method. The domain ID path is used to extract the document IDs from
   * the search results of the indexes.
   */
  domainIdPath: string;
}

export interface OpenSearchAdvancedSearchField {
  id: string;
  label: string;
}
