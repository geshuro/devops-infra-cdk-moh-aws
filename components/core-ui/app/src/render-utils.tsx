import React from 'react';
import ReactDOM from 'react-dom';
import {
  ChakraProvider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CircularProgress,
  Stack,
  Text,
  Box,
  Container,
  Flex,
} from '@chakra-ui/react';

// Render a progress message
export function renderProgress(): void {
  ReactDOM.render(
    <ChakraProvider>
      <Flex minH={'100vh'} align={'center'} justify={'center'} bg={'gray.50'}>
        <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6} align="center" alignContent="center">
          <Box
            rounded={'lg'}
            bg={'white'}
            boxShadow={'lg'}
            p={8}
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
          >
            <CircularProgress mb={1} isIndeterminate color="orange.300" size="50px" />
            <Text mt={4} mb={1} fontSize="lg">
              Loading, please wait...
            </Text>
          </Box>
        </Stack>
      </Flex>
    </ChakraProvider>,
    document.getElementById('root'),
  );
}

// Render an error message
export function renderError(err: Error): void {
  const error = err?.message ?? 'Unknown error';
  ReactDOM.render(
    <ChakraProvider>
      <Container mt="100px" centerContent={true}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            We have a problem
          </AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <p>See if refreshing the browser will resolve your issue</p>
          </AlertDescription>
        </Alert>
      </Container>
    </ChakraProvider>,
    document.getElementById('root'),
  );
}
