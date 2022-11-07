import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { runInAction } from 'mobx';
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
  Switch,
} from '@chakra-ui/react';
import { Select } from 'chakra-react-select';
import { FaUser, FaCheck } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import { Controller } from 'react-hook-form';

import { useUsersStore } from '../../models/users/UsersStore';
import { useUserStore } from '../../models/users/UserStore';
import { navigateFn } from '../../helpers/routing';
import { UpdateUserConfigForm, useUpdateUserConfigForm } from '../../models/forms/UpdateUserConfig';
import { UserFormRules } from '../../models/forms/UserForm';
import { useUserRolesStore } from '../../models/user-roles/UserRolesStore';
import { displayError, displaySuccess } from '../../helpers/notification';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { UserSnapshotOut } from '../../models/users/User';

const UserEdit = observer(() => {
  const { id } = useParams<{ id: string }>();
  const [processing, setProcessing] = useState(false);
  const userStore = useUserStore();
  const usersStore = useUsersStore();
  const userRolesStore = useUserRolesStore();
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  runInAction(() => {
    userRolesStore.load();
    usersStore.loadUser({ id } as any);
  });

  const user = usersStore.users.get(id)! as unknown as UserSnapshotOut;

  const {
    control,
    setValue,
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
        <Text>User Details</Text>
      </HStack>
    </Heading>
  );

  const getUserRoleOptions = () => userRolesStore.dropdownOptions.map((o) => ({ label: o.text, value: o.value }));
  const getCurrentOptions = (fieldValue: string[]) =>
    fieldValue?.map((role) => getUserRoleOptions().find((dropdownRole) => dropdownRole.value === role)) ?? [];

  const handleFormSubmission = async (values: UpdateUserConfigForm) => {
    setProcessing(true);
    const { firstName, lastName, email, userRoles, enabled } = values;
    const userToUpdate = { ...user, firstName, lastName, email, userRoles, enabled, claims: {} };

    try {
      // allow updating only firstName, lastName and email in case self-service update (i.e., adminMode = false)
      await usersStore.updateUser(userToUpdate);
      reset();
      displaySuccess('Updated user successfully');

      // reload the current user's store after user updates, in case the currently
      // logged in user is updated
      await userStore.load();
    } catch (error) {
      displayError(error as Error);
    }
    setProcessing(false);
    backToList();
  };

  const backToList = () => navigate('/users');

  const renderEditView = () => {
    const userRoleOptions = getUserRoleOptions();

    return (
      <form onSubmit={handleSubmit(handleFormSubmission)}>
        <FormControl isInvalid={!!errors.firstName} mt={5} isDisabled={processing}>
          <FormLabel htmlFor="firstName">First Name</FormLabel>
          <Input
            id="firstName"
            placeholder="Type first name of the user"
            {...register('firstName', UserFormRules.firstName)}
          />
          <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.lastName} mt={5} isDisabled={processing}>
          <FormLabel htmlFor="lastName">Last Name</FormLabel>
          <Input
            id="lastName"
            placeholder="Type last name of the user"
            {...register('lastName', UserFormRules.lastName)}
          />
          <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.email} mt={5} isDisabled={processing}>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input id="email" placeholder="Type email address for the user" {...register('email', UserFormRules.email)} />
          <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.userRoles} mt={5} isDisabled={processing}>
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

        <FormControl isInvalid={!!errors.enabled} display="flex" alignItems="center" isDisabled={processing} mt={5}>
          <FormLabel htmlFor="enabled" mt={1}>
            User can log into the solution?
          </FormLabel>
          <Switch id="enabled" {...register('enabled')} />
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
            onClick={backToList}
          >
            Cancel
          </Button>
        </Box>
      </form>
    );
  };

  const content = user ? renderEditView() : <BasicProgressPlaceholder segmentCount={3} />;

  return (
    <Container maxW="container.md" pt={5}>
      {renderTitle()}
      {content}
    </Container>
  );
});

export default UserEdit;
