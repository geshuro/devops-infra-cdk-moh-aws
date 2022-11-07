import React from 'react';
import { Box, CloseButton, Flex, useColorModeValue, BoxProps, Image } from '@chakra-ui/react';
import { MenuItem, shouldShow } from '../../models/Menu';
import NavItem from './NavItem';

interface SidebarProps extends BoxProps {
  onClose: () => void;
  logoImg: string;
  menuItems: MenuItem[];
  currentPath: string;
}

const SidebarContent = ({ currentPath, menuItems, logoImg, onClose, ...rest }: SidebarProps) => (
  <Box
    transition="3s ease"
    bg={useColorModeValue('white', 'gray.900')}
    borderRight="1px"
    borderRightColor={useColorModeValue('gray.400', 'gray.700')}
    w={{ base: 'full', md: 60 }}
    pt={{ base: 0, md: 2 }}
    pos="fixed"
    h="full"
    {...rest}
  >
    <Flex display={{ base: 'flex', md: 'none' }} h="20" alignItems="center" mx="8" justifyContent="space-between">
      <Image borderRadius="md" src={logoImg} boxSize="60px" />
      <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
    </Flex>
    <div />
    {menuItems.filter(shouldShow).map(
      (item, idx) =>
        item.body ?? (
          <NavItem key={idx} icon={item.icon} url={item.url} isActive={currentPath?.startsWith(item.url)}>
            {item.title}
          </NavItem>
        ),
    )}
  </Box>
);

export default SidebarContent;
