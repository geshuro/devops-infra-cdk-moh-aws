export interface ListResult<T> {
  items: T[];
  count: number;
  nextToken?: string;
}
