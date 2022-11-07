import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import { Heading, HStack, Text, Container, Tr, Td, Table, Tbody, Tag, Button, Flex } from '@chakra-ui/react';
import { FaUser, FaPen } from 'react-icons/fa';

import { useUserStore } from '../../models/users/UserStore';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { navigateFn } from '../../helpers/routing';

const UserProfileDetails = observer(() => {
  const userStore = useUserStore();
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  userStore.load();

  const user = userStore.user!;

  const handleEditClick = () => navigate(`/user/edit`);

  const renderTitle = () => (
    <Heading as="h3" mb={5} size="md">
      <HStack>
        <FaUser />
        <Text>User Profile</Text>
      </HStack>
    </Heading>
  );

  const renderContent = () => {
    const toRow = (fieldLabel: string, value: null | string | string[]) => {
      let displayValue;
      if (Array.isArray(value)) {
        displayValue = value.map((v, k) => (
          <Tag mr={1} key={k}>
            {v}
          </Tag>
        ));
      } else {
        displayValue = <Text fontWeight="bold">{value as string}</Text>;
      }
      return (
        <Tr>
          <Td>{fieldLabel}</Td>
          <Td>{displayValue}</Td>
        </Tr>
      );
    };

    return (
      <>
        <Table variant="simple" mt={3} mb={3}>
          <Tbody>
            {toRow('Username', user.username)}
            {toRow('First Name', user.firstName)}
            {toRow('Last Name', user.lastName)}
            {toRow('Email', user.email)}
            {toRow('User Roles', user.userRoles)}
          </Tbody>
        </Table>
        {renderDetailViewButtons()}
      </>
    );
  };

  const renderDetailViewButtons = () => {
    const editButton = (
      <Button leftIcon={<FaPen />} colorScheme="blue" onClick={handleEditClick}>
        Edit
      </Button>
    );

    return <Flex justify="space-between">{editButton}</Flex>;
  };

  const content = user ? renderContent() : <BasicProgressPlaceholder segmentCount={3} />;

  return (
    <Container maxW="container.md" pt={5}>
      {renderTitle()}
      {content}
    </Container>
  );
});

export default UserProfileDetails;
