import React from 'react';
import { Box, Heading, Button } from '@chakra-ui/react';
import { ErrorBox } from '@aws-ee/core-ui';
import { ScreeningApi } from '../../helpers/api';
import { triggerDownload } from '../../helpers/triggerDownload';

export const EvidenceTable = (props: { screeningId: string; onNextStep: () => void }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  return (
    <Box>
      <Heading size="md">Evidence Table</Heading>
      <Button size="sm" mb={10} colorScheme="blue" onClick={props.onNextStep}>
        Proceed to PRISMA
      </Button>
      <br></br>
      <br></br>
      {error && <ErrorBox error={error} />}
      <Button
        size="lg"
        colorScheme="blue"
        isLoading={isLoading}
        onClick={async () => {
          setIsLoading(true);
          setError('');
          try {
            const { evidenceTable } = await ScreeningApi.downloadEvidenceTable(props.screeningId);
            triggerDownload(
              `Evidence Table ${props.screeningId}.csv`,
              // TODO: `btoa` doesn't work with special characters
              `data:text/csv;base64,${btoa(evidenceTable)}`,
            );
          } catch (e) {
            setError(`${e}`);
          } finally {
            setIsLoading(false);
          }
        }}
      >
        Download Evidence Table
      </Button>
    </Box>
  );
};
