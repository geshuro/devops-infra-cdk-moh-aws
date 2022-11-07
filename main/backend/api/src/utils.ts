import type { estypes } from '@elastic/elasticsearch';

export const toNumber = (obj: estypes.TotalHits | number): number => {
  if ((obj as estypes.TotalHits).value !== undefined) {
    return Number((obj as estypes.TotalHits).value);
  }
  return Number(obj);
};
