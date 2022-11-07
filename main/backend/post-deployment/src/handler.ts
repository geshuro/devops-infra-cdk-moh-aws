import 'regenerator-runtime';
import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Handler } from 'aws-lambda';
import { DeploymentRunner } from '@aws-ee/core-post-deployment';
import { PostDeploymentHandlerModule } from './post-deployment-handler.module';

const bootstrap = (): Promise<INestApplicationContext> =>
  NestFactory.createApplicationContext(PostDeploymentHandlerModule);

const contextPromise = bootstrap();

export const handler: Handler = async (event) => {
  const context = await contextPromise;
  const deploymentRunner = context.get(DeploymentRunner);

  if (event?.action?.toLower() === 'remove') {
    await deploymentRunner.preRemove();
  } else {
    await deploymentRunner.postDeploy();
  }
};
