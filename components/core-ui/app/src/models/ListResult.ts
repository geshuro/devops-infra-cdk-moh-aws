export type ListResult<T> = {
  items: T[];
  count: number;
  nextToken?: string;
};
