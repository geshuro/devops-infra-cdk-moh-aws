import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Container, Heading, HStack, Text, Divider, Tag, Stat, StatLabel, StatNumber, Box } from '@chakra-ui/react';
import { GoDashboard } from 'react-icons/go';

import { blueDatasets } from './graphs/graph-options';
import BarGraph from './graphs/BarGraph';

const Dashboard = observer(() => {
  useEffect(() => {
    window.scrollTo(0, 0);
  });

  const renderTaskCountGraph = () => {
    const title = 'Tasks';
    const data = {
      labels: ['Eat', 'Run', 'Walk', 'Sleep', 'Work'],
      datasets: blueDatasets(title, [1, 8, 5, 6, 3]),
    };

    return <BarGraph className="mr4" data={data} title={title} />;
  };

  const renderTaskDueGraph = () => {
    const title = 'Due Date';
    const data = {
      labels: ['Today', 'Tomorrow', 'Yesterday', 'Last Year', 'No'],
      datasets: blueDatasets(title, [1, 8, 5, 6, 3]),
    };

    return <BarGraph className="mr4" data={data} title={title} />;
  };

  const renderTitle = () => (
    <Heading as="h3" mb={5} size="md">
      <HStack>
        <GoDashboard />
        <Text>Dashboard</Text>
      </HStack>
    </Heading>
  );

  const renderContent = () => (
    <Box borderWidth={2} borderRadius="lg" p={5} shadow="sm">
      <HStack>
        <Stat>
          <StatLabel>Tasks to complete today</StatLabel>
          <StatNumber>550</StatNumber>
        </Stat>
        {renderTaskCountGraph()}
        {renderTaskDueGraph()}
      </HStack>
      <Divider mt={4} mb={4} />
      There are{' '}
      <Tag colorScheme="orange" borderRadius="full">
        100
      </Tag>{' '}
      tasks due today. &nbsp;&nbsp;You have been assigned an additional <b>300</b> tasks since last month. There are a
      total of <b>10,000</b> tasks to complete.
    </Box>
  );

  return (
    <Container maxW="container.lg" pt={5}>
      {renderTitle()}
      {renderContent()}
    </Container>
  );
});

export default Dashboard;
