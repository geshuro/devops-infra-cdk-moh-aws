import React from 'react';
import { observer } from 'mobx-react-lite';
import { Heading, Tabs, TabList, Tab, TabPanels, TabPanel, Box } from '@chakra-ui/react';

import { BasicSearch, BasicSearchProps } from './BasicSearch';
import { AdvancedSearch, AdvancedSearchProps } from './AdvancedSearch';

type SearchProps = BasicSearchProps & AdvancedSearchProps;

const Search = observer(
  ({
    basicSearchStoreMap,
    advancedSearchStoreMap,
    domain,
    handleSearchResults,
    handleClearSearchResults,
    returnFullDocuments,
    highlightFields,
  }: SearchProps) => (
    <Box borderRadius="md" borderWidth={2} p={3}>
      <Heading size="md">Search</Heading>
      <Tabs mt={4} isLazy>
        <TabList>
          <Tab>Basic</Tab>
          <Tab>Advanced</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <BasicSearch
              domain={domain}
              basicSearchStoreMap={basicSearchStoreMap}
              handleSearchResults={handleSearchResults}
              handleClearSearchResults={handleClearSearchResults}
              returnFullDocuments={returnFullDocuments}
              highlightFields={highlightFields}
            />
          </TabPanel>
          <TabPanel>
            <AdvancedSearch
              domain={domain}
              advancedSearchStoreMap={advancedSearchStoreMap}
              handleSearchResults={handleSearchResults}
              handleClearSearchResults={handleClearSearchResults}
              returnFullDocuments={returnFullDocuments}
              highlightFields={highlightFields}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  ),
);

export default Search;
