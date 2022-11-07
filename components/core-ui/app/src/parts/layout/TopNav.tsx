import React, { ReactEventHandler } from 'react';
import {
  Button,
  IconButton,
  Avatar,
  Box,
  Flex,
  HStack,
  VStack,
  useColorModeValue,
  Text,
  useDisclosure,
  FlexProps,
  Menu,
  MenuButton,
  MenuItem,
  MenuDivider,
  MenuList,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
} from '@chakra-ui/react';
import { FiMenu, FiChevronDown, FiInfo } from 'react-icons/fi';
import { branding, version, versionDisclaimerHeader, versionDisclaimerContent } from '../../helpers/settings';

interface TopNavProps extends FlexProps {
  onOpenMenu: () => void;
  logoImg: string;
  displayName: string;
  handleLogout: ReactEventHandler;
  handleProfile: ReactEventHandler;
}

const TopNav = ({ displayName, handleLogout, handleProfile, logoImg, onOpenMenu, ...rest }: TopNavProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const renderReleaseDetails = () => {
    const shouldRenderDisclaimer = !!(versionDisclaimerHeader && versionDisclaimerContent);
    return (
      <HStack color="yellow.600">
        <Tooltip label={versionDisclaimerHeader}>
          <Text fontSize="xs" maxW="250px" isTruncated>
            {version ? `${version}: ` : ''} {versionDisclaimerHeader}
          </Text>
        </Tooltip>
        {shouldRenderDisclaimer && renderReleaseDisclaimerModal()}
      </HStack>
    );
  };

  const renderReleaseDisclaimerModal = () => (
    <>
      <IconButton aria-label="Open Disclaimer" onClick={onOpen} size="sm" icon={<FiInfo />} variant="ghost" />

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{versionDisclaimerHeader}</ModalHeader>
          <ModalBody>{versionDisclaimerContent}</ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );

  return (
    <Flex
      ml={{ base: 0 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.400', 'gray.700')}
      shadow="md"
      justifyContent={{ base: 'space-between' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpenMenu}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={10}>
        <Image borderRadius="md" ml={3} mr={3} display="flex" src={logoImg} boxSize="60px" />
        <Text fontSize="md" noOfLines={2}>
          {branding.main.title}
        </Text>
        {renderReleaseDetails()}
      </HStack>

      <HStack spacing={{ base: '0', md: '6' }}>
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton py={2} transition="all 0.3s" _focus={{ boxShadow: 'none' }}>
              <HStack>
                <Avatar size={'sm'} name={displayName} />
                <VStack display={{ base: 'none', md: 'flex' }} alignItems="flex-start" spacing="1px" ml="2">
                  <Text fontSize="sm">{displayName}</Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuDivider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

export default TopNav;
