import { Box, Button, Heading, Table, Tbody, Thead, Tr, Td, Th, Text } from '@chakra-ui/react';
import { FaSearch, FaUpload } from 'react-icons/fa';
import { ErrorBox } from '@aws-ee/core-ui';
import _ from 'lodash';
import { useUploadFileProcessing } from './UploadFileProcessing';
import { ScreeningApi } from '../../helpers/api';

const LIMIT_ARTICLES = 100;

export function UploadFile(props: { screeningId: string; onUploadComplete: () => void }) {
  const { error, setError, articles, upload, isUploading, isProcessingFile, onFileSelected } =
    useUploadFileProcessing(props);
  const articlesToShow = [...new Array(Math.min(LIMIT_ARTICLES, articles?.length ?? 0))].map(
    (v, idx) => articles![idx],
  );
  return (
    <Box>
      <form encType="multipart/form-data">
        {error && <ErrorBox error={error} />}
        <Box display="flex" flexDirection="row" alignItems="center">
          <Box>
            <Button
              as="label"
              htmlFor="chooseFile"
              leftIcon={<FaSearch />}
              colorScheme="blue"
              type="button"
              isLoading={isProcessingFile}
              cursor="pointer"
            >
              Choose CSV
            </Button>
            <input type="file" id="chooseFile" style={{ display: 'none' }} onChange={onFileSelected} />
            <Button
              ml={10}
              as="label"
              leftIcon={<FaUpload />}
              colorScheme="blue"
              type="button"
              disabled={!articles}
              isLoading={isUploading}
              onClick={async () => {
                setError('');
                try {
                  const { hasPdfContent } = await ScreeningApi.hasPdfContent(props.screeningId);
                  if (!hasPdfContent) {
                    setError(
                      `PDF folder is empty, please create a folder with screeningId ${props.screeningId} and upload PDF files to it.`,
                    );
                    return;
                  }

                  await upload();
                  props.onUploadComplete();
                } catch (e) {
                  setError(`${e}`);
                }
              }}
            >
              Upload CSV
            </Button>
          </Box>
          {articles && (
            <Box ml={10}>
              <Text>Articles to process: {articles.length}</Text>
            </Box>
          )}
        </Box>
      </form>
      <Heading as="h5" size="sm" mt={10}>
        Note: Please also upload PDF files to a respective folder.
      </Heading>
      {!articles ? (
        <Heading as="h5" size="sm" mt={10}>
          Note: the CSV should be of the following format and separated by commas <code>&nbsp;,&nbsp;</code>:
        </Heading>
      ) : (
        <Heading as="h5" size="sm" mt={10}>
          Showing {articlesToShow.length}
          {articlesToShow.length === LIMIT_ARTICLES && ` (max)`} of {articles.length} articles.
        </Heading>
      )}
      <Table celled padded>
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>Author</Th>
            <Th>Abstract</Th>
            <Th>PDF</Th>
          </Tr>
        </Thead>
        <Tbody>
          {!articles && (
            <Tr>
              <Td>Example article</Td>
              <Td>A. N. Author</Td>
              <Td>100-500 words of abstract</Td>
              <Td>file1.pdf</Td>
            </Tr>
          )}
          {articlesToShow.map((article) => (
            <Tr>
              {article.map((col: string) => (
                <Td>{_.truncate(col, { length: 200 })}</Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
