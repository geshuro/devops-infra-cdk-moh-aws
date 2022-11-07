import _ from 'lodash';
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, toJS } from 'mobx';
import { useDisclosure, Input, Button, ButtonGroup, IconButton, Box, Table, Tbody, Tr, Td } from '@chakra-ui/react';
import { FaTimes, FaSearch, FaQuestion } from 'react-icons/fa';

import {
  isStoreError,
  isStoreLoading,
  isStoreEmpty,
  swallowError,
  BasicProgressPlaceholder,
  ErrorBox,
} from '@aws-ee/core-ui';

import SearchHelpDialog from './SearchHelpDialog';
import { AdvancedSearchStore } from '../../models/search/AdvancedSearchStore';

export type AdvancedSearchProps = {
  domain: string;
  advancedSearchStoreMap: Record<string, AdvancedSearchStore>;
  handleSearchResults: (results: unknown[]) => Promise<void>;
  handleClearSearchResults: () => Promise<void>;
  returnFullDocuments: boolean;
  highlightFields: string[];
};

type SearchForm = Record<string, string>;

export const AdvancedSearch = observer(
  ({
    domain,
    advancedSearchStoreMap,
    handleSearchResults,
    handleClearSearchResults,
    returnFullDocuments,
    highlightFields,
  }: AdvancedSearchProps) => {
    const advancedSearchStore = advancedSearchStoreMap[domain];
    const fields = advancedSearchStore.listFields;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [formValues, setFormValues] = useState<SearchForm>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    runInAction(() => {
      swallowError(advancedSearchStore.load());
    });

    const handleFormCancel = async () => {
      setFormValues({});
      advancedSearchStore.clear();
      await handleClearSearchResults();
    };

    const hasValues = (valueMap: Record<string, string>) => {
      const keys = Object.keys(valueMap);
      let hasValues = false;

      _.forEach(keys, (key) => {
        const value = valueMap[key];

        if (value && value.trim()) {
          hasValues = true;
          return false;
        }

        return true;
      });

      return hasValues;
    };

    const handleFormSubmission = async () => {
      if (hasValues(formValues)) {
        setIsSubmitting(true);
        await advancedSearchStore.search(formValues, returnFullDocuments, highlightFields);
        await handleSearchResults(toJS(advancedSearchStore.matches));
        setIsSubmitting(false);
      } else {
        await handleClearSearchResults();
      }
    };

    const renderForm = () => (
      <>
        <Table variant="unstyled">
          <Tbody>
            {fields.map((field) => (
              <Tr key={field.id}>
                <Td pl={0} pt={1} pb={1}>
                  {field.label}
                </Td>
                <Td pt={1} pb={1}>
                  <Input
                    name={field.id}
                    placeholder={field.id}
                    onChange={(x) => {
                      setFormValues((v) => ({ ...v, [x.target.name]: x.target.value }));
                    }}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
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
            <Button leftIcon={<FaSearch />} colorScheme="blue" isLoading={isSubmitting} onClick={handleFormSubmission}>
              Search
            </Button>
          </ButtonGroup>
        </Box>
      </>
    );

    const renderContent = () => (
      <>
        {isOpen && <SearchHelpDialog open={isOpen} onClose={onClose} />}
        {renderForm()}
      </>
    );

    const store = advancedSearchStore;
    // Render loading, error, or tab content
    let content;
    if (isStoreError(store)) {
      content = <ErrorBox error={store.error!} className="m0" />;
    } else if (isStoreLoading(store)) {
      content = <BasicProgressPlaceholder segmentCount={1} />;
    } else if (isStoreEmpty(store)) {
      content = null;
    } else {
      content = renderContent();
    }

    return content;
  },
);
