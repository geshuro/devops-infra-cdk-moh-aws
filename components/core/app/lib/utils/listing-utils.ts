import { DocumentRetrieverResponse } from 'nestjs-dynamoose';
import { ListResult } from '../models/list-result';
import { decodeBase64, encodeBase64 } from './base64-url';

export function toListResult<T>(response: DocumentRetrieverResponse<T>): ListResult<T> {
  const result: ListResult<T> = {
    items: response,
    count: response.count,
  };
  if (response.lastKey) {
    result.nextToken = encodeBase64(JSON.stringify(response.lastKey));
  }
  return result;
}

export function unpackNextToken<T>(token: string): T {
  return JSON.parse(decodeBase64(token));
}
