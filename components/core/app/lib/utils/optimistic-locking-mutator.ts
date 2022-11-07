import { ConflictException } from '@nestjs/common';
import { Condition } from 'dynamoose/dist/Condition';
import { Model, UpdatePartial, Document } from 'nestjs-dynamoose';
import { Boom } from './boom';

interface ModelWithRev {
  rev: number;
}

/*
 * TODO: This needs to be adapted to AWS SDK v3 when we migrate to
 * dynamoose v3
 */
interface AwsSdkV2ConditionalCheckFailedException {
  code: 'ConditionalCheckFailedException';
}

/**
 * A class that provides CRUD operations with optimistic locking for a
 * `dynamoose` model.
 *
 * Note: This is for CRUD only, for all query/scan operations use the
 * original model instance.
 */
export class OptimisticLockingMutator<M extends ModelWithRev, K> {
  constructor(private model: Model<M, K>) {}

  /**
   * Creates a new document. The revision counter is automatically initialized to 1.
   *
   * If an object with the given key already exists in DDB,
   * a `ConflictException` is thrown.
   *
   * @param document The doc to create
   * @returns The created doc
   */
  create(document: Omit<M, 'rev'>): Promise<Document<M>> {
    return this.runAndCatch(
      () => this.model.create({ ...document, rev: 0 } as any),
      'An object with the provided key already exists.',
    );
  }

  /**
   * Updates an existing document.
   * The revision number is automatically added and does not need to be supplied
   * in the `updateObj`.
   *
   * Note: The `rev` parameter should be set to the expected **current revision**,
   * not the next revision!
   *
   * If the rev number does not agree with the rev number in DDB,
   * a `ConflictException` is thrown.
   *
   * @param keyObj Doc key
   * @param updateObj Updates
   * @param rev Revision number
   * @returns The updated doc
   */
  update(keyObj: K, updateObj: UpdatePartial<M>, rev: number): Promise<Document<M>> {
    (updateObj as ModelWithRev).rev = rev + 1;
    return this.runAndCatch(() =>
      this.model.update(keyObj, updateObj, {
        return: 'document',
        condition: new Condition('rev').eq(rev),
      }),
    );
  }

  /**
   * Deletes an existing document.
   *
   * If the rev number does not agree with the rev number in DDB,
   * a `ConflictException` is thrown.
   *
   * @param keyObj Doc key
   * @param rev Revision number
   */
  delete(keyObj: K, rev: number): Promise<void> {
    return this.runAndCatch(
      async () =>
        this.model.delete(keyObj, {
          return: null,
          condition: new Condition('rev').eq(rev),
        } as any),
      // According to the dynamoose docs, conditional deletes are supported and the
      // dynamoose type definitions confirm this.
      // nestjs-dynamoose re-types the dynamoose model object (not sure why)
      // and removes that option, which is most likely just an oversight.
      // That's why the `any` cast is here.
    );
  }

  private async runAndCatch<T>(
    fn: () => Promise<T>,
    message = 'The object was out of date, please refresh and try again.',
  ) {
    try {
      return await fn();
    } catch (err) {
      if ((err as AwsSdkV2ConditionalCheckFailedException).code === 'ConditionalCheckFailedException') {
        throw new ConflictException(Boom.safeMsg(message));
      } else {
        throw err;
      }
    }
  }
}
