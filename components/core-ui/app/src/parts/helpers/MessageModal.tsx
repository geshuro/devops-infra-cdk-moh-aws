import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@chakra-ui/react';

// expected props
// - open, whether the dialog should be visible or not.
// - onConfirm, handler method for the confirm case.
// - header (default to empty string)
// - message (default to empty string)
// - confirmLabel (default to 'Confirm')

type ConfirmHandler = (event?: React.MouseEvent<HTMLElement>, data?: Record<string, unknown>) => void;

type MessageModalProps = {
  open?: boolean;
  processing?: boolean;
  header?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm?: ConfirmHandler;
};

const MessageModal = ({
  open,
  processing = false,
  header = '',
  message = '',
  confirmLabel = 'Confirm',
  onConfirm,
}: MessageModalProps): JSX.Element => (
  <Modal isOpen={!!open} size="xs" onClose={() => onConfirm?.()} data-testid="confirmation-modal">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>{header}</ModalHeader>
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
        <Button colorScheme="blue" onClick={onConfirm} isLoading={processing} data-testid="confirm-button">
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default MessageModal;
