import { Construct } from '@aws-cdk/core';

import { Pass } from '@aws-cdk/aws-stepfunctions';

interface ScreeningProps {
  id: string;
  mlResultsBucketName: string;
  mlInputBucketName: string;
  screeningStatus: 'SCREENING1_WIP' | 'SCREENING2_WIP';
}

export class AddScreeningProps extends Pass {
  constructor(readonly scope: Construct, props: ScreeningProps) {
    super(scope, props.id, {
      parameters: {
        ...props,
        'screeningId.$': '$.screeningQuestions.id.S',
        'questions.$': 'States.Array($.screeningQuestions.picoP.S, $.screeningQuestions.picoI.S, $.screeningQuestions.picoC.S, $.screeningQuestions.picoO.S)'
      },
      resultPath: '$.screeningProps',
      outputPath: '$.screeningProps'
    });
  }
}
