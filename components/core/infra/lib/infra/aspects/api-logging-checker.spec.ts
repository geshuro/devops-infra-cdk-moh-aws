import { SynthUtils } from '@aws-cdk/assert';
import { Aspects, Stack } from '@aws-cdk/core';
import { LogGroup } from '@aws-cdk/aws-logs';
import { RestApi, LogGroupLogDestination } from '@aws-cdk/aws-apigateway';
import { assemblyMessagesContaining } from '@aws-ee/testing';
import { ApiLoggingChecker } from './api-logging-checker';

describe('API logging aspect', () => {
  test('should add an error message for APIs without logging', () => {
    // GIVEN
    const stack = new Stack();
    const api = new RestApi(stack, 'RestApi');
    const resource = api.root.addResource('api');
    resource.addMethod('ANY');

    // WHEN
    Aspects.of(stack).add(new ApiLoggingChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/RestApi/DeploymentStage.prod/Resource',
          level: 'warning',
          message: 'API stage logging should be enabled.',
        },
      ]),
    );
  });

  test('should not add an error message for APIs with logging', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = LogGroup.fromLogGroupName(stack, 'LogGroup', 'LogGroup');
    const api = new RestApi(stack, 'StateMachine', {
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(logGroup),
      },
    });
    const resource = api.root.addResource('api');
    resource.addMethod('ANY');

    // WHEN
    Aspects.of(stack).add(new ApiLoggingChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toHaveLength(0);
  });
});
