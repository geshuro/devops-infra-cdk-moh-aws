import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '@aws-ee/core';
import { PostDeploymentStep } from '@aws-ee/core-post-deployment';

import { CopyObjectRequest, S3 } from '@aws-sdk/client-s3';

import { PostDeploymentConfig } from '../config/post-deployment.config';

@Injectable()
export class DummyDataService implements PostDeploymentStep {
  private readonly s3Client = new S3({});
  private config: PostDeploymentConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly log: LoggerService
  ) {
    this.config = this.configService.get<PostDeploymentConfig>(PostDeploymentConfig.KEY)!;
  }

  async writeDummyData(): Promise<void> {
    const bucketName = this.config.dummyDataBucket;
    this.log.info(`Writing to bucket ${bucketName}`);
    const screeningNames = ['gcc_cpp', 'liver_m', 'liver_p', 'prostate_m', 'prostate_p'];
    const screeningsMD = [
      this.config.dummyDataAssetsGccCppMD,
      this.config.dummyDataAssetsLiverMMD,
      this.config.dummyDataAssetsLiverPMD,
      this.config.dummyDataAssetsProstateMMD,
      this.config.dummyDataAssetsProstatePMD
    ];
    const screeningsRQ = [
      this.config.dummyDataAssetsGccCppRQ,
      this.config.dummyDataAssetsLiverMRQ,
      this.config.dummyDataAssetsLiverPRQ,
      this.config.dummyDataAssetsProstateMRQ,
      this.config.dummyDataAssetsProstatePRQ
    ];
    
    await Promise.all(screeningNames.map(async (screeningName, idx) => {      
      const params: CopyObjectRequest = {
        CopySource: screeningsMD[idx],
        Bucket: bucketName,
        Key: `${screeningName}/metadata.csv`,
      };
      this.s3Client.copyObject(params);

      const paramsRequest: CopyObjectRequest = {
        CopySource: screeningsRQ[idx],
        Bucket: bucketName,
        Key: `${screeningName}/request.json`,
      };
      this.s3Client.copyObject(paramsRequest);
    }));

    const params: CopyObjectRequest = {
      CopySource: this.config.dummyDataPdf,
      Bucket: bucketName,
      Key: `random-journal.pdf`,
    };
    await this.s3Client.copyObject(params);
  }

  async execute(): Promise<void> {
    try {
      await this.writeDummyData();
    } catch (err) {
      this.log.error(`Error creating dummy data: ${err}`);
    }
  }
}
