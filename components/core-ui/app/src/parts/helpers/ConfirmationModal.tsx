import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@chakra-ui/react';

type ClickHandler = (event?: React.MouseEvent<HTMLElement>, data?: Record<string, unknown>) => void;

type ConfirmationModalProps = {
  open?: boolean;
  processing?: boolean;
  header?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel?: ClickHandler;
  onConfirm?: ClickHandler;
};

// expected props
// - open, whether the dialog should be visible or not.
// - onConfirm, handler method for the confirm case.
// - onCancel, handler method for the cancel case.
// - header (default to empty string)
// - message (default to empty string)
// - confirmLabel (default to 'Confirm')
// - cancelLabel (default to 'Cancel')
const ConfirmationModal = ({
  open,
  processing = false,
  header = '',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
}: ConfirmationModalProps): JSX.Element => (
  <Modal isOpen={!!open} size="xs" onClose={() => onCancel?.()} data-testid="confirmation-modal">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>{header}</ModalHeader>
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
        <Button
          colorScheme="blue"
          variant="outline"
          onClick={onCancel}
          isLoading={processing}
          data-testid="cancel-button"
        >
          {cancelLabel}
        </Button>
        <Button colorScheme="blue" ml={3} onClick={onConfirm} isLoading={processing} data-testid="confirm-button">
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default ConfirmationModal;
