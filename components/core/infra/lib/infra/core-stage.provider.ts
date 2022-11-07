import { Stage } from '@aws-cdk/core';
import { ValueProvider } from '@nestjs/common';

export const CoreStage = Symbol('coreStage');

export const stageProvider = (stage: Stage): ValueProvider<Stage> => ({
  provide: CoreStage,
  useValue: stage,
});
