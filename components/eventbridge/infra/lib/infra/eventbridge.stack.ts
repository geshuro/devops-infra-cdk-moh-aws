import { Inject, Injectable } from '@nestjs/common';
import { Construct } from '@aws-cdk/core';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@aws-cdk/aws-events';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { CoreConfig, CoreStage, Stack } from '@aws-ee/core-infra';
import { ApiStack } from '@aws-ee/core-rest-api-infra';

@Injectable()
export class EventbridgeStack extends Stack {
  public readonly eventBusName: string;

  constructor(@Inject(CoreStage) stage: Construct, apiStack: ApiStack, configService: ConfigService) {
    const coreConfig = configService.get<CoreConfig>(CoreConfig.KEY)!;
    super(stage, 'eventbridge', {
      description: 'Eventbridge resources',
      envName: coreConfig.envName,
      solutionName: coreConfig.solutionName,
    });

    this.eventBusName = `${coreConfig.globalNamespace}-solution-bus`;

    new EventBus(this, 'solutionEventBus', {
      eventBusName: this.eventBusName,
    });

    apiStack.apiHandler.addEnvironment('APP_SOLUTION_EVENT_BUS_NAME', this.eventBusName);
    apiStack.apiHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ['events:PutRule', 'events:DeleteRule', 'events:PutTargets', 'events:RemoveTargets'],
        resources: [
          apiStack.formatArn({
            service: 'events',
            resource: 'rule',
            resourceName: `${this.eventBusName}/*`,
          }),
        ],
      }),
    );
  }
}
