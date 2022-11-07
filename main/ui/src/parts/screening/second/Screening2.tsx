import _ from 'lodash';
import React from 'react';
import {
  HStack,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Button,
  Box,
  Skeleton,
  Link,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { FaFilePdf as PdfIcon } from 'react-icons/fa';
import { BsChevronCompactUp, BsChevronCompactDown } from 'react-icons/bs';
import { displaySuccess, ErrorBox } from '@aws-ee/core-ui';
import { ButtonsToModal } from '../first/ButtonsToModal';
import { useTableWithPaginationFilteringSearch } from '../shared/useTableWithFeatures';
import { Screening2TableProps, ScreeningApi } from '../../../helpers/api';
import { SearchTableContent } from '../shared/Search';
import { FilterTableContent } from '../shared/Filter';
import { Pagination } from '../shared/Pagination';
import { PicoLetters } from '../shared/PicoLetters';
import { DecisionMakingProps, DocumentDecisionButtons } from '../shared/DecisionButtons';
import { useScreeningSummary } from '../ScreeningSummary';

/**
 * WARNING: This is heavily duplicated from {@link Screening1Table#useScreening1TableState} consider refactoring
 */
export const useScreening2TableState = (
  screeningId: string,
  tableType: 'manualReview' | 'autoApproved' | 'autoRejected',
) => {
  const [isLoadingDecision, setLoadingDecision] = React.useState(false);
  const [tableData, setTableData] = React.useState<Screening2TableProps | undefined>(undefined);
  const tableState = useTableWithPaginationFilteringSearch((props) =>
    ScreeningApi.loadReviewScreening2(screeningId, tableType, props).then((response) => {
      setTableData(response);
      return response;
    }),
  );

  const makeDecisionWithLoadingAndRefresh = <T extends {}>(
    invokePromise: () => Promise<T>,
    getSuccessMessage: (promiseResult: T) => string,
  ) => {
    if (tableState.isLoading) {
      return Promise.resolve();
    }
    setLoadingDecision(true);
    return invokePromise()
      .then((promiseResult) => {
        if (!tableData) {
          // mostly needed for TypeScript as `tableData === undefined` situation won't happen
          return;
        }

        tableState.forceRefresh();
        displaySuccess(getSuccessMessage(promiseResult), 'Success');
        setLoadingDecision(false);
      })
      .catch((e) => {
        setLoadingDecision(false);
        throw e;
      });
  };

  const makeDecision: DecisionMakingProps['makeDecision'] = (
    articleId: string,
    decision: 'approve' | 'reject' | 'reset',
  ) => {
    const createPromise = () => ScreeningApi.makeDecisionScreening2(screeningId, articleId, decision);
    return makeDecisionWithLoadingAndRefresh(
      createPromise,
      () => `Decision '${decision}' was made about article ${articleId}.`,
    );
  };

  const makeBulkDecision = (decision: 'approve' | 'reject' | 'reset') => {
    const createPromise = () =>
      ScreeningApi.makeBulkDecisionScreening2(screeningId, decision, {
        page: `${tableState.pagination.pageCurrentNumber}`,
        itemsPerPage: `${tableState.pagination.itemsPerPage}`,
        filter: tableState.filtering.selectedFilter,
        search: tableState.filtering.searchQuery,
        autoDecision: (() => {
          if (tableType === 'manualReview') {
            return 'manual';
          }
          if (tableType === 'autoApproved') {
            return 'approved';
          }
          if (tableType === 'autoRejected') {
            return 'rejected';
          }
          throw new Error(`unknown type ${tableType}`);
        })(),
      });
    return makeDecisionWithLoadingAndRefresh(
      createPromise,
      (newDecisions) => `Decision '${decision}' was made about ${newDecisions.length} items.`,
    );
  };

  return {
    screeningId,
    rows: tableData?.items,
    makeDecision,
    makeBulkDecision,
    isLoadingDecision,
    ...tableState,
  };
};

export const Screening2 = (props: { screeningId: string; onNextStep: () => void }) => {
  const autoApprovedTable = useScreening2TableState(props.screeningId, 'autoApproved');
  const autoRejectedTable = useScreening2TableState(props.screeningId, 'autoRejected');

  const summaryStats = useScreeningSummary(props.screeningId, 'second');
  const leftToReview = !summaryStats
    ? `{left to review}`
    : summaryStats.autoApproved.notReviewed + summaryStats.autoRejected.notReviewed;

  return (
    <Box>
      {leftToReview === 0 ? (
        <Button size="sm" mb={10} colorScheme="blue" onClick={props.onNextStep}>
          Screening 2 Summary
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
            <Screening2Table {...autoApprovedTable} />
          </TabPanel>
          <TabPanel>
            <Heading size="md" mt={15}>
              Documents automatically rejected
              <ButtonsToModal makeBulkDecision={autoRejectedTable.makeBulkDecision} />
            </Heading>
            <Screening2Table {...autoRejectedTable} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

const Screening2Table = (tableProps: ReturnType<typeof useScreening2TableState>) => {
  const content = (() => {
    if (tableProps.errorMessage) {
      return (
        <Tr>
          <Td textAlign="center" colSpan={4}>
            <ErrorBox error={tableProps.errorMessage} />
          </Td>
        </Tr>
      );
    }
    if (!tableProps.rows) {
      return [...new Array(tableProps.pagination.itemsPerPage)].map(() => (
        <Tr>
          <Td textAlign="center" colSpan={4}>
            <Skeleton height="70px" />
          </Td>
        </Tr>
      ));
    }
    if (tableProps.rows.length === 0) {
      return (
        <Tr>
          <Td textAlign="center" colSpan={4}>
            No articles here.
          </Td>
        </Tr>
      );
    }

    return tableProps.rows.map((data) => (
      <Tr>
        <Td>
          <TitleAbstract title={data.title} abstract={data.abstract} />
          <br />
          <Link
            href="https://chakra-ui.com"
            color="blue.500"
            display="inline-block"
            verticalAlign="middle"
            mt={3}
            isExternal
          >
            View PDF{' '}
            <PdfIcon
              style={{
                display:
                  'inline-block' /* for some reason using html attribute / prop `display` doesn't work, so using `style` */,
              }}
              fontSize="1.5em"
            />
          </Link>
        </Td>
        <Td>
          <Table basic="very" textAlign="center">
            <Tbody>
              <PicoLetters percentages={data.secondPico} />
            </Tbody>
          </Table>
        </Td>
        <Td>
          <DocumentDecisionButtons
            articleId={data.id}
            isLoading={false}
            makeDecision={tableProps.makeDecision}
            decisions={data.manualDecisions ?? []}
            changeDisabled
          />
        </Td>
        <Td>
          <DocumentDecisionButtons
            articleId={data.id}
            isLoading={tableProps.isLoadingDecision}
            makeDecision={tableProps.makeDecision}
            decisions={data.secondManualDecisions ?? []}
          />
        </Td>
      </Tr>
    ));
  })();
  return (
    <Box borderRadius={15} borderWidth={1} p={15} mt={15}>
      <HStack m="20px 12px">
        <SearchTableContent
          isLoading={tableProps.isLoading}
          onSearchRequest={tableProps.filtering.search}
          placeholder="Keywords in an article, like: bipolar, paracetamol..."
        />
        <FilterTableContent {...tableProps.filtering} />
      </HStack>
      <Pagination {...tableProps.pagination} />
      <Table variant="simple" size="sm" colorScheme="gray">
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>PICO scores</Th>
            <Th>Prev Decision</Th>
            <Th>Decision</Th>
          </Tr>
        </Thead>
        <Tbody>{content}</Tbody>
      </Table>
    </Box>
  );
};

const TitleAbstract = (props: { title: string; abstract: string }) => {
  const MAX_LENGTH = 300;
  const shouldShowExpander = props.abstract.length > MAX_LENGTH;
  const [showFull, setShowFull] = React.useState(false);
  const shortAbstract = _.truncate(props.abstract, { length: MAX_LENGTH });
  const longAbstract = props.abstract;
  const abstract = showFull ? longAbstract : shortAbstract;
  const abstractStyles = {
    fontSize: '0.7em',
    lineHeight: '1.2em',
    color: 'gray.700',
    marginTop: 1,
  };

  return (
    <>
      {props.title}
      <Box {...abstractStyles}>
        {abstract}
        <br />
        {shouldShowExpander && (
          <Link
            color="gray.400"
            textAlign="center"
            onClick={() => {
              setShowFull(!showFull);
            }}
          >
            {!showFull && (
              <>
                Show full <BsChevronCompactDown />
              </>
            )}
            {showFull && (
              <>
                Show less <BsChevronCompactUp />
              </>
            )}
          </Link>
        )}
      </Box>
    </>
  );
};
