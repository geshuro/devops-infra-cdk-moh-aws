// eslint-disable-next-line max-classes-per-file
import cloneDeep from 'lodash/cloneDeep';
import { Param, Controller, Get, UseGuards, Query } from '@nestjs/common';
import { OpenSearchDocumentService, OpenSearchSearchService } from '@aws-ee/opensearch-api';
import { Action, RequestContext } from '@aws-ee/core';
import { AbilityGuard, AssertAbilities, can, Context } from '@aws-ee/core-rest-api';
import {
  Article,
  Screening,
  ArticleDbService,
  articleDynamoToOpenSearch,
  articleDecisionsToOpenSearch,
} from '@aws-ee/backend-common';
import { Matches, IsString, IsNumberString, IsOptional, IsIn } from 'class-validator';
import type { estypes } from '@elastic/elasticsearch';
import { writeToString } from '@fast-csv/format';

import { ArticleExtended, ScreeningsService } from './screenings.service';
import { toNumber } from './utils';

// Unwrap Promise value type
// https://stackoverflow.com/a/49889856
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

class Params {
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]{1,30}$/) // some id-like format
  screeningId!: string;

  @IsOptional()
  @IsString()
  @IsIn(['approve', 'reject', 'reset'])
  decision?: 'approve' | 'reject' | 'reset';

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]{1,36}$/) // some uuid-like format
  articleId?: string;
}

class QueryValues {
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  page?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  itemsPerPage?: string;

  @IsOptional()
  @IsIn(['notReviewed', 'reviewed', 'approved', 'rejected'])
  filter?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

class BatchDecisionQueryValues extends QueryValues {
  @IsString()
  @IsIn(['manual', 'approved', 'rejected'])
  autoDecision!: 'manual' | 'approved' | 'rejected';
}

@UseGuards(AbilityGuard)
@Controller('/api/screening')
export class ScreeningController {
  constructor(
    private readonly screeningsService: ScreeningsService,
    private readonly articleDbService: ArticleDbService,
    private readonly searchService: OpenSearchSearchService,
    private readonly documentService: OpenSearchDocumentService,
  ) {}

  @Get(':screeningId')
  @AssertAbilities(can(Action.Read, Screening))
  async getScreening(@Param() params: Params, @Query() query: QueryValues): Promise<any> {
    const screening = await this.screeningsService.getStrict({ id: params.screeningId });
    return screening;
  }

  // must go above `:screeningId/:decision` pattern
  @Get(':screeningId/decision/bulk/:decision')
  @AssertAbilities(can(Action.Read, Screening))
  async batchDecision(
    @Context() ctx: RequestContext<Action, Screening>,
    @Param() params: Params,
    @Query() query: BatchDecisionQueryValues,
  ): Promise<{ id: string; decisions: NonNullable<Article['decisions']> }[]> {
    const { decision } = params;
    if (!decision) {
      return [];
    }

    /**
     * as we need to know all previous decisions on the batch we are updating it's better to just
     * re-fetch them using the same query as client instead of passing IDs + previous decisions from the client
     */
    const itemsToMakeDecisionOn = await this.listFirst(query.autoDecision, params.screeningId, query);

    return this.makeDecisionsBulk('first', itemsToMakeDecisionOn, decision, ctx.principal!.uid, params.screeningId);
  }

  @Get(':screeningId/decision/:decision/:articleId')
  @AssertAbilities(can(Action.Read, Screening))
  async decision(
    @Context() ctx: RequestContext<Action, Screening>,
    @Param() params: Params,
  ): Promise<{ manualDecisions: { madeBy: string; decision: string }[] }> {
    const { articleId, decision } = params;
    if (!articleId || !decision) {
      return { manualDecisions: [] };
    }
    const decisions = await this.makeDecision('first', articleId, decision, ctx.principal!.uid);
    return { manualDecisions: decisions };
  }

  // must go above `:screeningId/second/:decision` pattern
  @Get(':screeningId/second/decision/bulk/:decision')
  @AssertAbilities(can(Action.Read, Screening))
  async secondBatchDecision(
    @Context() ctx: RequestContext<Action, Screening>,
    @Param() params: Params,
    @Query() query: BatchDecisionQueryValues,
  ): Promise<{ id: string; decisions: NonNullable<Article['decisions']> }[]> {
    const { decision } = params;
    if (!decision) {
      return [];
    }

    const itemsToMakeDecisionOn = await this.listSecond(query.autoDecision, params.screeningId, query);

    return this.makeDecisionsBulk('second', itemsToMakeDecisionOn, decision, ctx.principal!.uid, params.screeningId);
  }

  @Get(':screeningId/second/decision/:decision/:articleId')
  @AssertAbilities(can(Action.Read, Screening))
  async secondDecision(
    @Context() ctx: RequestContext<Action, Screening>,
    @Param() params: Params,
  ): Promise<{ manualDecisions: { madeBy: string; decision: string }[] }> {
    const { articleId, decision } = params;
    if (!articleId || !decision) {
      return { manualDecisions: [] };
    }
    const decisions = await this.makeDecision('second', articleId, decision, ctx.principal!.uid);
    return { manualDecisions: decisions };
  }

  @Get(':screeningId/uploadUrl')
  @AssertAbilities(can(Action.Update, Screening))
  async getUploadUrl(@Param() params: Params): Promise<{ s3UploadUrl: string }> {
    return this.screeningsService.getUploadUrl(params.screeningId);
  }

  @Get(':screeningId/autoApproved')
  @AssertAbilities(can(Action.Read, Screening))
  async approved(@Param() params: Params, @Query() query: QueryValues): Promise<any> {
    return this.listFirst('approved', params.screeningId, query);
  }

  @Get(':screeningId/autoRejected')
  @AssertAbilities(can(Action.Read, Screening))
  async rejected(@Param() params: Params, @Query() query: QueryValues): Promise<any> {
    return this.listFirst('rejected', params.screeningId, query);
  }

  @Get(':screeningId/second/autoApproved')
  @AssertAbilities(can(Action.Read, Screening))
  async secondApproved(@Param() params: Params, @Query() query: QueryValues): Promise<any> {
    return this.listSecond('approved', params.screeningId, query);
  }

  @Get(':screeningId/second/autoRejected')
  @AssertAbilities(can(Action.Read, Screening))
  async secondRejected(@Param() params: Params, @Query() query: QueryValues): Promise<any> {
    return this.listSecond('rejected', params.screeningId, query);
  }

  @Get(':screeningId/summary1')
  @AssertAbilities(can(Action.Read, Screening))
  async summary1(@Param() params: Params): Promise<any> {
    return this.getScreening1Summary(params.screeningId);
  }

  @Get(':screeningId/summary2')
  @AssertAbilities(can(Action.Read, Screening))
  async summary2(@Param() params: Params): Promise<any> {
    return this.getScreening2Summary(params.screeningId);
  }

  @Get(':screeningId/evidenceTable')
  @AssertAbilities(can(Action.Read, Screening))
  async evidenceTable(@Param() params: Params): Promise<{ evidenceTable: string }> {
    const evidenceRows = await this.getEvidenceTableRows(params.screeningId);
    const csvString = await writeToString(evidenceRows);
    return { evidenceTable: csvString };
  }

  private async getEvidenceTableRows(screeningId: string) {
    const { body: openSearchData } = await this.searchService.searchIndex({
      index: Screening.toOpenSearchIndex(screeningId),
      /* note the absence of from/size parameters
       * OpenSearch limit is 10k results, so no pagination here
       */
      query: {
        query: {
          query_string: {
            query: secondManuallyApprovedQuery,
          },
        },
      },
    });
    const articlesUnsafe = openSearchData?.hits?.hits?.map((hit) => {
      const source = hit._source;
      if (!source) {
        return undefined;
      }
      if (!isArticle(source)) {
        return undefined;
      }
      return source;
    });
    const articles = articlesUnsafe.filter(Boolean) as ArticleExtended[];
    const headersRow = ['title', 'author', 'abstract', 'url'];
    const mappedArticles = articles.map((article) => ({
      title: article.title,
      author: article.author,
      abstract: article.abstract,
      url: article.source,
    }));
    return [headersRow, ...mappedArticles];
  }

  @Get(':screeningId/phase1Complete')
  @AssertAbilities(can(Action.Read, Screening))
  async phase1Complete(@Param() params: Params): Promise<any> {
    await this.screeningsService.startScreeningPhase2(params.screeningId);
    return {};
  }

  @Get(':screeningId/phase2Complete')
  @AssertAbilities(can(Action.Read, Screening))
  async phase2Complete(@Param() params: Params): Promise<any> {
    await this.screeningsService.completeScreeningPhase2(params.screeningId);
    return {};
  }

  @Get(':screeningId/hasPdfContent')
  @AssertAbilities(can(Action.Read, Screening))
  async hasPdfContent(@Param() params: Params): Promise<{ hasPdfContent: boolean }> {
    return { hasPdfContent: await this.screeningsService.hasPdfContent(params.screeningId) };
  }

  private async getScreening1Summary(screeningId: string) {
    return this.getScreeningSummary(screeningId, (autoReviewDecision: 'manual' | 'approved' | 'rejected') => ({
      notReviewed: `firstAutoReviewDecision:${autoReviewDecision} AND ${noDecision}`,
      approved: `firstAutoReviewDecision:${autoReviewDecision} AND ${manuallyApprovedQuery}`,
      rejected: `firstAutoReviewDecision:${autoReviewDecision} AND ${manuallyRejectedQuery}`,
    }));
  }

  private async getScreening2Summary(screeningId: string) {
    return this.getScreeningSummary(screeningId, (autoReviewDecision: 'manual' | 'approved' | 'rejected') => ({
      notReviewed: `secondAutoReviewDecision:${autoReviewDecision} AND ${secondNoDecision}`,
      approved: `secondAutoReviewDecision:${autoReviewDecision} AND ${secondManuallyApprovedQuery}`,
      rejected: `secondAutoReviewDecision:${autoReviewDecision} AND ${secondManuallyRejectedQuery}`,
    }));
  }

  // TODO: bug alert! if there are 2 opposing decisions an article will NOT be accounted for
  private async getScreeningSummary(
    screeningId: string,
    getQueries: (autoReviewDecision: 'manual' | 'approved' | 'rejected') => Record<string, string>,
  ) {
    await this.screeningsService.getStrict({ id: screeningId });

    const executeQuery = async (q: string) => {
      const { body: openSearchData } = await this.searchService.searchIndex({
        index: Screening.toOpenSearchIndex(screeningId),
        query: {
          // only interested in total count, not actual results
          from: 0,
          size: 0,
          query: {
            query_string: {
              query: q,
            },
          },
        },
      });
      return openSearchData;
    };

    const createQueries = (autoReviewDecision: 'manual' | 'approved' | 'rejected') => {
      const queries = getQueries(autoReviewDecision);
      const obj: Record<string, Promise<estypes.SearchResponse<unknown>>> = {};
      for (const [key, val] of Object.entries(queries)) {
        obj[key] = executeQuery(val);
      }
      return obj;
    };

    const waitAndMapQueries = async (queries: ReturnType<typeof createQueries>) => {
      await Promise.all(Object.values(queries));
      const result: { [key: string]: number } = {};
      for (const [key, queryPromise] of Object.entries(queries)) {
        const response = await queryPromise;
        result[key] = toNumber(response?.hits.total ?? 0);
      }
      return result;
    };

    // TODO: use multi search https://www.elastic.co/guide/en/elasticsearch/reference/current/search-multi-search.html
    // instead of 3x3=9 queries

    const manualReviewQueries = createQueries('manual');
    const autoApprovedQueries = createQueries('approved');
    const autoRejectedQueries = createQueries('rejected');

    const manualReviewResults = await waitAndMapQueries(manualReviewQueries);
    const autoApprovedResults = await waitAndMapQueries(autoApprovedQueries);
    const autoRejectedResults = await waitAndMapQueries(autoRejectedQueries);

    return {
      manualReview: manualReviewResults,
      autoApproved: autoApprovedResults,
      autoRejected: autoRejectedResults,
    };
  }

  private async listFirst(
    autoReviewDecision: 'manual' | 'approved' | 'rejected',
    screeningId: string,
    query: QueryValues,
  ) {
    const filterRequested = query.filter;
    // TODO: add `indecisive` filter for mixed decisions (applicable for 2+ technicians)
    const filter = (() => {
      if (!filterRequested) {
        return undefined;
      }
      if (filterRequested === 'notReviewed') {
        return noDecision;
      }
      if (filterRequested === 'reviewed') {
        return `(${manuallyApprovedQuery} OR ${manuallyRejectedQuery})`;
      }
      if (filterRequested === 'approved') {
        return manuallyApprovedQuery;
      }
      if (filterRequested === 'rejected') {
        return manuallyRejectedQuery;
      }
      throw new Error(`unknown filter type ${filterRequested}`);
    })();
    const embedFilterQuery = filter ? `AND ${filter}` : '';

    return this.list(`firstAutoReviewDecision:"${autoReviewDecision}" ${embedFilterQuery}`, screeningId, query, [
      {
        firstAvgPico: {
          order: 'desc',
          unmapped_type: 'double',
        },
      },
      {
        createdAt: {
          order: 'asc',
        },
      },
    ]);
  }

  private async listSecond(
    autoReviewDecision: 'manual' | 'approved' | 'rejected',
    screeningId: string,
    query: QueryValues,
  ) {
    const filterRequested = query.filter;
    const filter = (() => {
      if (!filterRequested) {
        return undefined;
      }
      if (filterRequested === 'notReviewed') {
        return secondNoDecision;
      }
      if (filterRequested === 'reviewed') {
        return `(${secondManuallyApprovedQuery} OR ${secondManuallyRejectedQuery})`;
      }
      if (filterRequested === 'approved') {
        return secondManuallyApprovedQuery;
      }
      if (filterRequested === 'rejected') {
        return secondManuallyRejectedQuery;
      }
      throw new Error(`unknown filter type ${filterRequested}`);
    })();
    const embedFilterQuery = filter ? `AND ${filter}` : '';

    return this.list(
      `(secondAutoReviewDecision:${autoReviewDecision}) AND ${manuallyApprovedQuery} ${embedFilterQuery}`,
      screeningId,
      query,
      [
        {
          secondAvgPico: {
            order: 'desc',
            unmapped_type: 'double',
          },
        },
        {
          createdAt: {
            order: 'asc',
          },
        },
      ],
    );
  }

  private async list(addedStringQuery: string, screeningId: string, query: QueryValues, sort: estypes.SortContainer[]) {
    if (!screeningId) {
      throw new Error(`no 'screeningId' provided`);
    }
    const page = query.page;
    const pageNumber = page !== undefined ? Number(page) : 1;
    if (pageNumber < 1 || pageNumber > 9999) {
      throw new Error(`page beyond limits`);
    }

    const itemsPerPage = query.itemsPerPage;
    const itemsPerPageNumber = itemsPerPage !== undefined ? Number(itemsPerPage) : 10;
    if (itemsPerPageNumber < 10 || pageNumber > 100) {
      throw new Error(`itemsPerPage beyond limits`);
    }

    const searchTerms = query.search ?? '';
    const searchQuery = searchTerms ? ` AND (${searchTerms})` : '';

    // might throw
    await this.screeningsService.getStrict({ id: screeningId });

    // TODO: maybe use scroll operation? https://opensearch.org/docs/latest/opensearch/ux/#scroll-search
    const { body: openSearchData } = await this.searchService.searchIndex({
      index: Screening.toOpenSearchIndex(screeningId),
      query: {
        from: itemsPerPageNumber * (pageNumber - 1),
        size: itemsPerPageNumber,
        query: {
          query_string: {
            query: `${addedStringQuery} ${searchQuery}`,
          },
        },
        sort,
      },
    });
    const articlesUnsafe =
      openSearchData?.hits?.hits?.map((hit) => {
        const source = hit._source;
        if (!source) {
          return undefined;
        }
        if (!isArticle(source)) {
          return undefined;
        }
        return source;
      }) ?? [];
    const articles = articlesUnsafe.filter(Boolean) as ArticleExtended[];
    return {
      items: articles.map((article) => ({
        id: article.id,
        title: article.title,
        abstract: article.abstract,
        firstAvgPico: article.firstAvgPico,
        secondAvgPico: article.secondAvgPico,
        pico: [article.picoPScore, article.picoIScore, article.picoCScore, article.picoOScore],
        secondPico: [
          article.secondPicoPScore,
          article.secondPicoIScore,
          article.secondPicoCScore,
          article.secondPicoOScore,
        ],
        firstAutoReviewDecision: article.firstAutoReviewDecision,
        manualDecisions: [article.decision1, article.decision2].filter(Boolean),
        secondManualDecisions: [article.secondDecision1, article.secondDecision2].filter(Boolean),
      })),
      totalItems: toNumber(openSearchData?.hits?.total ?? 0),
      totalPages: Math.ceil(toNumber(openSearchData?.hits?.total ?? itemsPerPageNumber) / itemsPerPageNumber),
    };
  }

  private async makeDecision(
    screeningStage: 'first' | 'second',
    articleId: string,
    decision: 'approve' | 'reject' | 'reset',
    userId: string,
  ) {
    const decisionsKey: keyof Article = screeningStage === 'first' ? 'decisions' : 'secondDecisions';
    const decisionsSummaryKey: keyof Article =
      screeningStage === 'first' ? 'firstDecisionSummary' : 'secondDecisionSummary';

    const article = await this.articleDbService.get({ id: articleId });
    const prevDecisions = article[decisionsKey] ?? [];
    const decisions = this.mergeDecisions(prevDecisions, decision, userId);
    article[decisionsKey] = decisions;
    article[decisionsSummaryKey] = this.calculateDecisionSummary(decisions);
    const { item, index } = articleDynamoToOpenSearch(article);
    await this.documentService.overwriteDocument({
      index,
      body: item,
      options: openSearchRequestOptions,
    });
    await this.articleDbService.update(
      { id: articleId },
      {
        [decisionsKey]: decisions,
        [decisionsSummaryKey]: this.calculateDecisionSummary(decisions),
      },
    );
    return decisions;
  }

  private async makeDecisionsBulk(
    screeningStage: 'first' | 'second',
    itemsToMakeDecisionOn: Awaited<ReturnType<typeof this.list>>,
    decision: 'approve' | 'reject' | 'reset',
    userId: string,
    screeningId: string,
  ) {
    const decisionsKey: keyof Article = screeningStage === 'first' ? 'decisions' : 'secondDecisions';
    const decisionsSummaryKey: keyof Article =
      screeningStage === 'first' ? 'firstDecisionSummary' : 'secondDecisionSummary';
    const openSearchDecisionsKey = screeningStage === 'first' ? 'manualDecisions' : 'secondManualDecisions';

    // OpenSearch updates
    const openSearchUpdates = itemsToMakeDecisionOn.items.map((item) => {
      const decisions = this.mergeDecisions(item[openSearchDecisionsKey], decision, userId);
      return {
        operation: { update: { _id: item.id } as Partial<estypes.BulkUpdateOperation> as estypes.BulkUpdateOperation },
        body: {
          [decisionsKey]: decisions,
          [decisionsSummaryKey]: this.calculateDecisionSummary(decisions),
          ...articleDecisionsToOpenSearch({
            [decisionsKey]: decisions,
          }),
        },
      };
    });
    await this.documentService.bulkDocuments({
      index: Screening.toOpenSearchIndex(screeningId),
      bodies: openSearchUpdates,
      options: openSearchRequestOptions,
    });

    // DDB updates
    const updates = itemsToMakeDecisionOn.items.map((item) => {
      const decisions = this.mergeDecisions(item[openSearchDecisionsKey], decision, userId);
      return {
        key: { id: item.id },
        update: {
          [decisionsKey]: decisions,
          [decisionsSummaryKey]: this.calculateDecisionSummary(decisions),
        },
      };
    });
    await this.articleDbService.batchUpdate(updates);

    return updates.map((item) => ({
      id: item.key.id,
      decisions: item.update[decisionsKey] as NonNullable<Article['decisions']>,
    }));
  }

  private mergeDecisions(
    decisions: NonNullable<Article['decisions']>,
    decision: 'approve' | 'reject' | 'reset',
    userId: string,
  ): NonNullable<Article['decisions']> {
    decisions = cloneDeep(decisions);

    // change decision
    const previousDecisionIndex = decisions.findIndex((item) => item.madeBy === userId);

    if (decision === 'reset') {
      if (previousDecisionIndex !== -1) {
        decisions.splice(previousDecisionIndex);
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (previousDecisionIndex !== -1) {
        decisions[previousDecisionIndex].decision = decision;
      } else {
        decisions.push({ madeBy: userId, decision });
      }
    }

    return decisions;
  }

  private calculateDecisionSummary(decisions: NonNullable<Article['decisions']>) {
    // no decision defaults to be 'rejected'.
    // but this shouldn't matter as the only way to proceed to a next screening stage is to make a decision about every item.
    return decisions.length > 0 && decisions.every((d) => d.decision === 'approve') ? 'approved' : 'rejected';
  }
}

const isArticle = (obj: unknown): obj is Article => {
  const expectedFields: (keyof Article)[] = ['id', 'title', 'abstract', 'screeningId'];
  return expectedFields.every((key) => (obj as Article)[key] !== undefined);
};

const openSearchRequestOptions = {
  /**
   * To provide consistent writes, as by default they are eventually consistent.
   * This happens due to a `refresh` operation which internally defaults to 1 second cycled flushes.
   * Setting it to `wait_for` will make a request to OpenSearch resolve only after the flush was made and changes were _really_ written.
   * https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-refresh.html
   */
  refresh: 'wait_for' as estypes.Refresh,
};

const noDecision = `NOT _exists_:decision1`;
const manuallyApprovedQuery = `(decision1.decision:approve AND ((NOT _exists_:decision2) OR decision2.decision:approve))`;
const manuallyRejectedQuery = `(decision1.decision:reject AND ((NOT _exists_:decision2) OR decision2.decision:reject))`;

const secondNoDecision = `NOT _exists_:secondDecision1`;
const secondManuallyApprovedQuery = `(secondDecision1.decision:approve AND ((NOT _exists_:secondDecision2) OR secondDecision2.decision:approve))`;
const secondManuallyRejectedQuery = `(secondDecision1.decision:reject AND ((NOT _exists_:secondDecision2) OR secondDecision2.decision:reject))`;
