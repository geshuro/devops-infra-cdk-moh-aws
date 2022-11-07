import React, { ReactText } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { Flex, FlexProps, Link, Icon } from '@chakra-ui/react';

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactText;
  url: string;
  isActive: boolean;
}

const NavItem = ({ isActive, url, icon, children, ...rest }: NavItemProps) => (
  <Link
    as={RouterLink}
    to={url}
    style={{ textDecoration: 'none' }}
    _focus={{
      boxShadow: 'none',
    }}
  >
    <Flex
      align="center"
      p="4"
      mx="4"
      borderRadius="lg"
      role="group"
      color="gray.600"
      {...(isActive ? { bg: 'gray.200' } : {})}
      cursor="pointer"
      _hover={{
        bg: 'gray.200',
      }}
      {...rest}
    >
      {icon && <Icon mr="4" fontSize="16" as={icon} />}
      {children}
    </Flex>
  </Link>
);

export default NavItem;
