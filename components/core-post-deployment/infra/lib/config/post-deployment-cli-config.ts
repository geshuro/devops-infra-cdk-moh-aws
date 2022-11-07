import { IsString } from 'class-validator';

export class PostDeploymentCliConfig {
  static readonly KEY: string = 'post-deployment-cli';

  @IsString()
  postDeploymentLambdaDir!: string;
}
