import React from 'react';
import { ButtonGroup, Button, Box } from '@chakra-ui/react';
import { Filter } from '../../../helpers/api';

export const Filtering = {
  useFilters: () => {
    // const navigate = navigateFn({ location: useLocation(), history: useHistory() });
    const initialFilter = /* window.location.hash.substring(1) ||  */ undefined;
    const [selectedFilter, selectFilterState] = React.useState<Filter | undefined>(initialFilter);
    return { selectedFilter, selectFilterState };
  },

  FILTERS: [
    ['All', undefined],
    ['Not reviewed', 'notReviewed'],
    ['Reviewed', 'reviewed'],
    ['Approved', 'approved'],
    ['Rejected', 'rejected'],
  ] as [string, Filter | undefined][],
};

export const FilterTableContent = (props: {
  selectedFilter: Filter | undefined;
  selectFilter: (filter: Filter | undefined) => void;
}) => (
  <ButtonGroup size="sm" isAttached variant="outline">
    {Filtering.FILTERS.map(([filterText, filterKey]) => (
      <Button isActive={filterKey === props.selectedFilter} onClick={() => props.selectFilter(filterKey)} mr="-px">
        {filterText}
      </Button>
    ))}
  </ButtonGroup>
);
