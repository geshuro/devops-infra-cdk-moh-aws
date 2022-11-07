export interface Event {
  detailType: string;
  detail: {
    [k: string]: unknown;
  };
  sourceSystem: string;
  createdAt?: string;
}
