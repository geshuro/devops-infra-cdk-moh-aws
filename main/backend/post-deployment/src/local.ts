/* eslint-disable max-classes-per-file */
/**
 * This is the entry point for local debugging
 */
import 'regenerator-runtime';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DeploymentRunner } from '@aws-ee/core-post-deployment';
import { PostDeploymentHandlerModule } from './post-deployment-handler.module';

const port = 4001;

@Controller('/')
class LocalDebuggingController {
  constructor(private readonly runner: DeploymentRunner) {}

  @Get('postDeploy')
  async postDeploy() {
    await this.runner.postDeploy();
    return {
      msg: 'Post deployment run has completed successfully.',
    };
  }

  @Get('preRemove')
  async preRemove() {
    await this.runner.preRemove();
    return {
      msg: 'Pre removal run has completed successfully.',
    };
  }
}

@Module({
  imports: [PostDeploymentHandlerModule],
  controllers: [LocalDebuggingController],
})
class LocalDebuggingModule {}

async function bootstrap() {
  const app = await NestFactory.create(LocalDebuggingModule);

  await app.listen(port);

  const apiBase = `http://localhost:${port}`;

  console.info(`\nPost Deployment is now listening on ${apiBase}\n`);
  console.info(`GET ${apiBase}/postDeploy to start a post deployment run`);
  console.info(`GET ${apiBase}/preRemove to start a pre removal run`);
}
bootstrap();
