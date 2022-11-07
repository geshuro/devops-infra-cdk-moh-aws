import React from 'react';
import { Button, Box, Text } from '@chakra-ui/react';
import { Decision } from '../../../helpers/api';

/*
// TODO: share function wrapper type with `withPageNumberReset`
const withLoading = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
  const [isLoading, setLoading] = React.useState(false);
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    setLoading(true);
    return fn(...args)
      .then((promiseResult) => {
        setLoading(false);
        return promiseResult;
      })
      .catch((e) => {
        setLoading(false);
        return e;
      });
  };
};
*/

export interface DecisionMakingProps {
  articleId: string;
  isLoading: boolean;
  makeDecision: (articleId: string, decision: 'approve' | 'reject' | 'reset') => Promise<void>;
}

export const DocumentDecisionButtons = (
  props: DecisionMakingProps & { decisions: Decision[]; changeDisabled?: boolean },
) => {
  const w = '150px';

  const renderedDecisions = props.decisions.map((d) => (
    <Text>
      <b>{d.decision}</b> by {d.madeBy}
    </Text>
  ));

  if (props.changeDisabled) {
    return <Box w={w}>{renderedDecisions}</Box>;
  }

  const neutral = (
    <Box w={w}>
      <Button
        size="sm"
        colorScheme="green"
        disabled={props.isLoading}
        onClick={() => props.makeDecision(props.articleId, 'approve')}
      >
        Approve
      </Button>
      <br />
      <Button
        mt={3}
        size="sm"
        colorScheme="red"
        disabled={props.isLoading}
        onClick={() => props.makeDecision(props.articleId, 'reject')}
      >
        Reject
      </Button>
    </Box>
  );
  const alreadyDecided = (
    <Box w={w}>
      {renderedDecisions}
      <Button
        mt={3}
        size="sm"
        colorScheme="blue"
        disabled={props.isLoading}
        onClick={() => props.makeDecision(props.articleId, 'reset')}
      >
        Change decision
      </Button>
    </Box>
  );

  if (props.decisions.length === 0) {
    return neutral;
  }
  return alreadyDecided;
};
