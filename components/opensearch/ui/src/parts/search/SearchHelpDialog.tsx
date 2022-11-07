import React from 'react';
import {
  Heading,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ListItem,
  Code,
  UnorderedList,
} from '@chakra-ui/react';
import { ImCross } from 'react-icons/im';

type SearchHelpDialogProps = {
  onClose: () => void;
  open: boolean;
};

const SearchHelpDialog = ({ open, onClose }: SearchHelpDialogProps) => (
  <Modal size="md" isOpen={open} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Search Help</ModalHeader>
      <ModalBody>
        <Heading size="sm">The search fields supports the following special characters:</Heading>
        <UnorderedList mt={2}>
          <ListItem>
            <Code>+</Code> signifies and operation
          </ListItem>
          <ListItem>
            <Code>|</Code> signifies or operation
          </ListItem>
          <ListItem>
            <Code>-</Code> negates a single token
          </ListItem>
          <ListItem>
            <Code>&quot;</Code> wraps a number of tokens to signify a phrase for searching
          </ListItem>
          <ListItem>
            <Code>*</Code> at the end of a term signifies a prefix query
          </ListItem>
          <ListItem>
            <Code>(</Code> and <Code>)</Code> signify precedence
          </ListItem>
          <ListItem>
            <Code>~N</Code> after a word signifies edit distance (fuzziness)
          </ListItem>
          <ListItem>
            <Code>~N</Code> after a phrase signifies slop amount
          </ListItem>
        </UnorderedList>
      </ModalBody>
      <ModalFooter>
        <Button leftIcon={<ImCross />} colorScheme="blue" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

// eslint-disable-next-line import/prefer-default-export
export default SearchHelpDialog;
