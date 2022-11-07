/* eslint-disable no-console */
import _ from 'lodash';
import numeral from 'numeral';
import { observable } from 'mobx';
import { useApplicationContext } from '../app-context/application.context';

/**
 * Converts the given Map object to an array of values from the map
 */
export function mapToArray<T>(map: Map<unknown, T>): T[] {
  const result: T[] = [];
  // converting map to result array
  map.forEach((value) => result.push(value));
  return result;
}

type ParseErrorProps = { message?: string; code?: number; status?: string | number; requestId?: string };

type ErrorExt = Error & {
  code?: number;
  status?: string | number;
  requestId?: string;
  root?: ParseErrorProps;
};

export function parseError(err: ParseErrorProps): ErrorExt {
  const message = err.message ?? 'Something went wrong';
  const { code, status, requestId } = err;
  const error: ErrorExt = new Error(message);

  error.code = code;
  error.requestId = requestId;
  error.root = err;
  error.status = status;

  return error;
}

export async function swallowError(
  promise: Promise<unknown>,
  fn: (err?: Error) => void = () => ({}),
): Promise<unknown> {
  try {
    return Promise.resolve()
      .then(() => promise)
      .catch((err) => fn(err));
  } catch (err) {
    return fn(err as Error);
  }
}

export const storage = observable({
  clear() {
    try {
      if (localStorage) return localStorage.clear();
      return window.localStorage.clear();
    } catch (err) {
      console.log(err);
      try {
        if (sessionStorage) return sessionStorage.clear();
        return window.sessionStorage.clear();
      } catch (error) {
        // if we get here, it means no support for localStorage nor sessionStorage, which is a problem
        return console.log(error);
      }
    }
  },

  getItem(key: string) {
    const deNull = (s: string | null) => s ?? undefined;
    try {
      if (localStorage) return deNull(localStorage.getItem(key));
      return deNull(window.localStorage.getItem(key));
    } catch (err) {
      console.log(err);
      try {
        if (sessionStorage) return deNull(sessionStorage.getItem(key));
        return deNull(window.sessionStorage.getItem(key));
      } catch (error) {
        // if we get here, it means no support for localStorage nor sessionStorage, which is a problem
        console.log(error);
        return undefined;
      }
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (localStorage) {
        localStorage.setItem(key, value);
      } else {
        window.localStorage.setItem(key, value);
      }
      return true;
    } catch (err) {
      console.log(err);
      try {
        if (sessionStorage) {
          sessionStorage.setItem(key, value);
        } else {
          window.sessionStorage.setItem(key, value);
        }
        return true;
      } catch (error) {
        // if we get here, it means no support for localStorage nor sessionStorage, which is a problem
        console.log(error);
        return false;
      }
    }
  },

  removeItem(key: string) {
    try {
      if (localStorage) return localStorage.removeItem(key);
      return window.localStorage.removeItem(key);
    } catch (err) {
      console.log(err);
      try {
        if (sessionStorage) return sessionStorage.removeItem(key);
        return window.sessionStorage.removeItem(key);
      } catch (error) {
        // if we get here, it means no support for localStorage nor sessionStorage, which is a problem
        return console.log(error);
      }
    }
  },
});

// a promise friendly delay function
export function delay(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    _.delay(resolve, seconds * 1000);
  });
}

export function niceNumber(value: number | string | undefined): string {
  if (value === undefined) return 'N/A';
  if (typeof value === 'string' && _.isEmpty(value)) return 'N/A';
  return numeral(value).format('0,0');
}

export function nicePrice(value: number | string | undefined): string {
  if (value === undefined) return 'N/A';
  if (typeof value === 'string' && _.isEmpty(value)) return 'N/A';
  return numeral(value).format('0,0.00');
}

// super basic plural logic, laughable
export const plural = (singleStr: string, pluralStr: string, count: number): string =>
  count === 1 ? singleStr : pluralStr;

export function getQueryParam(location: string | URL | Location, key: string): string | null {
  const queryParams = new URL(location as string).searchParams;
  return queryParams.get(key);
}

export function addQueryParams(location: string | URL | Location, params: Record<string, string>): string {
  const url = new URL(location as string);
  const queryParams = url.searchParams;

  const keys = Object.keys(params);
  keys.forEach((key) => {
    queryParams.append(key, params[key]);
  });

  let newUrl = url.origin + url.pathname;

  if (queryParams.toString()) {
    newUrl += `?${queryParams.toString()}`;
  }

  newUrl += url.hash;
  return newUrl;
}

export function removeQueryParams(location: string | URL | Location, keys: string[]): string {
  const url = new URL(location as string);
  const queryParams = url.searchParams;

  keys.forEach((key) => {
    queryParams.delete(key);
  });

  let newUrl = url.origin + url.pathname;

  if (queryParams.toString()) {
    newUrl += `?${queryParams.toString()}`;
  }

  newUrl += url.hash;
  return newUrl;
}

export const isAbsoluteUrl = (url: string): boolean => /^https?:/.test(url);

export function removeNulls(obj: Record<string, unknown> = {}): Record<string, unknown> {
  if (!obj) {
    return obj;
  }
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null) delete obj[key];
    if (_.isPlainObject(obj[key])) {
      removeNulls(obj[key] as Record<string, unknown>);
    }
  });

  return obj;
}

// remove the "start" string from "str" if it exists
export function chopLeft(str = '', start = ''): string {
  if (!str.startsWith(start)) return str;
  return str.substring(start.length);
}

// remove the "end" string from "str" if it exists
export function chopRight(str = '', end = ''): string {
  if (!str.endsWith(end)) return str;
  return str.substring(0, str.length - end.length);
}

export const isFloat = (n: number): boolean => n % 1 !== 0;

/**
 * @param arr `[ { myname: { label, desc, ..} }, { myname2: { label, desc } } ]`
 * @returns `{ myname: { label, desc, ..}, myname2: { label, desc } }`
 */
export function childrenArrayToMap(arr: Record<string, unknown>[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  arr.forEach((item) => {
    const key = Object.keys(item)[0];
    result[key] = item[key];
  });
  return result;
}

let idGeneratorCount = 0;

export function generateId(prefix = ''): string {
  idGeneratorCount += 1;
  return `${prefix}_${idGeneratorCount}_${Date.now()}_${_.random(0, 1000)}`;
}

/**
 * Given a Map and an array of items (each item MUST have an "id" prop), consolidate
 * the array in the following manner:
 *  - if an existing item in the map is no longer in the array of items, remove the item from the map
 *  - if an item in the array is not in the map, then add it to the map using the its "id" prop
 *  - if an item in the array is also in the map, then call 'mergeExistingFn' with the existing item
 *    and the new item. It is expected that this 'mergeExistingFn', will know how to merge the
 *    properties of the new item into the existing item.
 *
 * @param map The map of existing items
 * @param itemsArray The array of new items
 * @param mergeExistingFn A merge function that takes an existing and a new item and merges them
 * @param idFieldName The name of the id field (defaults to `id`)
 * @param shouldDeleteExisting Should existing items be deleted if the new items array does not contain them
 */
export function consolidateToMap<T>(
  map: Map<string, T>,
  itemsArray: T[],
  mergeExistingFn: (existing: T, newItem: T) => void,
  idFieldName = 'id',
  shouldDeleteExisting = false,
): void {
  const unprocessedKeys: Record<string, boolean> = {};

  map.forEach((_value, key) => {
    unprocessedKeys[key] = true;
  });

  itemsArray.forEach((item) => {
    const id = (item as any)[idFieldName];
    const hasExisting = map.has(id);
    const exiting = map.get(id);

    if (!exiting) {
      map.set((item as any)[idFieldName] as string, item);
    } else {
      mergeExistingFn(exiting, item);
    }

    if (hasExisting) {
      delete unprocessedKeys[id];
    }
  });

  if (!shouldDeleteExisting) {
    _.forEach(unprocessedKeys, (_value, key) => {
      map.delete(key);
    });
  }
}

export function toUTCDate(str: string | undefined): string | undefined {
  if (_.isEmpty(str)) return str;
  if (typeof str !== 'string') return str;
  if (str.endsWith('Z')) return str;

  return `${str}Z`;
}

export const validRegions = (): string[] =>
  [
    'us-east-2',
    'us-east-1',
    'us-west-1',
    'us-west-2',
    'ap-east-1',
    'ap-south-1',
    'ap-northeast-3',
    'ap-northeast-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ca-central-1',
    'cn-north-1',
    'cn-northwest-1',
    'eu-central-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-north-1',
    'me-south-1',
    'sa-east-1',
    'us-gov-east-1',
    'us-gov-west-1',
  ].sort();

/**
 * Converts bytes to a human-friendly string by representing them as KB, MB, GB,
 * etc., depending on how large the size is.
 * Adapted from https://stackoverflow.com/a/18650828
 *
 * @param bytes The number of bytes to be converted
 * @param decimals How many decimal places should be maintained
 * @returns  The human-friendly string form of the passed bytes
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * A utility function to process given items in sequence of batches. Items in one batch are processed in-parallel but
 * all batches are processed sequentially i..e, processing of the next batch is not started until the previous batch is
 * complete.
 *
 * @param items Array of items to process
 * @param batchSize Number of items in a batch
 * @param processorFn A function to process the batch. The function is called with the item argument.
 * The function is expected to return a Promise with some result of processing the item.
 */
export async function processInBatches<I = unknown, O = unknown>(
  items: I[],
  batchSize: number,
  processorFn: (input: I) => Promise<O>,
): Promise<O[]> {
  const itemBatches = _.chunk(items, batchSize);

  let results: O[] = [];

  // Process all items in one batch in parallel and wait for the batch to
  // complete before moving on to the next batch
  for (let i = 0; i <= itemBatches.length; i += 1) {
    const itemsInThisBatch = itemBatches[i];
    // We need to await for each batch in loop to make sure they are awaited in sequence instead of
    // firing them in parallel disabling eslint for "no-await-in-loop" due to this
    // eslint-disable-next-line no-await-in-loop
    const resultsFromThisBatch = await Promise.all(
      //  Fire promise for each item in this batch and let it be processed in parallel
      _.map(itemsInThisBatch, processorFn),
    );

    // push all results from this batch into the main results array
    results = results.concat(resultsFromThisBatch);
  }
  return results;
}

/**
 * A utility function that processes items sequentially. The function uses the specified processorFn to process
 * items in the given order i.e., it does not process next item in the given array until the promise returned for
 * the processing of the previous item is resolved. If the processorFn throws error (or returns a promise rejection)
 * this functions stops processing next item and the error is bubbled up to the caller (via a promise rejection).
 *
 * @param items Array of items to process
 * @param processorFn A function to process the item. The function is called with the item argument.
 * The function is expected to return a Promise with some result of processing the item.
 */
export async function processSequentially<I = unknown, O = unknown>(
  items: I[],
  processorFn: (input: I) => Promise<O>,
): Promise<O[]> {
  return processInBatches(items, 1, processorFn);
}

export function useAssets(): any {
  const ctx = useApplicationContext();
  return ctx.assets;
}
