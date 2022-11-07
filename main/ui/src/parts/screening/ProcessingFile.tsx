import React from 'react';
import { Progress } from '@chakra-ui/react';

export function ProcessingFile(props: { onCancel: () => void }) {
  React.useEffect(() => () => {
    props.onCancel();
  });

  return <Progress isIndeterminate size="lg" />;
}
