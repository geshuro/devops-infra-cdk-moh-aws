import { Construct } from '@aws-cdk/core';
import {
  Task,
  Parallel,
} from '@aws-cdk/aws-stepfunctions';
import { getTaskProps } from './comprehend-common';

export class ComprehendQuestionSteps extends Parallel {
  constructor(readonly scope: Construct) {
    super(scope, 
      'Detect entities, ICD10CMs and RxNorms on Questions'
    )

    const getQuestionTask = (id: string, resourceArn: string) =>
      new Task(
        scope,
        id,
        getTaskProps(
          {
            'Text.$': '$.question',
          },
          resourceArn,
        ),
      );

    const detectEntitiesQuestion = getQuestionTask(
      'Detect Entities Question',
      'arn:aws:states:::aws-sdk:comprehendmedical:detectEntitiesV2',
    );

    const inferIcd10CmQuestion = getQuestionTask(
      'Infer ICD10CM Question',
      'arn:aws:states:::aws-sdk:comprehendmedical:inferICD10CM',
    );

    const inferRxNormQuestion = getQuestionTask(
      'Infer RxNorm Question',
      'arn:aws:states:::aws-sdk:comprehendmedical:inferRxNorm',
    );

    this.branch(
      detectEntitiesQuestion,
      inferIcd10CmQuestion,
      inferRxNormQuestion,
    );
  }
}