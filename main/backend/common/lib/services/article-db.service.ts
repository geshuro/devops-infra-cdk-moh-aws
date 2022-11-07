import { isDefined } from 'class-validator';
import chunk from 'lodash/chunk';
import sum from 'lodash/sum';

import { Injectable } from '@nestjs/common';
import { TransactionSupport, InjectModel, Model, Document } from 'nestjs-dynamoose';

import { ArticleModelDefinition } from '../db/article.schema';
import { Article, ArticleKey } from '../models/article';
import { Screening } from '../models/screening';

export const articleDecisionsToOpenSearch = ({
  decisions,
  secondDecisions,
}: {
  decisions?: Article['decisions'];
  secondDecisions?: Article['secondDecisions'];
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectToReturn: any = {};

  // re-map decisions into individual items
  if (decisions) {
    if (decisions[0]) {
      objectToReturn.decision1 = decisions[0];
    }
    if (decisions[1]) {
      objectToReturn.decision2 = decisions[1];
    }
  }
  // re-map second decisions into individual items
  if (secondDecisions) {
    if (secondDecisions[0]) {
      objectToReturn.secondDecision1 = secondDecisions[0];
    }
    if (secondDecisions[1]) {
      objectToReturn.secondDecision2 = secondDecisions[1];
    }
  }

  return objectToReturn;
};

const calculateAveragePicoScore = (picoScores: (number | undefined)[]) => {
  const hasEmptyScores = picoScores.filter((score) => score === undefined).length > 0;
  if (hasEmptyScores) {
    return undefined;
  }

  if (!(picoScores.length === 4 || picoScores.length === 5)) {
    throw new Error(`invalid scores array length ${JSON.stringify(picoScores)}`);
  }

  const hasInvalidScores = picoScores.filter((score) => score! < 0 || score! > 1).length > 0;
  if (hasInvalidScores) {
    throw new Error(`invalid scores ${JSON.stringify(picoScores)}`);
  }

  const sumValue = sum(picoScores);
  return sumValue / picoScores.length;
};

export const inferAutomaticDecision = (
  picoScores: (number | undefined)[],
): 'manual' | 'rejected' | 'approved' | undefined => {
  const avg = calculateAveragePicoScore(picoScores);
  if (avg === undefined) {
    return undefined;
  }

  if (avg < 0 || avg > 1) {
    throw new Error(`invalid average ${JSON.stringify(picoScores)}`);
  }
  // TODO: check any risk for floating point inaccuracy - `(0.1 + 0.2) == 0.3 // false`
  //       https://dev.to/alldanielscott/how-to-compare-numbers-correctly-in-javascript-1l4i
  // TODO: Path To Production: adjust thresholds based on normalized values
  if (avg >= 0 && avg < 0.18888888888888888) {
    return 'rejected';
  }
  if (avg >= 0.18888888888888888 && avg <= 1) {
    return 'approved';
  }
  throw new Error(`unacceptable score ${JSON.stringify(picoScores)}`);
};

export const articleDynamoToOpenSearch = (item: Article): { item: Article; index: string } => {
  item.firstAutoReviewDecision = inferAutomaticDecision([
    item.picoPScore,
    item.picoIScore,
    item.picoCScore,
    item.picoOScore,
  ]);
  (item as any).firstAvgPico = calculateAveragePicoScore([
    item.picoPScore,
    item.picoIScore,
    item.picoCScore,
    item.picoOScore,
  ]);
  item.secondAutoReviewDecision = inferAutomaticDecision([
    item.secondPicoPScore,
    item.secondPicoIScore,
    item.secondPicoCScore,
    item.secondPicoOScore,
  ]);
  (item as any).secondAvgPico = calculateAveragePicoScore([
    item.secondPicoPScore,
    item.secondPicoIScore,
    item.secondPicoCScore,
    item.secondPicoOScore,
  ]);
  console.log(`Average scores are ${(item as any).firstAvgPico} and ${(item as any).secondAvgPico}`);

  // convert Dynamoose converted unix timestamp -> string like `2021-10-26T16:06:36.658Z` back to timestamp
  (item as any).updatedAt = new Date((item as any).updatedAt).getTime();
  (item as any).createdAt = new Date((item as any).createdAt).getTime();

  item = {
    ...item,
    ...articleDecisionsToOpenSearch({
      decisions: item.decisions,
      secondDecisions: item.secondDecisions,
    }),
  };

  return { item, index: Screening.toOpenSearchIndex(item.screeningId) };
};

@Injectable()
export class ArticleDbService extends TransactionSupport {
  constructor(
    @InjectModel(ArticleModelDefinition.name)
    private articleModel: Model<Article, ArticleKey>,
  ) {
    super();
  }

  get(key: ArticleKey): Promise<Document<Article>> {
    return this.articleModel.get(key);
  }

  create(article: Article): Promise<Document<Article>> {
    return this.articleModel.create(article);
  }

  update(key: ArticleKey, update: Partial<Article>): Promise<Document<Article>> {
    return this.articleModel.update(key, update);
  }

  // transaction API https://github.com/hardyscc/nestjs-dynamoose/issues/148
  batchUpdate(updates: { key: ArticleKey; update: Partial<Article> }[]) {
    const chunkedUpdates = chunk(updates, 25); // limit for a transaction https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html
    return Promise.all(
      chunkedUpdates.map((updateBatch) =>
        this.transaction(updateBatch.map((upd) => this.articleModel.transaction.update(upd.key, upd.update))),
      ),
    );
  }

  delete(key: ArticleKey): Promise<void> {
    return this.articleModel.delete(key);
  }

  async getByScreeningId(screeningId: string): Promise<Document<Article>[]> {
    const query = await this.articleModel.query('screeningId').eq(screeningId).using('ScreeningIdIndex').all().exec();
    return query;
  }
}
