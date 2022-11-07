import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import { runInAction } from 'mobx';
import { FormErrorMessage, FormLabel, FormControl, Input, Button, Box, Switch } from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { FaCheck } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import { Controller } from 'react-hook-form';

import { displaySuccess, displayError } from '../../helpers/notification';

import Stores from '../../models/Stores';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { swallowError } from '../../helpers/utils';
import { navigateFn } from '../../helpers/routing';
import { AddUserForm, useAddUserForm } from '../../models/forms/AddUserForm';
import { UserFormRules } from '../../models/forms/UserForm';
import { useUserStore } from '../../models/users/UserStore';
import { useUsersStore } from '../../models/users/UsersStore';
import { useUserRolesStore } from '../../models/user-roles/UserRolesStore';
import ErrorBox from '../helpers/ErrorBox';

const AddSingleUser = observer(() => {
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  let stores!: Stores;

  const userStore = useUserStore();
  const usersStore = useUsersStore();
  const userRolesStore = useUserRolesStore();

  runInAction(() => {
    stores = new Stores([userStore, usersStore, userRolesStore]);
    swallowError(stores.load());
  });

  const {
    control,
    setValue,
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useAddUserForm();

  const getUserRoleOptions = () => userRolesStore.dropdownOptions.map((o) => ({ label: o.text, value: o.value }));
  const getCurrentOptions = (fieldValue: string[]) =>
    fieldValue?.map((role) => getUserRoleOptions().find((dropdownRole) => dropdownRole.value === role)) ?? [];

  const handleCancel = () => navigate('/users');

  const handleFormSubmission = async (values: AddUserForm) => {
    try {
      await usersStore.addUser(values);
      reset();
      displaySuccess('Added user successfully');

      navigate('/users');
    } catch (error) {
      displayError(error as Error);
    }
  };

  const renderMain = () => {
    const userRoleOptions = getUserRoleOptions();

    return (
      <form onSubmit={handleSubmit(handleFormSubmission)}>
        <FormControl isInvalid={!!errors.username} isDisabled={isSubmitting}>
          <FormLabel htmlFor="username">User Name</FormLabel>
          <Input
            id="username"
            placeholder="Type a unique username for the user"
            {...register('username', UserFormRules.username)}
          />
          <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.email} mt={5} isDisabled={isSubmitting}>
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
            Add User
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
  } else if (stores.loading) {
    content = <BasicProgressPlaceholder />;
  } else if (stores.ready) {
    content = renderMain();
  } else {
    content = null;
  }

  return content;
});

export default AddSingleUser;
