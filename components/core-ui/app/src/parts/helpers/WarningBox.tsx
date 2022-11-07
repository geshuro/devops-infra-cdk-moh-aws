import _ from 'lodash';
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, BoxProps, Alert, AlertIcon, AlertTitle, AlertDescription, Button } from '@chakra-ui/react';

type Warning = string | { message: string };

type WarningBoxProps = BoxProps & {
  warning: Warning;
  onRetry?: () => Promise<void>;
};

const WarningBox = observer(({ warning, onRetry, ...boxProps }: WarningBoxProps) => {
  const handleRetry = () => {
    Promise.resolve()
      .then(() => onRetry!())
      .catch(() => {
        /* ignore */
      });
  };

  const defaultMessage = 'Hmm... something is needing your attention';
  const rawMessage = warning || defaultMessage;
  const message = typeof rawMessage === 'string' ? rawMessage : rawMessage?.message ?? defaultMessage;
  const shouldRetry = !!onRetry;

  return (
    <Box {...boxProps}>
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle mr={2}>Warning</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        {shouldRetry && (
          <Button ml={3} size="xs" colorScheme="orange" onClick={handleRetry}>
            Retry
          </Button>
        )}
      </Alert>
    </Box>
  );
});

export default WarningBox;
