import _ from 'lodash';
import React from 'react';
import { Skeleton, Stack } from '@chakra-ui/react';

type BasicProgressPlaceholderProps = {
  segmentCount?: number;
  className?: string;
};

const Component = ({ segmentCount = 1, className }: BasicProgressPlaceholderProps): JSX.Element => {
  const segment = (index: number) => (
    <Stack key={index}>
      <Skeleton height="20px" />
      <Skeleton height="20px" />
    </Stack>
  );

  return <div className={className}>{_.map(_.times(segmentCount, String), (index: number) => segment(index))}</div>;
};

export default Component;
