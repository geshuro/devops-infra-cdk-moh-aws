import { Box, Text, Divider, Input, Select } from '@chakra-ui/react';
import './Pagination.css';
import { useTableWithPaginationFilteringSearch } from './useTableWithFeatures';

/**
 * Import Pagination.css for best look
 */
export const Pagination = (props: ReturnType<typeof useTableWithPaginationFilteringSearch>['pagination']) => (
  <Box className="pagination-container" mb={15}>
    <Box className="pagination-element">
      <Box className="pagination-button" onClick={() => props.setPageNumberSafe(1)}>
        <Text>{'<<'}</Text>
      </Box>
      <Box className="pagination-button" onClick={() => props.setPageNumberSafe(props.pageCurrentNumber - 1)}>
        <Text>{'<'}</Text>
      </Box>
      <Box className="pagination-button" onClick={() => props.setPageNumberSafe(props.pageCurrentNumber + 1)}>
        <Text>{'>'}</Text>
      </Box>
      <Box className="pagination-button" onClick={() => props.setPageNumberSafe(props.totalPages)}>
        <Text>{'>>'}</Text>
      </Box>
    </Box>
    <Box className="pagination-element">
      <Text>
        Page {props.pageCurrentNumber} of {props.totalPages}
      </Text>
    </Box>
    <Divider orientation="vertical" h="2em" marginX={5} />
    <Box className="pagination-element">
      <Text>Go to page: </Text>
      <Input
        ml={3}
        width="5em"
        variant="outline"
        type="number"
        defaultValue={props.pageCurrentNumber}
        onChange={(e) => {
          const page = e.target.value ? Number(e.target.value) : props.pageCurrentNumber;
          props.setPageNumberSafe(page);
        }}
      />
    </Box>
    <Divider orientation="vertical" h="2em" marginX={5} />
    <Box className="pagination-element">
      <Text>Items per page: </Text>
      <Select
        ml={3}
        width="5em"
        defaultValue={10}
        onChange={(e) => {
          const itemsPerPage = e.target.value ? Number(e.target.value) : props.itemsPerPage;
          props.setItemsPerPage(itemsPerPage);
        }}
      >
        {[10, 20, 50, 100].map((v) => (
          <option value={v}>{v}</option>
        ))}
      </Select>
    </Box>
  </Box>
);
