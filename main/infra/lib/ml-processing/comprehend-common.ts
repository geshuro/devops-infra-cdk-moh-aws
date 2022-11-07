import {
  StepFunctionsTaskConfig,
  TaskProps,
} from '@aws-cdk/aws-stepfunctions';

// TODO: use separate p, i, c and o rather than PICO question, changing the other code here to also use pico rather than question
export const getTaskProps = (
  parameters: {
    [name: string]: string;
  },
  resourceArn: string,
): TaskProps => ({
  task: {
    bind: (): StepFunctionsTaskConfig => ({
      resourceArn,
    }),
  },
  parameters,
  outputPath: '$.comprehendMedical',
  resultPath: `$.comprehendMedical`,
});