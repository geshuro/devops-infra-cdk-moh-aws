import { Annotations, IConstruct, IResolvable, Tokenization } from '@aws-cdk/core';

export interface CheckResolvableProps<T> {
  config: T | IResolvable | undefined;
  resource: IConstruct;
  message: string;
  severity: 'info' | 'warning' | 'error';
  passCondition: (config: T | undefined) => boolean;
}

export function checkResolvable<T>(props: CheckResolvableProps<T>): void {
  if (Tokenization.isResolvable(props.config)) {
    Annotations.of(props.resource).addInfo(`The condition "${props.message}" could not be verified.`);
    return;
  }
  if (!props.passCondition(props.config)) {
    switch (props.severity) {
      case 'warning': {
        Annotations.of(props.resource).addWarning(props.message);
        return;
      }
      case 'error': {
        Annotations.of(props.resource).addError(props.message);
        return;
      }
      case 'info':
      default: {
        Annotations.of(props.resource).addInfo(props.message);
      }
    }
  }
}
