import { httpApiGet, httpApiPost } from '@aws-ee/core-ui';

export async function basicSearch(
  domain: string,
  query: string,
  returnFullDocuments: boolean,
  highlightFields: string[],
) {
  return httpApiPost<unknown[]>(`api/search/basic`, { data: { domain, query, returnFullDocuments, highlightFields } });
}

export async function advancedSearch(
  domain: string,
  query: unknown,
  returnFullDocuments: boolean,
  highlightFields: string[],
) {
  return httpApiPost<unknown[]>(`api/search/advanced`, {
    data: { domain, query, returnFullDocuments, highlightFields },
  });
}

export async function advancedSearchFields<T>(domain: string) {
  return httpApiGet<T[]>(`api/search/advanced-fields`, { params: { domain } });
}
