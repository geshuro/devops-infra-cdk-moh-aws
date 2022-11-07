import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { Heading, HStack, Text, Container, Tr, Td, Table, Tbody, Tag, Button, Flex } from '@chakra-ui/react';
import { FaUser, FaTrash, FaPlay, FaStop, FaPen, FaArrowLeft } from 'react-icons/fa';

import { useUsersStore } from '../../models/users/UsersStore';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { displayError } from '../../helpers/notification';
import { navigateFn } from '../../helpers/routing';

const UserDetails = observer(() => {
  const { id } = useParams<{ id: string }>();
  const [processing, setProcessing] = useState(false);
  const usersStore = useUsersStore();
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  useEffect(() => {
    usersStore.loadUser({ id } as any);
  });

  const user = usersStore.users.get(id)!;

  const renderTitle = () => (
    <Heading as="h3" mb={5} size="md">
      <HStack>
        <FaUser />
        <Text>User Details</Text>
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
            <Tr>
              <Td>Access</Td>
              <Td>
                {user.enabled ? (
                  <Tag colorScheme="green">
                    <i className="check circle outline icon" />
                    Enabled
                  </Tag>
                ) : (
                  <Tag colorScheme="red">
                    <i className="circle icon" />
                    Blocked
                  </Tag>
                )}
              </Td>
            </Tr>
          </Tbody>
        </Table>
        {renderDetailViewButtons()}
      </>
    );
  };

  const handleApproveDisapproveClick = async (enabled: boolean) => {
    setProcessing(true);
    try {
      await usersStore.updateUser({ ...user, enabled, claims: {} });

      // reload the current user's store after user updates, in case the currently
      // logged in user is updated
      // await userStore.load();
    } catch (err) {
      displayError(err as Error);
    }
    setProcessing(false);
  };

  const handleEditClick = () => navigate(`/users/edit/${id}`);

  const backToList = () => navigate('/users');

  const handleDeleteClick = async () => {
    setProcessing(true);
    setTimeout(async () => {
      try {
        await usersStore.deleteUser(user);
      } catch (error) {
        displayError(error as Error);
      }
    });
    backToList();
    setProcessing(false);
  };

  const renderDetailViewButtons = () => {
    const cancelButton = (
      <Button
        leftIcon={<FaArrowLeft />}
        variant="outline"
        colorScheme="blue"
        onClick={backToList}
        isDisabled={processing}
      >
        Back to list
      </Button>
    );
    const deleteButton = (
      <Button leftIcon={<FaTrash />} colorScheme="red" onClick={handleDeleteClick} isDisabled={processing}>
        Delete
      </Button>
    );

    const activeButton = !user.enabled ? (
      <Button
        leftIcon={<FaPlay />}
        colorScheme="green"
        onClick={() => handleApproveDisapproveClick(true)}
        isDisabled={processing}
      >
        Unblock
      </Button>
    ) : (
      ''
    );

    const deactivateButton = user.enabled ? (
      <Button
        leftIcon={<FaStop />}
        colorScheme="yellow"
        onClick={() => handleApproveDisapproveClick(false)}
        isDisabled={processing}
      >
        Block access
      </Button>
    ) : (
      ''
    );

    const editButton = (
      <Button leftIcon={<FaPen />} colorScheme="blue" onClick={handleEditClick} isDisabled={processing}>
        Edit
      </Button>
    );

    return (
      <Flex justify="space-between">
        {cancelButton}
        <HStack>
          {deleteButton}
          {deactivateButton}
          {activeButton}
          {editButton}
        </HStack>
      </Flex>
    );
  };

  const content = user ? renderContent() : <BasicProgressPlaceholder segmentCount={3} />;

  return (
    <Container maxW="container.md" pt={5}>
      {renderTitle()}
      {content}
    </Container>
  );
});

export default UserDetails;
