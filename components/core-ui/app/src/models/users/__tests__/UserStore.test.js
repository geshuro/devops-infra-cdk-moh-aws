import { registerContextItems as registerUserStore } from '../UserStore';
import { getUser } from '../../../helpers/api';

jest.mock('../../../helpers/api');

describe('UserStore', () => {
  let store = null;
  const appContext = {
    userRolesStore: { ready: true, userRoles: { get: jest.fn().mockResolvedValue({ capabilities: [] }) } },
  };
  const username = 'username';
  const newUser = {
    username,
  };

  beforeEach(async () => {
    await registerUserStore(appContext);
    store = appContext.userStore;
    getUser.mockResolvedValueOnce(newUser);
    await store.load();
  });

  describe('store', () => {
    it('should contain a user', async () => {
      expect(store.empty).toBe(false);
      expect(store.user.longDisplayName).toBe(`${username}??`);
    });
    it('should remove user via cleanup', async () => {
      await store.cleanup();
      expect(store.empty).toBe(true);
    });
  });
});
