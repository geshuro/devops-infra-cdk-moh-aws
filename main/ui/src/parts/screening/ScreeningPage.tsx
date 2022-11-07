import React from 'react';
import { observer } from 'mobx-react-lite';
import { withRouter, useHistory, useLocation, useParams } from 'react-router-dom';
import { Box, Container, Heading, Link } from '@chakra-ui/react';
import { BasicProgressPlaceholder, ErrorBox, navigateFn } from '@aws-ee/core-ui';
import { BsChevronCompactUp, BsChevronCompactDown } from 'react-icons/bs';
import { ScreeningNavigation, ScreeningStage, statusToStage } from './ScreeningNavigation';
import { UploadFile } from './UploadFile';
import { ProcessingFile } from './ProcessingFile';
import { Screening1 } from './first/Screening1';
import { Screening2 } from './second/Screening2';
import { ScreeningSummary } from './ScreeningSummary';
import { Prisma } from './prisma/Prisma';
import { ScreeningApi, ScreeningResponse, StatusEnum } from '../../helpers/api';
import { EvidenceTable } from './EvidenceTable';

const PICOHeader = (props: { screeningDetails: ScreeningResponse }) => {
  const { screeningDetails } = props;
  const [showFull, setShowFull] = React.useState(false);

  const wrappedStyle = {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };
  const styles = !showFull ? wrappedStyle : {};

  return (
    <Box mb={'3em'}>
      <Heading background="white" p="1em 0" size="sm">
        {screeningDetails.clinicalQuestion}
      </Heading>
      <Box {...styles}>
        <p>
          <i>PICO[D]: </i>
          <br />
          P: {screeningDetails.picoP}
          <br />
          I: {screeningDetails.picoI}
          <br />
          C: {screeningDetails.picoC}
          <br />
          O: {screeningDetails.picoO}
        </p>
      </Box>
      <Link
        color="gray.400"
        textAlign="center"
        onClick={() => {
          setShowFull(!showFull);
        }}
      >
        {!showFull && (
          <>
            Show full <BsChevronCompactDown />
          </>
        )}
        {showFull && (
          <>
            Show less <BsChevronCompactUp />
          </>
        )}
      </Link>
    </Box>
  );
};

const ScreeningPage: React.FunctionComponent = () => {
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  const { screeningId, stage: stageFromNavigation } = useParams<any>();
  const stage = stageFromNavigation !== undefined ? Number(stageFromNavigation) : undefined;
  const [latestStage, setLatestStage] = React.useState<ScreeningStage | undefined>(undefined);
  /**
   * Ideally we'd like to have status/stage synced with its backend value, but due to it being async in backend
   * we use optimistic stage changes. For example, after user uploads a file we change the stage to the next one
   * without polling for it.
   * We do poll for status change for processing stages: pre screening 1, pre screening 2.
   */
  const setStage = (newStage: ScreeningStage) => navigate(`/screening/${screeningId}/${newStage}`);

  const [error, setError] = React.useState('');
  const [screeningDetails, setScreeningDetails] = React.useState<ScreeningResponse | undefined>(undefined);
  React.useEffect(() => {
    ScreeningApi.getScreening(screeningId)
      .then((screening) => {
        const latestStageTmp = statusToStage(screening.status);
        setLatestStage(latestStageTmp);
        setStage(latestStageTmp);
        setScreeningDetails(screening);
      })
      .catch((e) => setError(`${e}`));
  }, [screeningId]);

  /*
  flow:
  - [action] upload a CSV
  - [wait] processing CSV + ML
  - [action] approve/reject and hit "screening 1 complete"
  - [wait] processing accepted articles
  - [action] complete screening 2
  */

  const waitForStatusChange = (targetStatus: string, maxTimeoutMs: number) => {
    const heartbeatRateMs = 10 * 1000;
    let intervalId = -1;
    const startTime = Date.now();
    const promise = new Promise<void>((resolve, reject) => {
      intervalId = window.setInterval(async () => {
        if (Date.now() - startTime > maxTimeoutMs) {
          reject(new Error(`reached timeout waiting for status to be ${targetStatus}`));
        }
        const screeningDetails = await ScreeningApi.getScreening(screeningId);
        if (screeningDetails.status === targetStatus) {
          resolve();
        }
      }, heartbeatRateMs);
    });
    return {
      cancel: () => window.clearInterval(intervalId),
      promise,
    };
  };

  function renderStage() {
    switch (stage) {
      case ScreeningStage.UPLOAD_CSV:
        return <UploadFile screeningId={screeningId} onUploadComplete={() => setStage(ScreeningStage.PROCESSING)} />;
      case ScreeningStage.PROCESSING: {
        const statusChange = waitForStatusChange(StatusEnum.SCREENING1_AWAITING_DECISION, 30 * 60 * 1000 /* 30 min */);
        statusChange.promise.then(() => setStage(ScreeningStage.SCREENING_1));
        return <ProcessingFile onCancel={statusChange.cancel} />;
      }
      case ScreeningStage.SCREENING_1:
        return (
          <Screening1 screeningId={screeningId} onShowSummary={() => setStage(ScreeningStage.SCREENING_1_SUMMARY)} />
        );
      case ScreeningStage.SCREENING_1_SUMMARY:
        return (
          <ScreeningSummary
            screeningId={screeningId}
            screening="first"
            onFinalizeSummary={() =>
              ScreeningApi.finalizeScreening1(screeningId).then(() =>
                setStage(ScreeningStage.SCREENING_2_PRE_PROCESSING),
              )
            }
            finalizeButtonText="Mark Screening 1 as complete and start Screening 2"
          />
        );
      case ScreeningStage.SCREENING_2_PRE_PROCESSING: {
        const statusChange = waitForStatusChange(StatusEnum.SCREENING2_AWAITING_DECISION, 60 * 60 * 1000 /* 60 min */);
        statusChange.promise.then(() => setStage(ScreeningStage.SCREENING_2));
        return <ProcessingFile onCancel={statusChange.cancel} />;
      }
      case ScreeningStage.SCREENING_2:
        return <Screening2 screeningId={screeningId} onNextStep={() => setStage(ScreeningStage.SCREENING_2_SUMMARY)} />;
      case ScreeningStage.SCREENING_2_SUMMARY:
        return (
          <ScreeningSummary
            screeningId={screeningId}
            screening="second"
            onFinalizeSummary={() =>
              ScreeningApi.finalizeScreening2(screeningId).then(() => setStage(ScreeningStage.DOWNLOAD_EVIDENCE_TABLE))
            }
            finalizeButtonText="Mark Screening 2 as complete and proceed to Evidence Table"
          />
        );
      case ScreeningStage.DOWNLOAD_EVIDENCE_TABLE:
        return <EvidenceTable screeningId={screeningId} onNextStep={() => setStage(ScreeningStage.PRISMA)} />;
      case ScreeningStage.PRISMA:
        return <Prisma screeningId={screeningId} />;
      default:
        throw new Error(`stage ${stage} not supported`);
    }
  }

  function renderContent() {
    if (error) {
      return <ErrorBox error={error} className="mt3 mr0 ml0" />;
    }
    if (stage === undefined || latestStage === undefined || screeningDetails === undefined) {
      return (
        <Box>
          <BasicProgressPlaceholder segmentCount={1} className="mt3 mr0 ml0" />
        </Box>
      );
    }

    return (
      <Box>
        <PICOHeader screeningDetails={screeningDetails} />
        <ScreeningNavigation latestStage={latestStage} currentStage={stage} setStage={setStage} />
        <Box mt={10}>{renderStage()}</Box>
      </Box>
    );
  }

  return (
    <Container maxW="container.xd" pt={5}>
      <Heading size="lg">Screening Request #{screeningId}</Heading>
      {renderContent()}
    </Container>
  );
};

export default withRouter(observer(ScreeningPage));
