import { Stack as CdkStack, StackProps as CdkStackProps, Construct, DefaultStackSynthesizer } from '@aws-cdk/core';
import { cdkQualifier } from './cdk-qualifier';

export interface StackProps extends CdkStackProps {
  envName: string;
  solutionName: string;
  description: string;
}

/**
 * All CDK stacks in the solution should inherit from this base class
 */
export class Stack extends CdkStack {
  constructor(scope: Construct, id: string, props: StackProps) {
    const stackProps: CdkStackProps = {
      ...props,
      synthesizer: new DefaultStackSynthesizer({
        qualifier: cdkQualifier(`${props.envName}-${props.solutionName}`),
      }),
    };
    super(scope, id, stackProps);
  }
}
