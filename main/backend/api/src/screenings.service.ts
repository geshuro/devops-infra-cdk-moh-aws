import { S3 } from 'aws-sdk';

import type { estypes } from '@elastic/elasticsearch';
import { nanoid } from 'nanoid';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document } from 'nestjs-dynamoose';

import { OpenSearchIndexService } from '@aws-ee/opensearch-api';
import {
  Article,
  ArticleDbService,
  Screening,
  ScreeningKey,
  ScreeningDbService,
  StatusPusherService,
} from '@aws-ee/backend-common';

import { ApiHandlerExtendedConfig } from './config/api-handler-extended.config';
import { CreateScreeningDto } from './CreateScreeningDto';

export type Decision = { madeBy: string; decision: string };
export type ArticleExtended = Article & { decision1: Decision; decision2: Decision } & {
  secondDecision1: Decision;
  secondDecision2: Decision;
} & {
  firstAvgPico: number | undefined;
  secondAvgPico: number | undefined;
};

@Injectable()
export class ScreeningsService {
  private s3Client: S3;
  private config: ApiHandlerExtendedConfig;

  constructor(
    configService: ConfigService,
    private screeningDbService: ScreeningDbService,
    private openSearchIndexService: OpenSearchIndexService,
    private statusPusherService: StatusPusherService,
  ) {
    this.s3Client = new S3({});
    this.config = configService.get<ApiHandlerExtendedConfig>(ApiHandlerExtendedConfig.KEY)!;
  }

  async create(screeningRequest: CreateScreeningDto) {
    const obj = await this.screeningDbService.create({
      ...screeningRequest,
      id: nanoid(),
    });

    await this.createOpenSearchIndex(obj.id);

    return { id: obj.id };
  }

  getOrUndefined(screeningKey: ScreeningKey): Promise<Document<Screening> | undefined> {
    return this.screeningDbService.get(screeningKey);
  }

  async getStrict(screeningKey: ScreeningKey): Promise<Document<Screening>> {
    const screening = await this.getOrUndefined(screeningKey);
    if (!screening) {
      throw new Error(`no screening with id ${screeningKey.id} found`);
    }
    return screening;
  }

  async getUploadUrl(screeningId: string) {
    const params = {
      Bucket: this.config.rawMetadataBucket,
      Fields: { Key: `${screeningId}/metadata.csv` },
      Conditions: [
        // https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html
        ['content-length-range', 0, 50 * 1024 * 1024],
        // ['Content-Type', 'text/csv'], // for some reason this results in an error by S3
      ],
      Expires: 30,
    };
    const { url, fields } = await new Promise((resolve, reject) => {
      this.s3Client.createPresignedPost(params, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
    return { s3UploadUrl: url, s3UploadParams: fields };
  }

  private async createOpenSearchIndex(id: string) {
    const numberOfReplicas = Number(this.config.openSearchReplicasScreeningIndex) ?? 1;
    const properties: { [key in keyof Article]: estypes.Property } = {
      id: { type: 'keyword' },
      createdAt: { type: 'date', format: 'epoch_millis' },
      title: { type: 'text' },
      abstract: { type: 'text' },
      source: { type: 'text' },
      firstAutoReviewDecision: { type: 'text' },
      secondAutoReviewDecision: { type: 'text' },
      // let OpenSearch infer some of the fields type, when pre-populated on index creation there were problems with overwriting documents
      // decision1: { type: 'nested', properties: { madeBy: { type: 'text' }, decision: { type: 'text' } } },
      // decision2: { type: 'nested', properties: { madeBy: { type: 'text' }, decision: { type: 'text' } } },
      // secondDecision1: { type: 'nested', properties: { madeBy: { type: 'text' }, decision: { type: 'text' } } },
      // secondDecision2: { type: 'nested', properties: { madeBy: { type: 'text' }, decision: { type: 'text' } } },
      picoPScore: { type: 'double' },
      picoIScore: { type: 'double' },
      picoCScore: { type: 'double' },
      picoOScore: { type: 'double' },
      picoDScore: { type: 'double' },
      secondPicoPScore: { type: 'double' },
      secondPicoIScore: { type: 'double' },
      secondPicoCScore: { type: 'double' },
      secondPicoOScore: { type: 'double' },
      secondPicoDScore: { type: 'double' },
      firstAvgPico: { type: 'double' },
      secondAvgPico: { type: 'double' },
      author: { type: 'text' },
      screeningId: { type: 'text' },
    };
    // TODO: read docs https://opensearch.org/docs/latest/opensearch/index-templates

    const indexName = Screening.toOpenSearchIndex(id); // restrictions for index name by OpenSearch
    await this.openSearchIndexService.createSearchIndexIfAbsent(
      indexName,
      {
        properties,
      },
      {
        index: {
          number_of_shards: 1,
          number_of_replicas: numberOfReplicas,
        },
      },
    );
  }

  async startScreeningPhase2(screeningId: string) {
    await this.statusPusherService.screening1Complete({ screeningId });
  }

  async completeScreeningPhase2(screeningId: string) {
    await this.statusPusherService.screening2Complete({ screeningId });
  }

  async hasPdfContent(screeningId: string): Promise<boolean> {
    const response = await this.s3Client
      .listObjectsV2({
        Bucket: this.config.rawPdfBucket,
        Prefix: screeningId,
        // find only 1 object to see the bucket isn't empty
        MaxKeys: 1,
      })
      .promise();
    return (response.KeyCount ?? 0) > 0;
  }
}
