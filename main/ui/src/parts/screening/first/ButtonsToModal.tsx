import { ErrorBox } from '@aws-ee/core-ui';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import React from 'react';

interface BulkDecisionProps {
  makeBulkDecision: (decision: 'approve' | 'reject' | 'reset') => Promise<any>;
}

const useWithLoadingAndError = (props: BulkDecisionProps) => {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const makeBulkDecision = (decision: 'approve' | 'reject' | 'reset') => {
    if (isLoading) {
      return Promise.resolve();
    }
    setError('');
    setLoading(true);
    return props
      .makeBulkDecision(decision)
      .then(() => setLoading(false))
      .catch((e) => {
        setLoading(false);
        setError(`${e}`);
        throw e;
      });
  };

  return {
    makeBulkDecision,
    isLoading,
    error,
  };
};

export function ButtonsToModal(props: BulkDecisionProps) {
  const [showBulkActions, setShowBulkActions] = React.useState(false);
  const { makeBulkDecision, isLoading, error } = useWithLoadingAndError(props);

  const { isOpen: isOpenRejectAll, onOpen: onOpenRejectAll, onClose: onCloseRejectAll } = useDisclosure();
  const { isOpen: isOpenApproveAll, onOpen: onOpenApproveAll, onClose: onCloseApproveAll } = useDisclosure();
  return (
    <>
      {!showBulkActions && (
        <Button ml={15} onClick={() => setShowBulkActions(true)}>
          Show bulk actions
        </Button>
      )}
      {showBulkActions && (
        <Box display="inline-block" ml={15}>
          <Button disabled={isLoading} colorScheme="red" onClick={onOpenRejectAll}>
            Reject All
          </Button>
          <Button disabled={isLoading} colorScheme="green" ml={3} onClick={onOpenApproveAll}>
            Approve All
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpenRejectAll} onClose={onCloseRejectAll}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Warning!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <b>Reject</b> all articles visible on this page?
            <br />
            This will override all your previous decisions on this page
            {error && <ErrorBox error="" />}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onCloseRejectAll}>
              No, I want to keep reviewing
            </Button>
            <Button
              disabled={isLoading}
              colorScheme="blue"
              ml={3}
              onClick={() => {
                makeBulkDecision('reject').then(onCloseRejectAll);
              }}
            >
              Yes, reject all
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenApproveAll} onClose={onCloseApproveAll}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Warning!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <b>Approve</b> all articles visible on this page?
            <br />
            This will override all your previous decisions on this page
            {error && <ErrorBox error="" />}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onCloseApproveAll}>
              No, I want to keep reviewing
            </Button>
            <Button
              disabled={isLoading}
              colorScheme="blue"
              ml={3}
              onClick={() => {
                makeBulkDecision('approve').then(onCloseApproveAll);
              }}
            >
              Yes, approve all
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
