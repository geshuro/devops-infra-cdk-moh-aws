import { Injectable } from '@nestjs/common';
import type { estypes, ApiResponse } from '@elastic/elasticsearch';
import { LoggerService } from '@aws-ee/core';
import { OpenSearchClientService } from './opensearch-client.service';

interface BodyWithOptionalId {
  id?: string;
}

@Injectable()
export class OpenSearchDocumentService {
  constructor(private readonly clientService: OpenSearchClientService, private readonly log: LoggerService) {}

  /**
   * Create a new document in Elasticsearch. You can supply an id for the document (inside the body).
   * An exception is thrown (alreadyExists - 400) if the document already exists
   * todo need to verify if ^^ this ^^ is actually a 400 or a 409.  No exception is thrown if payload.id already exists
   */
  createDocument<T extends BodyWithOptionalId>({
    index,
    body,
    querystring,
  }: {
    index: string;
    body: T;
    querystring?: Partial<estypes.IndexRequest<T>>;
  }): Promise<ApiResponse<estypes.IndexResponse, unknown>> {
    this.log.debug(`Create opensearch document index=${index}, id=${(body || {}).id}`);
    let request: estypes.IndexRequest<T> = { index, body, op_type: 'create' };

    if (querystring) {
      request = { ...request, ...querystring };
    }

    if (body.id) {
      request.id = body.id;
    }

    return this.clientService.run((client) => client.index(request));
  }

  /**
   * Write an individual document to Elasticsearch. Caller can optionally
   * provide the ID of the document to be written. If a document ID is
   * provided and that document already exists then it will be overwritten.
   */
  overwriteDocument<T extends BodyWithOptionalId>({
    index,
    body,
    options,
  }: {
    index: string;
    body: T;
    options?: Partial<estypes.IndexRequest>;
  }): Promise<ApiResponse<estypes.IndexResponse, unknown>> {
    this.log.debug(`Create/Overwrite opensearch document index=${index}, id=${(body || {}).id}`);

    const request: estypes.IndexRequest<T> = { ...(options || {}), index, body };

    if (body.id) {
      request.id = body.id;
    }

    return this.clientService.run((client) => client.index(request));
  }

  bulkDocuments<T>({
    index,
    bodies,
    options,
  }: {
    index: string;
    bodies: { body: T; operation: estypes.BulkOperationContainer }[];
    /**
     * use `{ refresh: 'wait_for' }` to achieve consistent writes. WARNING: performance impact
     */
    options?: Partial<estypes.BulkRequest>;
  }): Promise<ApiResponse<estypes.BulkResponse, unknown>> {
    this.log.debug(`Bulk operation on index=${index}`);

    /**
     * Syntax is peculiar as a request should go like:
     * { "update": { "_index": "movies", "_id": "1" } }  // operation
     * { "doc" : { "title": "World War Z" } }            // document
     * { "update": { "_index": "movies", "_id": "1" } }  // operation
     * { "doc" : { "title": "World War Z" } }            // document
     *
     * Beyond alternating between operation and document the update body should also be wrapped in a `doc`
     *
     * https://opensearch.org/docs/latest/opensearch/rest-api/document-apis/bulk/
     * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html
     */
    const body = bodies
      .map((item) => [item.operation, { doc: item.body }])
      .reduce((prev, curr) => prev.concat(curr), []);

    const request = {
      ...(options || {}),
      index,
      body,
    };

    return this.clientService.run((client) => client.bulk(request));
  }

  /**
   * Write an individual document to Elasticsearch. Caller can optionally
   * provide the ID of the document to be written. If a document ID is
   * provided and that document already exists then it will be overwritten.
   */
  overwriteDocumentWithRevision<T extends BodyWithOptionalId>({
    index,
    body,
    rev,
  }: {
    index: string;
    body: T;
    rev: number;
  }): Promise<ApiResponse<estypes.IndexResponse, unknown>> {
    this.log.debug(`Create/Overwrite opensearch document index=${index}, id=${(body || {}).id}`);

    const request: estypes.IndexRequest<T> = { index, body, version: rev, version_type: 'external' };

    if (body.id) {
      request.id = body.id;
    }

    return this.clientService.run((client) => client.index(request));
  }

  /**
   * Update a document using the update api
   * @see https://www.elastic.co/guide/en/elasticsearch/reference/7.10/docs-update.html
   */
  updateDocument<T>({
    index,
    id,
    body,
  }: {
    index: string;
    id: string;
    body: estypes.UpdateRequest<T>['body'];
  }): Promise<ApiResponse<estypes.UpdateResponse<T>, unknown>> {
    return this.clientService.run((client) => client.update({ index, id, body }));
  }

  /**
   * Delete a document using the delete api
   * @see https://www.elastic.co/guide/en/elasticsearch/reference/7.10/docs-delete.html
   */
  deleteDocument({ index, id }: { index: string; id: string }): Promise<ApiResponse<estypes.DeleteResponse, unknown>> {
    this.log.debug(`Delete opensearch document index=${index}, id=${id}`);
    return this.clientService.run((client) => client.delete({ index, id }));
  }

  get<T>({ index, id }: { index: string; id: string }): Promise<ApiResponse<estypes.GetResponse<T>, unknown>> {
    return this.clientService.run((client) => client.get({ index, id }));
  }
}
