import React from 'react';
import { Filter, TablePaginationProps } from '../../../helpers/api';
import { Filtering } from './Filter';

interface TableWithPaginationFilteringSearchProps {
  page: string;
  filter: Filter | undefined;
  search: string | undefined;
  itemsPerPage: string;
}

// inspired by https://react-table.tanstack.com/docs/examples/pagination-controlled
export const useTableWithPaginationFilteringSearch = <T extends TablePaginationProps>(
  requestDataChange: (props: TableWithPaginationFilteringSearchProps) => Promise<T>,
) => {
  const [pageCurrentNumber, setPageNumber] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState<string | undefined>(undefined);
  const { selectedFilter, selectFilterState } = Filtering.useFilters();
  const [tablePaginationData, setTablePaginationData] = React.useState<TablePaginationProps | undefined>(undefined);
  const [isLoading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');
  const loadRequestId = React.useRef(1);
  const [forceRefreshCounter, setForceRefreshCounter] = React.useState(0);

  const forceRefresh = () => {
    setForceRefreshCounter(forceRefreshCounter + 1);
  };

  const setPageNumberSafe = (pageNumber: number) => {
    if (isLoading) {
      return;
    }
    const totalPages = tablePaginationData?.totalPages ?? 1;
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber % 1 !== 0) {
      // TODO: show invalid number error
      return;
    }
    setPageNumber(pageNumber);
  };

  React.useEffect(() => {
    setLoading(true);
    loadRequestId.current += 1;
    const currentLoadRequestId = loadRequestId.current;
    requestDataChange({
      page: `${pageCurrentNumber}`,
      filter: selectedFilter,
      search: searchQuery,
      itemsPerPage: `${itemsPerPage}`,
    })
      .then((response) => {
        if (currentLoadRequestId !== loadRequestId.current) {
          return;
        }
        setTablePaginationData({
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        });
        setLoading(false);
      })
      .catch((e) => {
        if (currentLoadRequestId !== loadRequestId.current) {
          return;
        }
        setErrorMessage('Failed to load, please refresh the page. (F5)');
        setLoading(false);
      });
    return () => {
      // little hack to make sure loadPage callbacks aren't executed after unmount
      loadRequestId.current += 1;
    };
  }, [pageCurrentNumber, loadRequestId.current, selectedFilter, searchQuery, itemsPerPage, forceRefreshCounter]);

  const withPageNumberReset =
    <T extends (...args: any[]) => any>(fn: T) =>
    (...args: Parameters<T>): ReturnType<T> => {
      // reset page number, we can end up in a situation where `page > totalPages`
      setPageNumberSafe(1);
      return fn(...args);
    };

  const pagination = {
    pageCurrentNumber,
    totalPages: 1,
    setPageNumberSafe,
    itemsPerPage,
    setItemsPerPage: withPageNumberReset(setItemsPerPage),
  };

  const totalItems = tablePaginationData?.totalItems ?? 0;

  const filtering = {
    selectedFilter,
    selectFilter: withPageNumberReset(selectFilterState),
    searchQuery,
    search: withPageNumberReset(setSearchQuery),
  };

  if (errorMessage) {
    return {
      isLoading: false,
      errorMessage,
      pagination,
      totalItems,
      filtering,
      forceRefresh,
    };
  }

  if (!tablePaginationData) {
    return {
      isLoading,
      errorMessage,
      pagination,
      totalItems,
      filtering,
      forceRefresh,
    };
  }

  return {
    isLoading,
    errorMessage,
    pagination: {
      ...pagination,
      totalPages: tablePaginationData.totalPages,
    },
    totalItems,
    filtering,
    forceRefresh,
  };
};
