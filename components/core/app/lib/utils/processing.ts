import _ from 'lodash';

/**
 * A utility function to process given items in sequence of batches. Items in one batch are processed in-parallel but
 * all batches are processed sequentially i..e, processing of the next batch is not started until the previous batch is
 * complete.
 *
 * @param items Array of items to process
 * @param batchSize Number of items in a batch
 * @param processorFn A function to process the batch. The function is called with the item argument.
 * The function is expected to return a Promise with some result of processing the item. If the "processorFn" throws an
 * error for any item, the "processInBatches" function will fail immediately. Processing of other items in that batch
 * may be already in-flight at that point. Due to this, if you need to handle partial batch failures or if you need
 * fine grained error handling control at individual item level, you should handle errors in the "processorFn" itself
 * (using try/catch or Promise.catch etc) and make sure that the "processorFn" does not throw any errors.
 *
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processorFn: (item: T) => Promise<R>,
): Promise<R[]> {
  const itemBatches = _.chunk(items, batchSize);

  let results: R[] = [];

  // Process all items in one batch in parallel and wait for the batch to
  // complete before moving on to the next batch
  for (let i = 0; i <= itemBatches.length; i += 1) {
    const itemsInThisBatch = itemBatches[i];
    // We need to await for each batch in loop to make sure they are awaited in sequence instead of
    // firing them in parallel disabling eslint for "no-await-in-loop" due to this
    // eslint-disable-next-line no-await-in-loop
    const resultsFromThisBatch = await Promise.all(
      //  Fire promise for each item in this batch and let it be processed in parallel
      itemsInThisBatch.map(processorFn),
    );

    // push all results from this batch into the main results array
    results = results.concat(resultsFromThisBatch);
  }
  return results;
}
