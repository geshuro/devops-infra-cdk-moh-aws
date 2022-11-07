// eslint-disable-next-line max-classes-per-file
import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { Screening, StatusEnum } from '@aws-ee/backend-common';
import { AbilityGuard, AssertAbilities, can, Context } from '@aws-ee/core-rest-api';
import { Action, RequestContext } from '@aws-ee/core';
import { OpenSearchSearchService } from '@aws-ee/opensearch-api';
import { IsString, IsNumberString, IsOptional, IsIn } from 'class-validator';
import { ScreeningsService } from './screenings.service';
import { CreateScreeningDtoFromClient } from './CreateScreeningDto';
import { toNumber } from './utils';

class QueryValues {
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  page?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  itemsPerPage?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

@UseGuards(AbilityGuard)
@Controller('/api/screenings')
export class ScreeningsController {
  constructor(
    private readonly screeningsService: ScreeningsService,
    private readonly searchService: OpenSearchSearchService,
  ) {}

  @Post()
  @AssertAbilities(can(Action.Create, Screening))
  create(@Context() ctx: RequestContext<Action, Screening>, @Body() screeningRequest: CreateScreeningDtoFromClient) {
    const createdBy = ctx.principal!.uid;
    return this.screeningsService.create({
      ...screeningRequest,
      createdBy,
      status: StatusEnum.CREATED,
    });
  }

  @Get()
  @AssertAbilities(can(Action.Read, Screening))
  async list(@Query() query: QueryValues) {
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
    const queryString = searchTerms;
    const openSearchQuery =
      queryString && queryString.length > 0
        ? {
            query: {
              query_string: {
                query: queryString,
              },
            },
          }
        : {};

    const { body: openSearchData } = await this.searchService.searchIndex({
      index: 'screenings',
      query: {
        from: itemsPerPageNumber * (pageNumber - 1),
        size: itemsPerPageNumber,
        ...openSearchQuery,
        sort: {
          createdAt: {
            order: 'desc',
          },
        },
      },
    });
    const screenings = openSearchData?.hits?.hits?.map((hit) => {
      const source = hit._source;
      if (!source) {
        return undefined;
      }
      if (!isScreening(source)) {
        return undefined;
      }
      return source;
    });
    return {
      items: screenings,
      totalItems: toNumber(openSearchData?.hits?.total ?? 0),
      totalPages: Math.ceil(toNumber(openSearchData?.hits?.total ?? itemsPerPageNumber) / itemsPerPageNumber),
    };
  }
}

const isScreening = (obj: unknown): obj is Screening => {
  const expectedFields: (keyof Screening)[] = ['id', 'createdBy', 'clinicalQuestion'];
  return expectedFields.every((key) => (obj as Screening)[key] !== undefined);
};
