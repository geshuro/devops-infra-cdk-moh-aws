import { IsString } from 'class-validator';

export class RestApiCliConfig {
  static readonly KEY: any = 'rest-api-cli';

  @IsString()
  apiLambdaDir!: string;
}
