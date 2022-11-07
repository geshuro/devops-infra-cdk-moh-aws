import { DeployBootstrapStep } from '@aws-ee/core-infra';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreCicdConfig } from '../config/cicd-config';

@Injectable()
export class CicdDeploySolutionSteps {
  constructor(bootstrap: DeployBootstrapStep, configService: ConfigService) {
    const cicdConfig = configService.get<CoreCicdConfig>(CoreCicdConfig.KEY)!;
    bootstrap.trustProfiles(cicdConfig.cicdAwsProfile);
  }
}
