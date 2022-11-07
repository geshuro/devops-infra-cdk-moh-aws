import { types } from 'mobx-state-tree';
import { BaseStore } from './BaseStore';

// Must be less than or equal to 100
const DEFAULT_RESULTS_PER_PAGE = 10;

export const PaginatedBaseStore = BaseStore.named('PaginatedBaseStore')
  .props({
    resultsPerPage: DEFAULT_RESULTS_PER_PAGE,
    nextPageButtonStatus: '',
    nextToken: types.maybeNull(types.optional(types.string, '')),
  })
  .actions(() => ({
    doLoadNextPage(nextToken: string): { nextToken: string } {
      // doLoadNextPage must actually implement the loading and updating of store data.
      // It should return the `nextToken` as a property on the response.
      throw Error('Abstract, please override doLoadNextPage()');
    },
  }))
  .actions((self) => ({
    async loadNextPage() {
      if (self.nextPageButtonStatus === 'loading') return;
      const nextToken = self.nextToken;
      if (!nextToken) throw new Error('nextToken must be set to load next page');

      self.runInAction(() => {
        self.nextPageButtonStatus = 'loading';
      });

      try {
        const response = await self.doLoadNextPage(nextToken);

        self.runInAction(() => {
          self.nextToken = response.nextToken;
        });
      } catch (err) {
        self.runInAction(() => {
          self.nextPageButtonStatus = '';
          throw err;
        });
      }

      self.runInAction(() => {
        self.nextPageButtonStatus = '';
      });
    },

    updateResultsPerPage(resultsPerPage: number): void {
      if (resultsPerPage !== self.resultsPerPage) {
        self.runInAction(() => {
          self.resultsPerPage = resultsPerPage;
        });
      }
    },
  }))
  .views((self) => ({
    get isLoadingNextPage() {
      return self.nextPageButtonStatus === 'loading';
    },
  }));
