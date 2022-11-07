import React from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';

type ErrorMessageProps = {
  header?: string;
  message?: string;
};

const errorMessage = ({
  header = 'Oops!',
  message = 'See if refreshing the browser will resolve your issue.',
}: ErrorMessageProps): JSX.Element => (
  <Box mt={4}>
    <Alert status="error">
      <AlertIcon />
      <AlertTitle mr={2}>{header}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  </Box>
);

export default errorMessage;
