import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Client as NewClient } from '@elastic/elasticsearch/api/new';
import { Client } from '@elastic/elasticsearch';
import { Boom, LoggerService } from '@aws-ee/core';
import { createAWSConnection, awsGetCredentials } from '@acuris/aws-es-connection';
import { OpenSearchConfig } from '../config/opensearch-config';

@Injectable()
export class OpenSearchClientService {
  private _client?: NewClient;
  private config: OpenSearchConfig;

  constructor(configService: ConfigService, private readonly log: LoggerService) {
    this.config = configService.get<OpenSearchConfig>(OpenSearchConfig.KEY)!;
  }

  async client(): Promise<NewClient> {
    if (!this._client) {
      const awsCredentials = await awsGetCredentials();
      const AWSConnection = createAWSConnection(awsCredentials);
      this._client = new Client({
        ...AWSConnection,
        node: `https://${this.config.openSearchEndpoint}/`,
      }) as unknown as NewClient;
    }
    return this._client;
  }

  async run<T>(fn: (client: NewClient) => Promise<T>): Promise<T> {
    try {
      const client = await this.client();
      return await fn(client);
    } catch (error) {
      throw this.transformError(error);
    }
  }

  private transformError(error: any) {
    const statusCode = error.statusCode || 500;
    const customReason = error.body?.error?.caused_by?.reason || '';

    if (statusCode === 404 || customReason === 'not_found_exception') {
      return new NotFoundException(Boom.safeMsg(`not found`));
    }
    if (statusCode === 409 || customReason === 'rev_mismatch_exception') {
      return new ConflictException(Boom.safeMsg(`out of date`));
    }

    this.log.error(error);
    return new InternalServerErrorException(Boom.safeMsg(`operation failed`));
  }
}
