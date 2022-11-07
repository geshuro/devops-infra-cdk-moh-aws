import { EOL } from 'os';
import { fc, itProp } from 'jest-fast-check';
import _ from 'lodash';
import { csvStringToDocuments, Document } from '../ingest-csv';

describe('csvStringToDocuments', () => {
  const toCsvString = (documents: readonly Document[]): string =>
    _.reduce(
      documents,
      (csvString, document) => `${csvString}"${document.author}","${document.title}","${document.abstract}"${EOL}`,
      `author,title,abstract${EOL}`
    );

  const stringArbitraryWithoutDoubleQuote = fc.string().filter(s => !s.includes('"'));
  itProp(
    'converts any valid csv string to Documents, only returning complete documents where filterCompleteDocuments is true',
    [
      fc.array(
        fc.record({
          title: stringArbitraryWithoutDoubleQuote,
          author: stringArbitraryWithoutDoubleQuote,
          abstract: stringArbitraryWithoutDoubleQuote,
        })
      ),
      fc.boolean(),
    ],
    async (records, filterCompleteDocuments) => {
      const expectedDocuments = filterCompleteDocuments
        ? _.filter(records, record => record.title.length > 0 && record.author.length > 0 && record.abstract.length > 0)
        : records;
      await expect(csvStringToDocuments(toCsvString(records), filterCompleteDocuments)).resolves.toEqual(
        expectedDocuments
      );
    }
  );
  itProp(
    'returns empty list given invalid csv string, or Error if csv string contains double quotes',
    [fc.string()],
    async invalidString => {
      if (_.includes(invalidString, '"'))
        expect(csvStringToDocuments(invalidString, false)).resolves.toBeInstanceOf(Error);
      else await expect(csvStringToDocuments(invalidString, false)).resolves.toEqual([]);
    }
  );
});
