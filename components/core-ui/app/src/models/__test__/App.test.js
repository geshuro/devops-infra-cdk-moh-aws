import { itProp, fc } from 'jest-fast-check';
import { registerContextItems } from '../App';

describe('App', () => {
  const appContext = {};

  beforeEach(async () => {
    await registerContextItems(appContext);
    await appContext.app.init({
      tokenInfo: {
        status: 'notExpired',
      },
    });
  });

  it('initializes to authenticated', () => expect(appContext.app.userAuthenticated).toBe(true));

  it('cleans up to unauthenticated', () => {
    appContext.app.setUserAuthenticated(true);
    appContext.app.cleanup();
    expect(appContext.app.userAuthenticated).toBe(false);
  });

  itProp('executes runInAction without mutating the function', fc.func(fc.anything()), fn =>
    expect(appContext.app.runInAction(fn)).toEqual(fn()),
  );

  itProp('sets authenticated using setUserAuthenticated', fc.boolean(), userAuthenticated => {
    appContext.app.setUserAuthenticated(userAuthenticated);
    expect(appContext.app.userAuthenticated).toBe(userAuthenticated);
  });
});
