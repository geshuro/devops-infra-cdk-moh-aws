import _ from 'lodash';
import React from 'react';
import { Link, HStack, Table, Thead, Tbody, Tr, Td, Th, Box, Skeleton } from '@chakra-ui/react';
import { displaySuccess, ErrorBox } from '@aws-ee/core-ui';
import { BsChevronCompactUp, BsChevronCompactDown } from 'react-icons/bs';
import { ArticleType, Screening1TableProps, ScreeningApi } from '../../../helpers/api';
import { useTableWithPaginationFilteringSearch } from '../shared/useTableWithFeatures';
import { FilterTableContent } from '../shared/Filter';
import { Pagination } from '../shared/Pagination';
import { SearchTableContent } from '../shared/Search';
import { PicoLetters } from '../shared/PicoLetters';
import { DecisionMakingProps, DocumentDecisionButtons } from '../shared/DecisionButtons';

export const useScreening1TableState = (
  screeningId: string,
  tableType: 'manualReview' | 'autoApproved' | 'autoRejected',
) => {
  const [tableData, setTableData] = React.useState<Screening1TableProps | undefined>(undefined);
  const [isLoadingDecision, setLoadingDecision] = React.useState(false);
  const tableState = useTableWithPaginationFilteringSearch((props) =>
    ScreeningApi.loadReviewScreening1(screeningId, tableType, props).then((response) => {
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
    const createPromise = () => ScreeningApi.makeDecisionScreening1(screeningId, articleId, decision);
    return makeDecisionWithLoadingAndRefresh(
      createPromise,
      () => `Decision '${decision}' was made about article ${articleId}.`,
    );
  };

  const makeBulkDecision = (decision: 'approve' | 'reject' | 'reset') => {
    const createPromise = () =>
      ScreeningApi.makeBulkDecisionScreening1(screeningId, decision, {
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

export const Screening1Table = (tableProps: ReturnType<typeof useScreening1TableState>) => {
  const content = (() => {
    if (tableProps.errorMessage) {
      return (
        <Tr>
          <Td textAlign="center" colSpan={3}>
            <ErrorBox error={tableProps.errorMessage} />
          </Td>
        </Tr>
      );
    }
    if (!tableProps.rows) {
      return [...new Array(tableProps.pagination.itemsPerPage)].map(() => (
        <Tr>
          <Td textAlign="center" colSpan={3}>
            <Skeleton height="70px" />
          </Td>
        </Tr>
      ));
    }
    if (tableProps.rows.length === 0) {
      return (
        <Tr>
          <Td textAlign="center" colSpan={3}>
            No articles here.
          </Td>
        </Tr>
      );
    }

    return tableProps.rows.map((data) => (
      <Tr>
        <Td>
          <TitleAbstract title={data.title} abstract={data.abstract} />
        </Td>
        <Td>
          <Table basic="very" textAlign="center">
            <Tbody>
              <PicoLetters percentages={data.pico} />
              {/* <Tr>
                <Td colSpan={4}>{(data as any).firstAvgPico}</Td>
              </Tr> */}
            </Tbody>
          </Table>
        </Td>
        <Td>
          <DocumentDecisionButtons
            articleId={data.id}
            isLoading={tableProps.isLoadingDecision}
            makeDecision={tableProps.makeDecision}
            decisions={data.manualDecisions ?? []}
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
