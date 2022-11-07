import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class PostDeploymentConfig {
  static KEY = 'restApiPostDeploymentConfig';

  @IsString()
  @Expose({ name: 'APP_SOLUTION_NAME' })
  solutionName!: string;
}
