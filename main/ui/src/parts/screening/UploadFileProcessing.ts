import _ from 'lodash';
import { useState } from 'react';
import * as csv from '@fast-csv/parse';
import { ScreeningApi } from '../../helpers/api';

const parseCsv = (fileContent: string) =>
  new Promise<string[][]>((resolve, reject) => {
    const result: string[][] = [];
    csv
      .parseString(fileContent, { objectMode: true })
      .on('error', (error) => reject(error))
      .on('data', (row) => result.push(row))
      .on('end', () => resolve(result));
  });

export const useUploadFileProcessing = (props: { screeningId: string }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState('');
  const [articles, setArticles] = useState<any[] | undefined>(undefined);
  const [csvFileContent, setFileContent] = useState<string | undefined>(undefined);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) {
      // already processing a file
      return;
    }

    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'text/csv') {
      // TODO: show message
      return;
    }

    setIsProcessingFile(true);

    let fileContent: string;
    try {
      fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve((ev.target?.result ?? '') as string);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } catch (e) {
      setError('Failed to process file');
      return;
    }

    let parsedCsvArray: string[][];
    try {
      parsedCsvArray = await parseCsv(fileContent);
    } catch (e) {
      setError(`${e}`);
      return;
    }

    const [csvHeader, ...csvContent] = parsedCsvArray;
    const columns = csvHeader.map((s) => s.toLowerCase());
    const EXPECTED_COLUMNS = ['title', 'author', 'abstract', 'source'];
    const hasAllExpectedColumns = EXPECTED_COLUMNS.every((col, _) => columns.includes(col));

    setIsProcessingFile(false);

    if (!hasAllExpectedColumns) {
      setError(`Expected columns ${JSON.stringify(EXPECTED_COLUMNS)} but found ${JSON.stringify(columns)} instead`);
      setIsUploading(false);
      return;
    }

    setFileContent(fileContent);
    setArticles(csvContent);
  };

  const upload = async () => {
    if (!csvFileContent) {
      setError('Nothing to upload');
      return;
    }
    setIsUploading(true);
    try {
      await ScreeningApi.uploadCsv(props.screeningId, csvFileContent);
    } catch (e) {
      setError(`${e}`);
      setIsUploading(false);
      throw e;
    }
    setIsUploading(false);
  };

  return { articles, isProcessingFile, isUploading, error, setError, upload, onFileSelected };
};
