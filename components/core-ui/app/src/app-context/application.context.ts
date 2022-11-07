import { createContext, useContext } from 'react';
import type { AppContext } from './app-context';

export const ApplicationContext = createContext<AppContext | null>(null);

export function useApplicationContext(): AppContext {
  const ctx = useContext(ApplicationContext);
  if (!ctx) {
    throw Error('ApplicationContext was null, please check that it is not called outside of a component!');
  }
  return ctx;
}
