import React from 'react';
import { Box, Input, InputGroup, IconButton } from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';

export const SearchTableContent = (props: {
  isLoading: boolean;
  onSearchRequest: (search: string) => void;
  placeholder: string;
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const doSearch = (searchQuery: string) => {
    if (props.isLoading) {
      return;
    }
    // intentionally allow empty query (as a way to reset)
    props.onSearchRequest(searchQuery);
  };
  return (
    <InputGroup>
      <Input
        width={'sm'}
        borderRightRadius={0}
        variant="outline"
        placeholder={props.placeholder}
        disabled={props.isLoading}
        onChange={(e) => {
          if (!e) {
            return;
          }
          const value = e.target.value || '';
          setSearchQuery(value);
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            doSearch(searchQuery);
          }
        }}
      />
      <IconButton
        borderLeftRadius={0}
        colorScheme="blue"
        aria-label="Search"
        icon={<FaSearch />}
        onClick={() => doSearch(searchQuery)}
        disabled={props.isLoading}
      />
    </InputGroup>
  );
};
