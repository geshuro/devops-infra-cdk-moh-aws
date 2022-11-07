/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import React, { useEffect } from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Container, Heading, List, ListItem, Text, ListIcon, HStack, Skeleton } from '@chakra-ui/react';
import { swallowError, isStoreLoading, isStoreError, isStoreEmpty, ErrorBox } from '@aws-ee/core-ui';
import { FaHandSpock, FaCoffee, FaCheckCircle } from 'react-icons/fa';
import { useHelloStore } from '../../models/hello/HelloStore';

const HelloPage = observer(() => {
  const store = useHelloStore();

  runInAction(() => {
    swallowError(store.load());
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  });

  // Use this to navigate to other pages
  // const navigate = navigateFn({ history: useHistory(), location: useLocation() });
  // navigate('/my-cool-page')

  const renderContent = () => {
    const list = store.list;
    return (
      <List>
        {_.map(list, (item, index) => (
          <ListItem key={index}>
            <ListIcon as={FaCheckCircle} color="green.500" />
            {item.message}
          </ListItem>
        ))}
      </List>
    );
  };

  const renderEmpty = () => (
    <>
      <Heading size="md">
        <FaCoffee />
        Hello
      </Heading>
      <Text>Sorry, no hello messages to display</Text>
    </>
  );

  const renderTitle = () => (
    <Heading as="h3" mb={5} size="md">
      <HStack>
        <FaHandSpock />
        <Text>Hello</Text>
      </HStack>
    </Heading>
  );

  // Render loading, error, or tab content
  let content;
  if (isStoreError(store)) {
    content = <ErrorBox error={store.error!} className="mt3 mr0 ml0" />;
  } else if (isStoreEmpty(store)) {
    content = renderEmpty();
  } else {
    content = renderContent();
  }

  return (
    <Container maxW="container.lg" pt={5}>
      {renderTitle()}
      <Skeleton height="100px" isLoaded={!isStoreLoading(store)}>
        {content}
      </Skeleton>
    </Container>
  );
});

export default HelloPage;
