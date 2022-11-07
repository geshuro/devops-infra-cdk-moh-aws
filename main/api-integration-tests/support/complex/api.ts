/* eslint-disable no-console */
/**
 * @description       gets api, retrying after *wait* ms (up to maxWait ms) on failure
 * @param doCall      function wrapping api call to capture boom error code
 * @param axiosClient gets the requested data
 * @param api         url from which to get the data
 * @param params      query string map; for example the object { foo: 'x', bar: 'y' } represents '?foo=x&bar=y'
 * @param wait        ms to wait between failed requests
 * @param maxWait     ms to wait in total before returning undefined
 * @returns           response from get request, or undefined if this was unsuccessful */
const getWithRetry = async (doCall, axiosClient, api, params, wait = 10, maxWait = 1000) => {
  let totalWait = 0;
  while (totalWait < maxWait) {
    if (totalWait > 0) console.log(`Retrying get ${api}`);
    try {
      return await doCall(async () => axiosClient.get(api, { params }));
    } catch (err) {
      // console.log(`Failed get (expected for some negative tests): ${(err as Error).message}`);
    }
    await new Promise(a => setTimeout(a, wait));
    totalWait += wait;
  }
  return undefined;
};

/**
 * @description       gets api, retrying after *wait* ms (up to maxWait ms) if response contains empty items property
 * @param doCall      function wrapping api call to capture boom error code
 * @param axiosClient gets the requested data
 * @param api         url from which to get the data
 * @param params      query string map; for example the object { foo: 'x', bar: 'y' } represents '?foo=x&bar=y'
 * @param wait        ms to wait between failed requests
 * @param maxWait     ms to wait in total before returning undefined
 * @returns           response from get request containing non-empty items, or undefined if this was unsuccessful */
const getItemsWithRetry = async (doCall, axiosClient, api, params, wait = 10, maxWait = 1000) => {
  let totalWait = 0;
  while (totalWait < maxWait) {
    if (totalWait > 0) console.log(`Retrying get ${api}`);
    try {
      const result = await doCall(async () => axiosClient.get(api, { params }));
      if (result.items.length > 0) return result;
    } catch (e) {
      console.log(`While retrying encountered an error ${(e as Error).message}`);
      throw e;
    }
    await new Promise(a => setTimeout(a, wait));
    totalWait += wait;
  }
  return undefined;
};

module.exports = { getItemsWithRetry, getWithRetry };
