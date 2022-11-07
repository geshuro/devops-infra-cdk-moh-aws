/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import type { AppContext } from '../app-context/app-context';

export interface Listener {
  id: string;
  listener(event: unknown, props: { entry: Listener; channel: string }): Promise<void>;
}

class EventBus {
  private listenersMap: Record<string, Listener[]> = {};

  listenTo(channel: string, { id, listener }: Listener) {
    const entries = this.listenersMap[channel] || [];
    entries.push({ id, listener });

    this.listenersMap[channel] = entries;
  }

  async fireEvent(channel: string, event: unknown) {
    const keys = Object.keys(this.listenersMap);

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const key of keys) {
      if (key.startsWith(channel)) {
        const entries = this.listenersMap[key];
        for (const entry of entries) {
          await entry.listener(event, { entry, channel });
        }
      }
    }
  }
  /* eslint-enable no-restricted-syntax, no-await-in-loop */
  // TODO stopListening(id, channel) { }
}

export const uiEventBus = new EventBus();

// A simple key/value store that only exists while the browser tab is open.
// You can choose to store your component ui states in here when applicable.
class SessionStore {
  private map = new Map<string, unknown>();

  cleanup() {
    this.map.clear();
  }

  // remove all keys that start with the prefix
  removeStartsWith(prefix: string) {
    // map api https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
    // for of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
    const keys = this.map.keys();
    /* eslint-disable no-restricted-syntax */
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.map.delete(key);
      }
    }
    /* eslint-enable no-restricted-syntax */
  }

  get<T = unknown>(key: string): T {
    return this.map.get(key) as T;
  }

  set(key: string, value: unknown) {
    this.map.set(key, value);
  }
}

export const sessionStore = new SessionStore();

export function registerContextItems(appContext: AppContext): void {
  appContext.sessionStore = sessionStore;
  appContext.uiEventBus = uiEventBus;
}
