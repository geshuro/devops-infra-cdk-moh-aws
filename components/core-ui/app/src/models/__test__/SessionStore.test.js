import _ from 'lodash/fp';
import { itProp, fc } from 'jest-fast-check';
import { registerContextItems } from '../SessionStore';

describe('SessionStore', () => {
  const initialiseSessionStore = async () => {
    const appContext = {};
    await registerContextItems(appContext);
    return appContext;
  };

  itProp('sets, gets and cleans up key/value pairs', [fc.anything(), fc.anything()], async (key, value) => {
    const appContext = await initialiseSessionStore();
    const sessionStore = appContext.sessionStore;
    sessionStore.set(key, value);
    expect(sessionStore.get(key)).toEqual(value);
    expect(_.isEmpty(sessionStore.map)).toBe(false);
    sessionStore.cleanup();
    expect(_.isEmpty(sessionStore.map)).toBe(true);
  });

  itProp(
    'removes items iff key begins with prefix via removeStartsWith',
    [fc.string(), fc.string(), fc.anything()],
    async (prefix, postfix, value) => {
      fc.pre(_.negate(_.startsWith(prefix))(postfix)); // Skip test if postfix begins with prefix
      const appContext = await initialiseSessionStore();
      const sessionStore = appContext.sessionStore;
      const prefixKey = `${prefix}${postfix}`;
      sessionStore.set(prefixKey, value);
      sessionStore.set(postfix, value);
      sessionStore.removeStartsWith(prefix);
      expect(sessionStore.get(postfix)).toEqual(value);
      expect(sessionStore.get(prefixKey)).toBeUndefined();
    },
  );

  itProp('listens to specified items', [fc.string(), fc.anything(), fc.anything()], async (channel, id, event) => {
    const listener = jest.fn();
    const appContext = await initialiseSessionStore();
    const uiEventBus = appContext.uiEventBus;
    uiEventBus.listenTo(channel, { id, listener });
    await uiEventBus.fireEvent(channel, event);
    expect(listener).toHaveBeenCalledWith(event, {
      entry: { id, listener },
      channel,
    });
  });
});
