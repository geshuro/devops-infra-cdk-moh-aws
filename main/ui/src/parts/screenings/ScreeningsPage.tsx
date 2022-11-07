import React from 'react';
import { observer } from 'mobx-react-lite';
import { withRouter, useHistory, useLocation } from 'react-router-dom';
import { Button, Container, Heading, Table, Tbody, Thead, Th, Tr, Td, HStack } from '@chakra-ui/react';
import { navigateFn, BasicProgressPlaceholder, ErrorBox } from '@aws-ee/core-ui';
import _ from 'lodash';
import { useTableWithPaginationFilteringSearch } from '../screening/shared/useTableWithFeatures';
import { ScreeningsApi, ScreeningsTableProps } from '../../helpers/api';
import { SearchTableContent } from '../screening/shared/Search';
import { Pagination } from '../screening/shared/Pagination';
import { stageToUiName, statusToStage } from '../screening/ScreeningNavigation';

const ScreeningsPage: React.FunctionComponent = () => {
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  const [tableData, setTableData] = React.useState<ScreeningsTableProps | undefined>(undefined);
  const tableProps = useTableWithPaginationFilteringSearch((props) =>
    ScreeningsApi.list(props).then((response) => {
      setTableData(response);
      return response;
    }),
  );

  function renderContent() {
    const list = tableData?.items ?? [];
    const picoCharLimit = 60;
    return (
      <Tbody>
        {list.map((item, index) => (
          <Tr key={index}>
            <Td>
              {_.truncate(item.clinicalQuestion, { length: 100 })}
              <br />
              <br />
              <i>PICO[D]: </i>
              <br />
              P: {_.truncate(item.picoP, { length: picoCharLimit })}
              <br />
              I: {_.truncate(item.picoI, { length: picoCharLimit })}
              <br />
              C: {_.truncate(item.picoC, { length: picoCharLimit })}
              <br />
              O: {_.truncate(item.picoO, { length: picoCharLimit })}
              <br />
              {item.picoD && (
                <span>
                  D: {_.truncate(item.picoD, { length: picoCharLimit })}
                  <br />
                </span>
              )}
            </Td>
            <Td>
              {stageToUiName(statusToStage(item.status))}
              <br />
              {/* <b>{item.documentsCount.toReview} documents require review</b>
                        <br />
                        {item.documentsCount.automaticallyApproved} satisfied PICO criteria
                        <br />
                        {item.documentsCount.automaticallyRejected} discarded */}
            </Td>
            <Td>{new Date(item.createdAt).toDateString()}</Td>
            <Td>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => {
                  navigate(`/screening/${item.id}`);
                }}
              >
                Review
              </Button>
              <br />
              <Button size="sm" mt={3}>
                Clone
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    );
  }

  function renderEmpty() {
    return (
      <Tbody>
        <Tr>
          <Td colSpan={5}>Be the first to create a screening request.</Td>
        </Tr>
      </Tbody>
    );
  }

  // Render loading, error, or tab content
  let content;
  if (tableProps.errorMessage) {
    content = <ErrorBox error={tableProps.errorMessage} className="mt3 mr0 ml0" />;
  } else if (tableProps.isLoading) {
    content = <BasicProgressPlaceholder segmentCount={3} className="mt3 mr0 ml0" />;
  } else if ((tableData?.items?.length ?? 0) === 0) {
    content = renderEmpty();
  } else {
    content = renderContent();
  }

  return (
    <Container maxW="container.xd" pt={5}>
      <Heading as={'h2'} mb={5} size="xl">
        Screening Requests
        <Button
          colorScheme="blue"
          mt={-2}
          ml={5}
          onClick={(e) => {
            e.preventDefault();
            navigate('/screenings/create');
          }}
        >
          Create new
        </Button>
      </Heading>

      <HStack m="20px 12px">
        <SearchTableContent
          isLoading={tableProps.isLoading}
          onSearchRequest={tableProps.filtering.search}
          placeholder="Clinical question or PICO parts"
        />
      </HStack>
      <Pagination {...tableProps.pagination} />
      <Table>
        <Thead>
          <Tr>
            <Th>Request</Th>
            <Th>Status</Th>
            <Th>Start date</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>

        {content}
      </Table>
    </Container>
  );
};

export default withRouter(observer(ScreeningsPage));
