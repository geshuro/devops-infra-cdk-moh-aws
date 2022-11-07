import type { DynamoDBRecord } from 'aws-lambda';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@aws-ee/core';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { OpenSearchDocumentService } from '@aws-ee/opensearch-api';
import { Article, articleDynamoToOpenSearch } from '@aws-ee/backend-common';

@Injectable()
export class ArticlesStreamerService {
  constructor(private readonly documentService: OpenSearchDocumentService, private readonly log: LoggerService) {}

  async streamRecords(records: DynamoDBRecord[]): Promise<void> {
    for (const record of records) {
      try {
        await this.streamRecord(record);
      } catch (err) {
        this.log.error(err);
      }
    }
  }

  private async streamRecord(record: DynamoDBRecord) {
    switch (record.eventName) {
      case 'INSERT': {
        this.log.debug(`INSERT [${record.dynamodb?.Keys?.id.S}]`);
        const ddbItem = record.dynamodb?.NewImage;
        if (ddbItem) {
          const { item, index } = this.convertItem(ddbItem);
          await this.documentService.createDocument({
            index,
            body: item,
          });
        }
        return;
      }

      case 'MODIFY': {
        this.log.debug(`MODIFY [${record.dynamodb?.Keys?.id.S}]`);
        const ddbItem = record.dynamodb?.NewImage;
        if (ddbItem) {
          const { item, index } = this.convertItem(ddbItem);
          await this.documentService.overwriteDocument({
            index,
            body: item,
          });
        }
        return;
      }

      case 'REMOVE': {
        // no action. there should be no new insertions/removals after initial creation,
        // we want to delete the whole index when a screening is deleted
        return;
      }

      default: {
        throw new Error('Invalid record. Skipping.');
      }
    }
  }

  private convertItem(ddbItem: any): { item: Article; index: string } {
    const item = unmarshall(ddbItem) as Article;
    return articleDynamoToOpenSearch(item);
  }
}
