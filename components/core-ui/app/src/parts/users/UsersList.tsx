import React, { useEffect } from 'react';
import { HStack, Text, Heading, Button, Tag } from '@chakra-ui/react';
import { useHistory, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import ReactTable, { Filter } from 'react-table';
import { FaUsers } from 'react-icons/fa';

import { swallowError } from '../../helpers/utils';
import { isStoreError, isStoreLoading, isStoreReady } from '../../models/BaseStore';
import { navigateFn } from '../../helpers/routing';
import ErrorBox from '../helpers/ErrorBox';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { useUsersStore } from '../../models/users/UsersStore';

const UsersList = observer(() => {
  const usersStore = useUsersStore();

  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  runInAction(() => {
    swallowError(usersStore.load());
  });

  useEffect(() => {
    usersStore.changeTickPeriod(5 * 60 * 1000);
    usersStore.startHeartbeat();
    return () => {
      usersStore.stopHeartbeat();
    };
  });

  // TODO: Convert these to normal link buttons!
  const handleAddCognitoUser = () => navigate('/users/add/cognito');

  const handleAddUser = () => navigate('/users/add');

  const handleViewUser = (uid: string) => navigate(`/users/details/${uid}`);

  const renderHeader = () => (
    <HStack width="full" justify="space-between" mb={5}>
      <Heading as="h3" mb={5} size="md">
        <HStack>
          <FaUsers />
          <Text>Users</Text>
          <Text>{renderTotal()}</Text>
        </HStack>
      </Heading>
      <HStack>
        <Button variant="outline" colorScheme="blue" size="sm" mr={2} onClick={handleAddCognitoUser}>
          Add Cognito User
        </Button>
        <Button variant="outline" colorScheme="blue" size="sm" onClick={handleAddUser}>
          Add Federated User
        </Button>
      </HStack>
    </HStack>
  );

  const renderTotal = () => {
    if (isStoreError(usersStore) || isStoreLoading(usersStore)) return null;
    const count = usersStore.list.length;

    return (
      <Tag colorScheme="gray" borderRadius="full">
        {count}
      </Tag>
    );
  };

  const renderUsers = () => {
    // Read "this.mapOfUsersBeingEdited" in the "render" method here
    // The usersBeingEditedMap is then used in the ReactTable
    // If we directly use this.mapOfUsersBeingEdited in the ReactTable's cell method, MobX does not
    // realize that it is being used in the outer component's "render" method's scope
    // Due to this, MobX does not re-render the component when observable state changes.
    // To make this work correctly, we need to access "this.mapOfUsersBeingEdited" out side of ReactTable once

    const usersList = usersStore.list;
    const pageSize = usersList.length;
    const showPagination = usersList.length > pageSize;

    return (
      <ReactTable
        data={usersList}
        defaultSorted={[{ id: 'lastName', desc: true }]}
        showPagination={showPagination}
        defaultPageSize={pageSize}
        className="-striped -highlight"
        filterable
        defaultFilterMethod={(filter, row) => {
          const columnValue = String(row[filter.id]).toLowerCase();
          const filterValue = filter.value.toLowerCase();
          return columnValue.indexOf(filterValue) >= 0;
        }}
        columns={[
          {
            Header: 'Username',
            accessor: 'username',
          },
          {
            Header: 'Email',
            accessor: 'email',
          },
          {
            Header: 'Access',
            accessor: 'enabled',
            width: 100,
            Cell: (row) => {
              const user = row.original;
              let label = null;
              if (user.enabled) {
                label = (
                  <span>
                    <Tag colorScheme="green">
                      <i className="check circle outline icon" />
                      Enabled
                    </Tag>
                  </span>
                );
              } else {
                label = (
                  <span>
                    <Tag colorScheme="red">
                      <i className="circle icon" />
                      Blocked
                    </Tag>
                  </span>
                );
              }
              return label;
            },
            filterMethod: (filter: Filter, row: any) => {
              if (row._original.status.indexOf(filter.value.toLowerCase()) >= 0) {
                return true;
              }
              return false;
            },
          },
          {
            Header: '',
            filterable: false,
            Cell: (cell) => {
              const user = cell.original;
              return (
                <div style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <Button
                    colorScheme="blue"
                    size="xs"
                    onClick={() => {
                      handleViewUser(user.uid);
                    }}
                  >
                    View User Detail
                  </Button>
                </div>
              );
            },
          },
        ]}
      />
    );
  };

  const renderMain = () => <>{renderUsers()}</>;

  let content = null;
  if (isStoreError(usersStore)) {
    content = <ErrorBox error={usersStore.error!} />;
  } else if (isStoreLoading(usersStore)) {
    content = <BasicProgressPlaceholder segmentCount={3} />;
  } else if (isStoreReady(usersStore)) {
    content = renderMain();
  }

  return (
    <>
      {renderHeader()}
      {content}
    </>
  );
});

export default UsersList;
