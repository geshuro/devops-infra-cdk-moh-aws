import { itProp, fc } from 'jest-fast-check';
import { registerContextItems } from '../Cleaner';

describe('Cleaner', () => {
  itProp('cleans up correctly', fc.integer(), async interval => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const disposer = jest.fn();
    const cleanup = jest.fn();
    const intervalFunction = setInterval(fn, interval);
    const appContext = {
      disposers: { disposer },
      intervalIds: { intervalFunction },
      clean: { cleanup },
    };
    await registerContextItems(appContext);
    appContext.cleaner.cleanup();
    expect(appContext.disposers).toEqual({});
    expect(appContext.intervalIds).toEqual({});
    expect(disposer).toHaveBeenCalledTimes(1);
    expect(clearInterval).toHaveBeenLastCalledWith(intervalFunction);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
