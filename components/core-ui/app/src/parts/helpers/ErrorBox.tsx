import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, BoxProps, Alert, AlertIcon, AlertTitle, AlertDescription, Button } from '@chakra-ui/react';

type ErrorMessage = string | { message: string };

type ErrorBoxProps = BoxProps & {
  error: ErrorMessage;
  onRetry?: () => Promise<void>;
};

const ErrorBox = observer(({ error, onRetry, ...boxProps }: ErrorBoxProps) => {
  const handleRetry = () => {
    Promise.resolve()
      .then(() => onRetry!())
      .catch(() => {
        /* ignore */
      });
  };

  const defaultMessage = 'Hmm... something went wrong';
  const rawMessage = error || defaultMessage;
  const message = typeof rawMessage === 'string' ? rawMessage : rawMessage?.message ?? defaultMessage;
  const shouldRetry = !!onRetry;

  return (
    <Box {...boxProps}>
      <Alert status="error">
        <AlertIcon />
        <AlertTitle mr={2}>A problem was encountered</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        {shouldRetry && (
          <Button ml={3} size="xs" colorScheme="red" onClick={handleRetry}>
            Retry
          </Button>
        )}
      </Alert>
    </Box>
  );
});

export default ErrorBox;
