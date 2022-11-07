import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, BoxProps, Tag, TagProps } from '@chakra-ui/react';

type UserLabelsProps = BoxProps &
  TagProps & {
    users: User[];
  };

type User = {
  username?: string;
  firstName?: string;
  lastName?: string;
  unknown?: boolean;
  email?: string;
};

const UserLabels = ({ users, ...boxProps }: UserLabelsProps) => (
  <Box {...boxProps}>
    {users.map((user) => (
      <Tag key={user.username} colorScheme={boxProps.colorScheme} image>
        {user.firstName}
        {user.lastName}
        {user.unknown && `${user.username}??`}
        {!user.unknown && (user.email || user.username)}
      </Tag>
    ))}
  </Box>
);

export default observer(UserLabels);
