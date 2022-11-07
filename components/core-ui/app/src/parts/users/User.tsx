import React from 'react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import RolesList from './RolesList';
import UsersList from './UsersList';

const panes = [
  { menuItem: 'Users', render: () => <UsersList /> },
  { menuItem: 'Roles', render: () => <RolesList /> },
];

const User = observer(() => (
  <Tabs>
    <TabList>
      {panes.map((pane, idx) => (
        <Tab key={idx}>{pane.menuItem}</Tab>
      ))}
    </TabList>

    <TabPanels>
      {panes.map((pane, idx) => (
        <TabPanel key={idx}>{pane.render()}</TabPanel>
      ))}
    </TabPanels>
  </Tabs>
));

export default User;
