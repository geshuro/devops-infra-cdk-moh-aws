import _ from 'lodash';
import React from 'react';
import { Box, Heading, Button, Tabs, Tab, TabPanels, TabPanel, TabList } from '@chakra-ui/react';
import { ButtonsToModal } from './ButtonsToModal';
import { Screening1Table, useScreening1TableState } from './Screening1Table';
import { useScreeningSummary } from '../ScreeningSummary';

export const Screening1 = (props: { screeningId: string; onShowSummary: () => void }) => {
  const autoApprovedTable = useScreening1TableState(props.screeningId, 'autoApproved');
  const autoRejectedTable = useScreening1TableState(props.screeningId, 'autoRejected');

  const summaryStats = useScreeningSummary(props.screeningId, 'first');
  const leftToReview = !summaryStats
    ? `{left to review}`
    : summaryStats.autoApproved.notReviewed + summaryStats.autoRejected.notReviewed;

  return (
    <Box>
      {leftToReview === 0 ? (
        <Button size="sm" mb={10} colorScheme="blue" onClick={props.onShowSummary}>
          Show summary for submitting to Screening #2
        </Button>
      ) : (
        <Heading size="sm" mb={10}>
          Articles left to review: {leftToReview}
        </Heading>
      )}

      <Tabs variant="enclosed-colored" isLazy>
        <TabList>
          <Tab>
            Automatically Approved: {autoApprovedTable.totalItems}
            {autoApprovedTable.filtering.selectedFilter !== undefined && ` (filtered)`}
          </Tab>
          <Tab>
            Automatically Rejected: {autoRejectedTable.totalItems}
            {autoRejectedTable.filtering.selectedFilter !== undefined && ` (filtered)`}
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Heading size="md" mt={15}>
              Documents automatically approved
              <ButtonsToModal makeBulkDecision={autoApprovedTable.makeBulkDecision} />
            </Heading>
            <Screening1Table {...autoApprovedTable} />
          </TabPanel>
          <TabPanel>
            <Heading size="md" mt={15}>
              Documents automatically rejected
              <ButtonsToModal makeBulkDecision={autoRejectedTable.makeBulkDecision} />
            </Heading>
            <Screening1Table {...autoRejectedTable} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
