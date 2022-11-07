import React from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Container,
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  Button,
  Box,
  Heading,
  HStack,
  Text,
  Switch,
} from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { Controller } from 'react-hook-form';
import { FaUser, FaCheck } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';

import { displaySuccess, displayError } from '../../helpers/notification';
import Stores from '../../models/Stores';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { swallowError } from '../../helpers/utils';
import ErrorBox from '../helpers/ErrorBox';
import { navigateFn } from '../../helpers/routing';
import { isStoreLoading, isStoreReady } from '../../models/BaseStore';
import { AddLocalUserForm, useAddLocalUserForm } from '../../models/forms/AddLocalUserForm';
import { UserFormRules } from '../../models/forms/UserForm';
import { useUserRolesStore } from '../../models/user-roles/UserRolesStore';
import { useUsersStore } from '../../models/users/UsersStore';

const AddSingleCognitoUser = observer(() => {
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });
  const usersStore = useUsersStore();
  const userRolesStore = useUserRolesStore();
  let stores!: Stores;

  const {
    control,
    setValue,
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useAddLocalUserForm();

  runInAction(() => {
    stores = new Stores([userRolesStore]);
    swallowError(stores.load());
  });

  const getUserRoleOptions = () => userRolesStore.dropdownOptions.map((o) => ({ label: o.text, value: o.value }));
  const getCurrentOptions = (fieldValue: string[]) =>
    fieldValue?.map((role) => getUserRoleOptions().find((dropdownRole) => dropdownRole.value === role)) ?? [];

  const gotoUsersList = () => navigate('/users');

  const handleCancel = () => gotoUsersList();

  const handleFormSubmission = async (values: AddLocalUserForm) => {
    try {
      await usersStore.addUser({
        ...values,
        username: values.email,
      });

      reset();
      displaySuccess('Added user successfully');

      gotoUsersList();
    } catch (error) {
      displayError(error as Error);
    }
  };

  const renderTitle = () => (
    <Heading as="h3" mb={5} size="md">
      <HStack>
        <FaUser />
        <Text>Add Cognito User</Text>
      </HStack>
    </Heading>
  );

  const renderContent = () => {
    const userRoleOptions = getUserRoleOptions();

    return (
      <form onSubmit={handleSubmit(handleFormSubmission)}>
        <FormControl isInvalid={!!errors.email} isDisabled={isSubmitting}>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input id="email" placeholder="Type email address for the user" {...register('email', UserFormRules.email)} />
          <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.firstName} mt={5} isDisabled={isSubmitting}>
          <FormLabel htmlFor="firstName">First Name</FormLabel>
          <Input
            id="firstName"
            placeholder="Type first name of the user"
            {...register('firstName', UserFormRules.firstName)}
          />
          <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.lastName} mt={5} isDisabled={isSubmitting}>
          <FormLabel htmlFor="lastName">Last Name</FormLabel>
          <Input
            id="lastName"
            placeholder="Type last name of the user"
            {...register('lastName', UserFormRules.lastName)}
          />
          <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.userRoles} mt={5} isDisabled={isSubmitting}>
          <FormLabel htmlFor="userRoles">User Roles</FormLabel>
          <Controller
            name="userRoles"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select user's roles"
                isMulti
                {...field}
                options={userRoleOptions}
                value={getCurrentOptions(field?.value)}
                onChange={(value: { value: string }[]) => {
                  setValue('userRoles', value?.map((v) => v.value) ?? [], { shouldDirty: true });
                }}
              />
            )}
          />
          <FormErrorMessage>{errors.userRoles?.map((e) => e.message).join()}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.enabled} display="flex" alignItems="center" isDisabled={isSubmitting} mt={5}>
          <FormLabel htmlFor="enabled" mt={1}>
            User can log into the solution?
          </FormLabel>
          <Switch id="enabled" {...register('enabled')} />
        </FormControl>

        <Box mt={5}>
          <Button leftIcon={<FaCheck />} colorScheme="blue" type="submit" isLoading={isSubmitting}>
            Add Cognito User
          </Button>
          <Button
            leftIcon={<ImCross />}
            colorScheme="blue"
            variant="outline"
            ml={3}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      </form>
    );
  };

  let content = null;
  if (stores.hasError) {
    content = <ErrorBox error={stores.error!} className="p0 mb3" />;
  } else if (isStoreLoading(stores)) {
    content = <BasicProgressPlaceholder />;
  } else if (isStoreReady(stores)) {
    content = renderContent();
  } else {
    content = null;
  }

  return (
    <Container maxW="container.md" pt={5}>
      {renderTitle()}
      {content}
    </Container>
  );
});

export default AddSingleCognitoUser;
