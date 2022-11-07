import React from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useHistory } from 'react-router-dom';
import { Box, useColorModeValue, Drawer, DrawerContent, useDisclosure } from '@chakra-ui/react';

import { displayError } from '../../helpers/notification';
import { useAuthenticationStore } from '../../models/authentication/Authentication';
import { MenuItem as CustomMenuItem } from '../../models/Menu';
import { useUserStore } from '../../models/users/UserStore';
import { useAssets } from '../../helpers/utils';
import SidebarContent from './SidebarContent';
import TopNav from './TopNav';
import { navigateFn } from '../../helpers/routing';

const MainLayout = observer(({ menuItems, children }: { menuItems: CustomMenuItem[]; children?: JSX.Element }) => {
  const authentication = useAuthenticationStore();
  const userStore = useUserStore();
  const location = useLocation();
  const assets = useAssets();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = navigateFn({
    history: useHistory(),
    location,
  });

  const handleLogout = async (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await authentication.logout();
    } catch (error) {
      displayError(error as Error);
    }
  };

  const handleProfile = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();

    navigate('/user/view');
  };

  const currentUser = userStore.user;
  const displayName = currentUser?.displayName ?? 'Not Logged In';
  const pathname = location?.pathname ?? '';

  const itemsArr = menuItems || [];
  return (
    <Box minH="100vh">
      <SidebarContent
        bg={useColorModeValue('gray.50', 'gray.900')}
        logoImg={assets.images.logoImage}
        currentPath={pathname}
        menuItems={itemsArr}
        mt="80px"
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent
            menuItems={itemsArr}
            currentPath={pathname}
            logoImg={assets.images.logoImage}
            onClose={onClose}
          />
        </DrawerContent>
      </Drawer>
      <TopNav
        displayName={displayName}
        logoImg={assets.images.logoImage}
        handleLogout={handleLogout}
        handleProfile={handleProfile}
        onOpenMenu={onOpen}
      />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
});

export default MainLayout;
