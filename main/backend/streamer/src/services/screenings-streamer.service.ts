import type { DynamoDBRecord } from 'aws-lambda';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@aws-ee/core';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { OpenSearchIndexService, OpenSearchDocumentService } from '@aws-ee/opensearch-api';
import { Screening } from '@aws-ee/backend-common';

const SCREENINGS_INDEX = 'screenings';

@Injectable()
export class ScreeningsStreamerService {
  constructor(
    private readonly indexService: OpenSearchIndexService,
    private readonly documentService: OpenSearchDocumentService,
    private readonly log: LoggerService,
  ) {}

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
          const item = this.convertScreening(ddbItem);
          await this.documentService.createDocument({
            index: SCREENINGS_INDEX,
            body: item,
          });
        }
        return;
      }

      case 'MODIFY': {
        this.log.debug(`MODIFY [${record.dynamodb?.Keys?.id.S}]`);
        const ddbItem = record.dynamodb?.NewImage;
        if (ddbItem) {
          const item = this.convertScreening(ddbItem);
          await this.documentService.overwriteDocument({
            index: SCREENINGS_INDEX,
            body: item,
          });
        }
        return;
      }

      case 'REMOVE': {
        const id = record.dynamodb?.Keys?.id.S;
        if (id) {
          try {
            await this.indexService.deleteIndex(Screening.toOpenSearchIndex(id));
          } catch (e) {
            this.log.error(`Error deleting screening index ${id} ${JSON.stringify(e)}`);
          }
          try {
            await this.documentService.deleteDocument({
              index: SCREENINGS_INDEX,
              id,
            });
          } catch (e) {
            this.log.error(`Error deleting screening from screenings list ${id} ${JSON.stringify(e)}`);
          }
        }
        return;
      }

      default: {
        throw new Error('Invalid record. Skipping.');
      }
    }
  }

  private convertScreening(ddbItem: any) {
    const item = unmarshall(ddbItem) as Screening;

    (item as any).updatedAt = new Date((item as any).updatedAt).getTime();
    (item as any).createdAt = new Date((item as any).createdAt).getTime();

    return item;
  }
}
