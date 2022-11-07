import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Box,
  FormErrorMessage,
  Input,
  FormLabel,
  FormControl,
  Button,
  Heading,
  Text,
  HStack,
  Container,
} from '@chakra-ui/react';
import { FaUser, FaCheck } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import { getSnapshot } from 'mobx-state-tree';

import { useUserStore } from '../../models/users/UserStore';
import { navigateFn } from '../../helpers/routing';
import { UpdateUserConfigForm, useUpdateUserConfigForm } from '../../models/forms/UpdateUserConfig';
import { displayError, displaySuccess } from '../../helpers/notification';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { UserSnapshotOut } from '../../models/users/User';

const UserProfileEdit = observer(() => {
  const [processing, setProcessing] = useState(false);
  const userStore = useUserStore();
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  userStore.load();
  const user = getSnapshot(userStore.user!) as unknown as UserSnapshotOut;

  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useUpdateUserConfigForm({
    email: user.email!,
    firstName: user.firstName!,
    lastName: user.lastName!,
    userRoles: user.userRoles!,
    username: user.username,
    enabled: true,
    claims: user.claims,
  });

  const renderTitle = () => (
    <Heading as="h3" mb={5} size="md">
      <HStack>
        <FaUser />
        <Text>User Profile</Text>
      </HStack>
    </Heading>
  );

  const handleFormSubmission = async (values: UpdateUserConfigForm) => {
    setProcessing(true);
    const { firstName, lastName, email } = values;
    const userToUpdate = { ...user, firstName, lastName, email, claims: {} };

    try {
      // allow updating only firstName, lastName and email in case self-service update (i.e., adminMode = false)
      await userStore.updateUser(userToUpdate);
      reset();
      displaySuccess('Updated user successfully');
    } catch (error) {
      displayError(error as Error);
    }
    setProcessing(false);
    backToProfile();
  };

  const backToProfile = () => navigate('/user/view');

  const renderEditView = () => (
    <form onSubmit={handleSubmit(handleFormSubmission)}>
      <FormControl isInvalid={!!errors.firstName} mt={5} isDisabled={processing}>
        <FormLabel htmlFor="firstName">First Name</FormLabel>
        <Input id="firstName" placeholder="Type first name of the user" {...register('firstName')} />
        <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.lastName} mt={5} isDisabled={processing}>
        <FormLabel htmlFor="lastName">Last Name</FormLabel>
        <Input id="lastName" placeholder="Type last name of the user" {...register('lastName')} />
        <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.email} mt={5} isDisabled={processing}>
        <FormLabel htmlFor="email">Email</FormLabel>
        <Input id="email" placeholder="Type email address for the user" {...register('email')} />
        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
      </FormControl>

      <Box mt={5}>
        <Button leftIcon={<FaCheck />} colorScheme="blue" isLoading={processing} type="submit">
          Save
        </Button>
        <Button
          leftIcon={<ImCross />}
          colorScheme="blue"
          variant="outline"
          ml={3}
          disabled={processing}
          onClick={backToProfile}
        >
          Cancel
        </Button>
      </Box>
    </form>
  );

  const content = user ? renderEditView() : <BasicProgressPlaceholder segmentCount={3} />;

  return (
    <Container maxW="container.md" pt={5}>
      {renderTitle()}
      {content}
    </Container>
  );
});

export default UserProfileEdit;
