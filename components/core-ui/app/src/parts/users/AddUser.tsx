import React from 'react';
import { observer } from 'mobx-react-lite';
import { Container, Heading, HStack, Text, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { FaUser } from 'react-icons/fa';

import AddSingleUser from './AddSingleUser';

const AddUser = observer(() => {
  const renderTitle = () => (
    <Heading as="h3" mb={5} size="md">
      <HStack>
        <FaUser />
        <Text>Add User</Text>
      </HStack>
    </Heading>
  );

  const renderMain = () => (
    <Tabs>
      <TabList>
        <Tab>Add Single User</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <AddSingleUser />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );

  return (
    <Container maxW="container.md" pt={5}>
      {renderTitle()}
      {renderMain()}
    </Container>
  );
});

export default AddUser;
