import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Switch, Redirect, useLocation, Route } from 'react-router-dom';
import { useApp, useUserStore, branding, AutoLogout, MainLayout, withAuth } from '@aws-ee/core-ui';
import { ChakraProvider } from '@chakra-ui/react';

import { defaultRoute, menuItems, routes } from './routes';

const App = observer(() => {
  const app = useApp();

  const userStore = useUserStore();

  useEffect(() => {
    document.title = branding.page.title!;
  });

  const location = useLocation();

  const routeLocationFromState = () => app.getRouteLocationFromState();

  // See https://reacttraining.com/react-router/web/api/withRouter
  const defaultRouteLocation = {
    pathname: defaultRoute,
    search: location.search, // we want to keep any query parameters
    hash: location.hash,
    state: location.state,
  };

  const renderApp = () => {
    // Get location from state if available; otherwise render default location
    let redirectLocation = routeLocationFromState();
    if (!redirectLocation) {
      redirectLocation = defaultRouteLocation;
    }

    return (
      <ChakraProvider>
        <AutoLogout />
        <MainLayout menuItems={menuItems(!!userStore.user?.isAdmin)}>
          <Switch>
            <Redirect exact from="/" to={redirectLocation} />
            {routes.map((route, idx) => (
              <Route key={idx} path={route.path} component={route.page} />
            ))}
          </Switch>
        </MainLayout>
      </ChakraProvider>
    );
  };

  return renderApp();
});

export default withAuth(App);
