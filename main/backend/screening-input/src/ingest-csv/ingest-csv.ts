import _ from 'lodash';
import * as csv from '@fast-csv/parse';
import { v4 as uuidv4 } from 'uuid';

const parseCsv = (fileContent: string) =>
  new Promise<string[][]>((resolve, reject) => {
    const result: string[][] = [];
    csv
      .parseString(fileContent, { objectMode: true })
      .on('error', error => reject(error))
      .on('data', row => result.push(row))
      .on('end', () => resolve(result));
  });

interface Document {
  id: string;
  title: string;
  author: string;
  abstract: string;
  source: string;
}

/**
 * @description                   returns input csv as Document array, or Error if conversion fails
 * @param input                   csv containing column names followed by document data
 * @param filterCompleteDocuments filter results to only contain documents with non-empty values in all fields?
 * @returns                       Document array corresponding to csv, or Error if conversion fails */
const csvStringToDocuments = async (
  input: string,
  filterCompleteDocuments = true
): Promise<readonly Document[] | Error> => {
  const isCompleteDocument = (document: Document): boolean =>
    !(
      _.isEmpty(document.title) ||
      _.isEmpty(document.author) ||
      _.isEmpty(document.abstract) ||
      _.isEmpty(document.source)
    );
  try {
    // copy-pasted from UI's `useUploadFileProcessing`
    const [headers, ...records] = await parseCsv(input);
    const columns = headers.map(s => s.toLowerCase());
    const EXPECTED_COLUMNS = ['title', 'author', 'abstract', 'source'];
    const hasAllExpectedColumns = EXPECTED_COLUMNS.every((col, _) => columns.includes(col));

    if (!hasAllExpectedColumns) {
      throw new Error(`missing some columns from expected list ${EXPECTED_COLUMNS}: ${JSON.stringify(columns)}`);
    }

    const documents = records.map(row => {
      const obj: Record<string, string> = {};
      for (let i = 0; i < columns.length; i += 1) {
        obj[columns[i]] = row[i];
      }
      return {
        ...obj,
        id: uuidv4(),
      } as Document;
    });
    return filterCompleteDocuments ? _.filter(documents, isCompleteDocument) : documents;
  } catch (err) {
    return err;
  }
};

export { csvStringToDocuments, Document };
