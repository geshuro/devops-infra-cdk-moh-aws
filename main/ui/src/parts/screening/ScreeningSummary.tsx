import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { Box, Table, Tbody, Tr, Td, Heading, Button } from '@chakra-ui/react';
import { ScreeningSummaryResponse, ScreeningApi } from '../../helpers/api';
import './ScreeningSummary.css';

export const useScreeningSummary = (screeningId: string, screening: 'first' | 'second') => {
  const [summary, setSummary] = useState<ScreeningSummaryResponse | undefined>(undefined);
  const apiCall = screening === 'first' ? ScreeningApi.screening1Summary : ScreeningApi.screening2Summary;
  useEffect(() => {
    apiCall(screeningId)
      .then((response) => {
        setSummary(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }, [screeningId]);
  return summary;
};

export const ScreeningSummary = (props: {
  screeningId: string;
  screening: 'first' | 'second';
  onFinalizeSummary: () => Promise<void>;
  finalizeButtonText: string;
}) => {
  const summary = useScreeningSummary(props.screeningId, props.screening);

  if (!summary) {
    return <Box></Box>;
  }

  const totalApproved = summary.manualReview.approved + summary.autoApproved.approved + summary.autoRejected.approved;
  const totalRejected = summary.manualReview.rejected + summary.autoApproved.rejected + summary.autoRejected.rejected;

  const sumAll = _.sum(
    // eslint-disable-next-line you-dont-need-lodash-underscore/flatten
    _.flatten([
      Object.values(summary.manualReview),
      Object.values(summary.autoApproved),
      Object.values(summary.autoRejected),
    ]),
  );

  const leftToReview = sumAll - (totalApproved + totalRejected);

  return (
    <Box>
      {leftToReview > 0 && <Heading>Please review remaining {leftToReview} articles before moving forward.</Heading>}
      {leftToReview === 0 && (
        <Button size="sm" mb={10} colorScheme="blue" onClick={props.onFinalizeSummary}>
          {props.finalizeButtonText}
        </Button>
      )}
      <Table colorScheme="gray" className="scr1-summary-table">
        <Tbody>
          <Tr>
            <Td>Summary</Td>
            <Td>
              Total Approved
              <br />
              {totalApproved}
            </Td>
            <Td>
              Total Rejected
              <br />
              {totalRejected}
            </Td>
          </Tr>
        </Tbody>
      </Table>
      <Table mt={'5em'} colorScheme="gray" className="scr1-summary-table">
        <Tbody>
          <Tr>
            <Td>Initial number of articles</Td>
            <Td colSpan={4}>{sumAll}</Td>
          </Tr>
          <Tr>
            <Td>Automatic decisions</Td>
            <Td colSpan={2}>
              Approved
              <br />
              {_.sum(Object.values(summary.autoApproved))}
            </Td>
            <Td colSpan={2}>
              Rejected
              <br />
              {_.sum(Object.values(summary.autoRejected))}
            </Td>
          </Tr>
          <Tr>
            <Td>Manual decisions</Td>
            <Td>
              Approved
              <br />
              {summary.autoApproved.approved}
            </Td>
            <Td>
              Rejected (override)
              <br />
              {summary.autoApproved.rejected}
            </Td>
            <Td>
              Approved (override)
              <br />
              {summary.autoRejected.approved}
            </Td>
            <Td>
              Rejected
              <br />
              {summary.autoRejected.rejected}
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
};
