import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@aws-ee/core';

import { DocumentEvaluationModule } from '../document-evaluation-handler.module';
import { calculateProximityFromEntitiesPico } from './document-evaluation';
import { ComprehendService } from '../services/comprehend.service';

const contextPromise = NestFactory.createApplicationContext(DocumentEvaluationModule);

export const comprehendHandler = async (event) => {
  const context = await contextPromise;
  const logger = context.get(LoggerService);
  const comprehendService = context.get(ComprehendService);

  try {
    const screeningId = event.screeningId;
    const inputSource = `s3://${event.mlInputBucketName}/${screeningId}/`;

    return await comprehendService.batchComprehend({ screeningId, inputBucketPath: inputSource });
  } catch (err) {
    logger.error(`Error processing Comprehend input: ${err}`);
  }
};

export const checkStatusHandler = async (params: any) => {
  const context = await contextPromise;

  const comprehendService = context.get(ComprehendService);

  const screeningPropsJson = params.screeningProps;
  const comprehendProcessingResultsJson = params.comprehendProcessingResults;

  const articleResultsJson = comprehendProcessingResultsJson[1];

  const statuses = await comprehendService.getStatus(
    {
      entities: articleResultsJson.jobId.entities,
      icd10CM: articleResultsJson.jobId.icd10CM,
      rxNorm: articleResultsJson.jobId.rxNorm
    }
  );

  const failedStatus = statuses.filter(singleStatus => singleStatus === 'FAILED');
  if (failedStatus.length !== 0) {
    throw new Error(`One or more jobs failed. Check manifests for jobs ${JSON.stringify(articleResultsJson.jobId)}`);
  }
  const stoppedStatus = statuses.filter(singleStatus => singleStatus === 'STOPPED');
  if (stoppedStatus.length !== 0) {
    throw new Error(`One or more jobs stopped. Check manifests for jobs ${JSON.stringify(articleResultsJson.jobId)}`);
  }

  const completedStatus = statuses.filter(singleStatus => singleStatus === 'COMPLETED');

  return {
    screeningProps: screeningPropsJson,
    comprehendProcessingResults: comprehendProcessingResultsJson,
    status: completedStatus.length === statuses.length ? 'COMPLETED' : 'IN_PROGRESS'
  }
}


export const combineHandler = async (params: any) => {
  const context = await contextPromise;
  const logger = context.get(LoggerService);

  const comprehendService = context.get(ComprehendService);

  const comprehendProcessingResults = params.comprehendProcessingResults;

  const questionResultsJson = comprehendProcessingResults[0];
  const screeningPropsJson = {
    id: questionResultsJson.id,
    mlResultsBucketName: questionResultsJson.mlResultsBucketName,
    mlInputBucketName: questionResultsJson.mlInputBucketName,
    questions: questionResultsJson.questions,
    screeningId: questionResultsJson.screeningId,
    screeningStatus: questionResultsJson.screeningStatus
  }
  const proximities = questionResultsJson.comprehendMedicalProximities;

  const articleResultsJson = comprehendProcessingResults[1];

  const entitiesManifest = await comprehendService.getManifest({
    screeningId: articleResultsJson.screeningId,
    prefix: 'Entities',
    jobType: 'EntitiesDetection',
    jobId: articleResultsJson.jobId!.entities
  });
  const entitiesOutput = await comprehendService.getOutputFiles({
    bucket: entitiesManifest.Bucket,
    path: entitiesManifest.Path
  });

  const icd10CMManifest = await comprehendService.getManifest({
    screeningId: articleResultsJson.screeningId,
    prefix: 'ICD10CM',
    jobType: 'ICD10CMInference',
    jobId: articleResultsJson.jobId!.icd10CM
  });
  const icd10CMOutput = await comprehendService.getOutputFiles({
    bucket: icd10CMManifest.Bucket,
    path: icd10CMManifest.Path
  });
  
  const rxNormManifest = await comprehendService.getManifest({
    screeningId: articleResultsJson.screeningId,
    prefix: 'RxNorm',
    jobType: 'RxNormInference',
    jobId: articleResultsJson.jobId!.rxNorm
  });

  const rxNormOutput = await comprehendService.getOutputFiles({
    bucket: rxNormManifest.Bucket,
    path: rxNormManifest.Path
  });

  const mergeOutputFileNames = [...entitiesOutput, ...icd10CMOutput, ...rxNormOutput]
    .map(fileName => fileName.split('/')[fileName.split('/').length - 1].replace('.out', ''));

  const uniqueFiles = [...new Set(mergeOutputFileNames)]; // This list is the unique article names that have been mapped by one or more of entities, RxNorms, and/or ID10CM
  if (uniqueFiles.length !== entitiesOutput.length || uniqueFiles.length !== icd10CMOutput.length || uniqueFiles.length !== rxNormOutput.length) {
    logger.warn(`At least one article was captured in some job types, but not all: entities (${entitiesOutput.length}), icd10cm (${icd10CMOutput.length}), rxNorm (${rxNormOutput.length})`);
  }

  return {
    screeningProps: screeningPropsJson,
    comprehendProcessingResults: {
      questionResults: proximities,
      articleResults: articleResultsJson
    },
    uniqueArticleIdList: uniqueFiles
  };
};

// TODO: Determine why the proximities here do not quite match those used within the unit tests
// This is partly down to the abstract items being generated using the synchronous Comprehend calls, rather than
// batch mode, which returns different data, but even after taking this into account there is a slight discrepancy
export const calculateProximitiesHandler = async (params: any) => {
  const context = await contextPromise;

  const comprehendService = context.get(ComprehendService);
  const logger = context.get(LoggerService);

  const documentId = params.item;
  const screeningId = params.screeningProps.screeningId;
  const jobIds = params.comprehendProcessingResults.articleResults.jobId;
  const entities = await comprehendService.getEntities({
    screeningId,
    prefix: 'Entities',
    jobType: 'EntitiesDetection',
    jobId: jobIds.entities
  }, documentId);
  const id10Cms = await comprehendService.getEntities({
    screeningId,
    prefix: 'ICD10CM',
    jobType: 'ICD10CMInference',
    jobId: jobIds.icd10CM
  }, documentId);
  const rxNorms = await comprehendService.getEntities({
    screeningId,
    prefix: 'RxNorm',
    jobType: 'RxNormInference',
    jobId: jobIds.rxNorm
  }, documentId);
  const proximityInput = params.comprehendProcessingResults.questionResults;

  const pico = ['P', 'I', 'C', 'O'];
  const proximities = calculateProximityFromEntitiesPico(
    {
      entities,
      id10Cms,
      rxNorms
    },
    {
      entities: proximityInput[pico.indexOf('P')][0].Entities,
      id10Cms: proximityInput[pico.indexOf('P')][1].Entities,
      rxNorms: proximityInput[pico.indexOf('P')][2].Entities,
    },
    {
      entities: proximityInput[pico.indexOf('I')][0].Entities,
      id10Cms: proximityInput[pico.indexOf('I')][1].Entities,
      rxNorms: proximityInput[pico.indexOf('I')][2].Entities,
    },
    {
      entities: proximityInput[pico.indexOf('C')][0].Entities,
      id10Cms: proximityInput[pico.indexOf('C')][1].Entities,
      rxNorms: proximityInput[pico.indexOf('C')][2].Entities,
    },
    {
      entities: proximityInput[pico.indexOf('O')][0].Entities,
      id10Cms: proximityInput[pico.indexOf('O')][1].Entities,
      rxNorms: proximityInput[pico.indexOf('O')][2].Entities,
    },
  );
  proximities.documentId = documentId;

  return { ...params, proximities };
};
