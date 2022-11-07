import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ChakraProvider, Button, Text, Image, Heading, Box, Flex, Stack, useColorModeValue } from '@chakra-ui/react';
import i18n from 'roddeh-i18n';

import keys from '../i18n';
import { displayError } from '../helpers/notification';
import { branding } from '../helpers/settings';

import { useAuthenticationStore } from '../models/authentication/Authentication';
import { useAssets } from '../helpers/utils';

const Login = observer(() => {
  const authentication = useAuthenticationStore();
  const assets = useAssets();

  const [loading, setLoading] = useState(false);

  const handleLogin = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();

    // Login is always a redirect, so we leave `loading` as true unless there is an error
    setLoading(true);

    Promise.resolve()
      .then(() => authentication.login())
      .catch((err) => {
        displayError(err);
        setLoading(false);
      });
  };

  const renderBrandingLogo = <Image boxSize={100} src={assets.images.loginImage} />;

  return (
    <ChakraProvider>
      <Flex minH={'100vh'} align={'center'} justify={'center'} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
          <Box rounded={'lg'} bg={useColorModeValue('white', 'gray.700')} boxShadow={'lg'} p={8}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Stack align={'center'} mb={4}>
                {renderBrandingLogo}
                <Heading fontSize={'xl'}>{branding.login.title}</Heading>
                <Text fontSize={'sm'} color={'gray.600'}>
                  {branding.login.subtitle}
                </Text>
              </Stack>
              <Stack spacing={4}>
                <Stack spacing={10}>
                  <Button
                    data-testid="login"
                    bg={'blue.400'}
                    color={'white'}
                    type="submit"
                    _hover={{
                      bg: 'blue.500',
                    }}
                    onClick={handleLogin}
                    isLoading={loading}
                  >
                    {i18n(keys.LOGIN)}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Flex>
    </ChakraProvider>
  );
});

export default Login;
