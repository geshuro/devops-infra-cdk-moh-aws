import React from 'react';
import { HStack, Text, Heading, Tag } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import ReactTable from 'react-table';
import { FaIdBadge } from 'react-icons/fa';

import { isStoreError, isStoreLoading } from '../../models/BaseStore';
import ErrorBox from '../helpers/ErrorBox';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { useUserRolesStore } from '../../models/user-roles/UserRolesStore';
import { UserRole } from '../../models/user-roles/UserRole';

const RolesList = observer(() => {
  const store = useUserRolesStore();

  const renderTotal = () => (
    <Tag colorScheme="gray" borderRadius="full">
      {store.list.length}
    </Tag>
  );

  const renderHeader = () => (
    <HStack width="full" justify="space-between" mb={5}>
      <Heading as="h3" mb={5} size="md">
        <HStack>
          <FaIdBadge />
          <Text>User Roles</Text>
          <Text>{renderTotal()}</Text>
        </HStack>
      </Heading>
    </HStack>
  );

  const renderMain = () => {
    const userRolesData = store.list;
    const pageSize = userRolesData.length;
    const showPagination = userRolesData.length > pageSize;
    return (
      <div>
        <ReactTable
          data={userRolesData}
          showPagination={showPagination}
          defaultPageSize={pageSize}
          className="-striped -highlight"
          filterable
          defaultFilterMethod={(filter, row: UserRole) => {
            const columnValue = String((row as any)[filter.id]).toLowerCase();
            const filterValue = filter.value.toLowerCase();
            return columnValue.indexOf(filterValue) >= 0;
          }}
          columns={[
            {
              Header: 'User Role Name',
              accessor: 'id',
            },
            {
              Header: 'Description',
              accessor: 'description',
            },
          ]}
        />
        <br />
      </div>
    );
  };

  let content;
  if (isStoreError(store)) {
    content = <ErrorBox error={store.error!} />;
  } else if (isStoreLoading(store)) {
    content = <BasicProgressPlaceholder segmentCount={3} />;
  } else {
    content = renderMain();
  }
  return (
    <>
      {renderHeader()}
      {content}
    </>
  );
});

export default RolesList;
