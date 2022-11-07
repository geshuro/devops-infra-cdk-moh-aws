import { SynthUtils } from '@aws-cdk/assert';
import { Aspects, Stack } from '@aws-cdk/core';
import { LogGroup } from '@aws-cdk/aws-logs';
import { StateMachine, Pass } from '@aws-cdk/aws-stepfunctions';
import { assemblyMessagesContaining } from '@aws-ee/testing';
import { StateMachineLoggingChecker } from './statemachine-logging-checker';

describe('state machine logging aspect', () => {
  test('should add an error message for state machines without logging', () => {
    // GIVEN
    const stack = new Stack();
    new StateMachine(stack, 'StateMachine', {
      definition: new Pass(stack, 'Pass'),
    });

    // WHEN
    Aspects.of(stack).add(new StateMachineLoggingChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toEqual(
      assemblyMessagesContaining([
        {
          id: '/Default/StateMachine/Resource',
          level: 'warning',
          message: 'State machine logging should be enabled.',
        },
      ]),
    );
  });

  test('should not add an error message for state machines with logging', () => {
    // GIVEN
    const stack = new Stack();
    const logGroup = LogGroup.fromLogGroupName(stack, 'LogGroup', 'LogGroup');
    new StateMachine(stack, 'StateMachine', {
      definition: new Pass(stack, 'Pass'),
      logs: { destination: logGroup },
    });

    // WHEN
    Aspects.of(stack).add(new StateMachineLoggingChecker());

    // THEN
    const assembly = SynthUtils.synthesize(stack);

    expect(assembly.messages).toHaveLength(0);
  });
});
