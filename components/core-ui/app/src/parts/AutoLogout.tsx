import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@chakra-ui/react';
import IdleTimer from 'react-idle-timer';

import { autoLogoutTimeoutInMinutes } from '../helpers/settings';
import { useAuthenticationStore } from '../models/authentication/Authentication';
import { useApp } from '../models/App';

const dialogTimeoutSeconds = 60;

const AutoLogout = observer(() => {
  const app = useApp();
  const authentication = useAuthenticationStore();
  const [dialogCountDown, setDialogCountDown] = useState<number | undefined>(undefined);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | undefined>(undefined);
  const modalOpen = useMemo(() => dialogCountDown! >= 0, [dialogCountDown]);

  const stopInterval = () => {
    if (typeof intervalId !== 'undefined') {
      clearInterval(intervalId!);
      setIntervalId(undefined);
    }
    setDialogCountDown(undefined);
  };

  const startDialogCountDown = () => {
    if (typeof intervalId !== 'undefined') return;
    let localcount = dialogTimeoutSeconds;
    setDialogCountDown(localcount);

    const intId = setInterval(() => {
      if (localcount <= 0) {
        doLogout();
      } else {
        setDialogCountDown(localcount);
        localcount -= 1;
      }
    }, 1000);

    setIntervalId(intId);
  };

  const cancelDialogCountDown = () => {
    stopInterval();
  };

  const doLogout = () => {
    stopInterval();
    return authentication.logout();
  };

  const handleLogout = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    return doLogout();
  };

  const authenticated = app.userAuthenticated;
  if (!authenticated) return null;
  return (
    <>
      <IdleTimer timeout={1000 * 60 * (autoLogoutTimeoutInMinutes as number)} onIdle={startDialogCountDown} />
      <Modal size="xs" isOpen={modalOpen} onClose={cancelDialogCountDown} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you still there?</ModalHeader>
          <ModalBody>
            <span>For security purposes, you will be logged out in </span>
            <Text as="span" fontWeight="bold">
              {dialogCountDown}
            </Text>
            <span> seconds.</span>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" variant="solid" onClick={() => cancelDialogCountDown()}>
              Keep Me Logged In
            </Button>
            <Button colorScheme="blue" variant="outline" ml={5} onClick={handleLogout}>
              Log Out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

export default AutoLogout;
