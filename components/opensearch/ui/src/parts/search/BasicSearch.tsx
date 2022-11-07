import React from 'react';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { useForm } from 'react-hook-form';
import { useDisclosure, Input, Button, ButtonGroup, IconButton, Box } from '@chakra-ui/react';
import { FaTimes, FaSearch, FaQuestion } from 'react-icons/fa';

import SearchHelpDialog from './SearchHelpDialog';
import { BasicSearchStore } from '../../models/search/BasicSearchStore';

type BasicSearchForm = { query: string };

export type BasicSearchProps = {
  domain: string;
  basicSearchStoreMap: Record<string, BasicSearchStore>;
  handleSearchResults: (results: unknown[]) => Promise<void>;
  handleClearSearchResults: () => Promise<void>;
  returnFullDocuments: boolean;
  highlightFields: string[];
};

export const BasicSearch = observer(
  ({
    basicSearchStoreMap,
    domain,
    handleSearchResults,
    handleClearSearchResults,
    returnFullDocuments,
    highlightFields,
  }: BasicSearchProps) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const basicSearchStore = basicSearchStoreMap[domain];
    const {
      handleSubmit,
      reset,
      register,
      formState: { isSubmitting },
    } = useForm<BasicSearchForm>();

    const handleFormCancel = async () => {
      reset();
      basicSearchStore.clear();
      await handleClearSearchResults();
    };

    const handleFormSubmission = async (values: BasicSearchForm) => {
      let query = values.query;

      if (query) {
        query = query.trim();

        if (query) {
          await basicSearchStore.search(query, returnFullDocuments, highlightFields);
          await handleSearchResults(toJS(basicSearchStore.matches));
          return;
        }
      }

      await handleClearSearchResults();
    };

    const renderForm = () => (
      <form onSubmit={handleSubmit(handleFormSubmission)}>
        <Input
          placeholder="Enter query"
          {...register('query', {
            maxLength: 2048,
          })}
        />
        <Box mt={3}>
          <ButtonGroup colorScheme="blue">
            <IconButton variant="outline" aria-label="help" icon={<FaQuestion />} onClick={onOpen} />
          </ButtonGroup>
          <ButtonGroup colorScheme="blue" isAttached ml={3}>
            <Button
              variant="outline"
              leftIcon={<FaTimes />}
              disabled={isSubmitting}
              onClick={handleFormCancel}
              type="button"
            >
              Clear
            </Button>
            <Button leftIcon={<FaSearch />} colorScheme="blue" isLoading={isSubmitting} type="submit">
              Search
            </Button>
          </ButtonGroup>
        </Box>
      </form>
    );

    return (
      <>
        {isOpen && <SearchHelpDialog open={isOpen} onClose={onClose} />}
        {renderForm()}
      </>
    );
  },
);
