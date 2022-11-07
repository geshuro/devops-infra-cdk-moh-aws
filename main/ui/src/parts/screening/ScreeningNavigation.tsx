import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { FaChevronRight } from 'react-icons/fa';
import { StatusEnum } from '../../helpers/api';

export enum ScreeningStage {
  UPLOAD_CSV = 0,
  PROCESSING,
  SCREENING_1,
  SCREENING_1_SUMMARY,
  SCREENING_2_PRE_PROCESSING,
  SCREENING_2,
  SCREENING_2_SUMMARY,
  DOWNLOAD_EVIDENCE_TABLE,
  PRISMA,
}

const ScreeningStageUiNames: { [key in ScreeningStage]: string } = {
  [ScreeningStage.UPLOAD_CSV]: 'Upload CSV',
  [ScreeningStage.PROCESSING]: 'Processing',
  [ScreeningStage.SCREENING_1]: 'Screening 1',
  [ScreeningStage.SCREENING_1_SUMMARY]: 'Screening 1 summary',
  [ScreeningStage.SCREENING_2_PRE_PROCESSING]: 'Screening 2 preprocessing',
  [ScreeningStage.SCREENING_2]: 'Screening 2',
  [ScreeningStage.SCREENING_2_SUMMARY]: 'Screening 2 summary',
  [ScreeningStage.DOWNLOAD_EVIDENCE_TABLE]: 'Download Evidence Table',
  [ScreeningStage.PRISMA]: 'PRISMA',
};

export const statusToStage = (status: string) => {
  switch (status) {
    case StatusEnum.CREATED:
      return ScreeningStage.UPLOAD_CSV;
    case StatusEnum.UPLOADED_CSV:
    case StatusEnum.PROCESSED_CSV:
    case StatusEnum.SCREENING1_WIP:
      return ScreeningStage.PROCESSING;
    case StatusEnum.SCREENING1_AWAITING_DECISION:
      return ScreeningStage.SCREENING_1;
    case StatusEnum.SCREENING1_COMPLETE:
    case StatusEnum.SCREENING2_WIP:
      return ScreeningStage.SCREENING_2_PRE_PROCESSING;
    case StatusEnum.SCREENING2_AWAITING_DECISION:
      return ScreeningStage.SCREENING_2;
    case StatusEnum.SCREENING2_COMPLETE:
      return ScreeningStage.DOWNLOAD_EVIDENCE_TABLE;
    default:
      throw new Error('unknown stage');
  }
};

export const stageToUiName = (stage: ScreeningStage) => ScreeningStageUiNames[stage];

export function ScreeningNavigation(props: {
  currentStage: ScreeningStage;
  latestStage: ScreeningStage;
  setStage: (stage: ScreeningStage) => void;
}) {
  const activeStepIndex = props.currentStage;

  return (
    <Breadcrumb spacing="8px" separator={<FaChevronRight color="gray.500" />}>
      {Object.entries(ScreeningStageUiNames).map(([stage, step], idx) => {
        const status = (() => {
          if (idx === activeStepIndex) {
            return { active: true };
          }
          if (idx <= activeStepIndex /* props.latestStage */ || idx <= props.latestStage) {
            return {};
          }
          return { disabled: true };
        })();
        const styles = (() => {
          if (status.active) {
            return { color: 'black', fontWeight: 'bold' };
          }
          if (status.disabled) {
            return { color: 'lightgrey' };
          }
          return { color: 'black' };
        })();
        return (
          <BreadcrumbItem key={step} {...styles} isCurrentPage={status.active}>
            <BreadcrumbLink
              onClick={() => {
                if (idx <= activeStepIndex /* props.latestStage */ || idx <= props.latestStage) {
                  props.setStage(idx);
                }
              }}
            >
              {step}
            </BreadcrumbLink>
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
