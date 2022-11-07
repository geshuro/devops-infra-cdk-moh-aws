import { Injectable } from '@nestjs/common';
import { ApiStack } from '@aws-ee/core-rest-api-infra';
import { PostDeploymentStack } from '@aws-ee/core-post-deployment-infra';
import { OpenSearchStack } from './opensearch.stack';

@Injectable()
export class BackendUpdates {
  constructor(api: ApiStack, postDeploymentStack: PostDeploymentStack, openSearch: OpenSearchStack) {
    [api.apiHandler, postDeploymentStack.postDeploymentLambda].forEach((lambda) => {
      lambda
        .addEnvironment('APP_OPENSEARCH_VERSION', openSearch.openSearchVersion.version)
        .addEnvironment('APP_OPENSEARCH_ENDPOINT', openSearch.domain.domainEndpoint);

      openSearch.domain.grantReadWrite(lambda);
    });
  }
}
