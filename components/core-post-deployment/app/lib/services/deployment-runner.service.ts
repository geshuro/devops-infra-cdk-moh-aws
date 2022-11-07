import { LoggerService } from '@aws-ee/core';
import { Inject, Injectable, Optional } from '@nestjs/common';

import { PostDeploymentStep } from '../extensions/post-deployment-step';

@Injectable()
export class DeploymentRunner {
  constructor(
    private readonly log: LoggerService,
    @Optional() @Inject(PostDeploymentStep) private readonly steps: PostDeploymentStep[],
  ) {}

  async postDeploy(): Promise<void> {
    try {
      this.log.info('Post deployment -- STARTED');
      // We need to await execution of steps in the strict sequence so awaiting in loop
      for (const step of this.steps || []) {
        const name = step?.constructor?.name;
        this.log.info(`====> Running ${name}.execute()`);
        await step.execute();
      }
      this.log.info('Post deployment -- ENDED');
    } catch (error) {
      this.log.error(error);
      throw error;
    }
  }

  async preRemove(): Promise<void> {
    try {
      this.log.info('Pre remove -- STARTED');
      // perform the cleanup in reverse order of the post-deployment steps registration
      const cleanupSteps = [...(this.steps || [])].reverse();
      // We need to await execution of steps in the strict sequence so awaiting in loop
      for (const step of cleanupSteps) {
        const name = step?.constructor?.name;
        // not all post-deployment steps provide cleanup method, call only if it's available
        if (step.cleanup) {
          this.log.info(`====> Running ${name}.cleanup()`);
          await step.cleanup();
        } else {
          this.log.warn(
            `Post-deployment step "${name}" does not provide any cleanup method. Each post-deployment step should provide a cleanup method to undo all post-deployment work during un-deployment.`,
          );
        }
      }
      this.log.info('Pre remove -- ENDED');
    } catch (error) {
      this.log.error(error);
      throw error;
    }
  }
}
