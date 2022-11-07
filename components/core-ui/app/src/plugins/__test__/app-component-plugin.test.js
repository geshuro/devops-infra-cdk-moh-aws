import plugin from '../app-component-plugin';

describe('plugin', () => {
  const location = 'location';
  const appContext = 'appContext';
  const locationAppContext = { location, appContext };
  describe('getAppComponent', () => {
    it('should return an App', () => {
      expect(plugin.getAppComponent(locationAppContext)().props.Comp.displayName).toEqual(
        'inject-with-app-userStore(withRouter(App))',
      );
    });
  });

  describe('getAutoLogoutComponent', () => {
    it('should return an AutoLogout', () => {
      expect(plugin.getAutoLogoutComponent(locationAppContext).displayName).toEqual(
        'inject-with-authentication-app(AutoLogout)',
      );
    });
  });
});
