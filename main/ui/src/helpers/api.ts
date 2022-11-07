import { httpApiGet, httpApiPost } from '@aws-ee/core-ui';
import _ from 'lodash';

export function getHelloMessages() {
  return httpApiGet<{ message: string }[]>('api/hello');
}

interface PaginatedSearchableRequestParams {
  page: string;
  search?: string;
  itemsPerPage?: string;
}

export const ScreeningsApi = {
  async create(data: any): Promise<{ id: string }> {
    return httpApiPost('api/screenings', { data, params: {} });
  },

  async list(params: PaginatedSearchableRequestParams): Promise<ScreeningsTableProps> {
    return httpApiGet('api/screenings', { params: cleanupParams(params) });
  },
};

export interface Decision {
  madeBy: string;
  decision: 'approve' | 'reject';
}

export interface ArticleType {
  id: string;
  screeningId: string;
  title: string;
  abstract: string;
  pico: number[];
  autoDecision: 'manual' | 'approved' | 'rejected';
  manualDecisions?: Decision[];
}

export interface ArticleScreening2Type extends ArticleType {
  secondManualDecisions?: Decision[];
  secondPico: number[];
}

export interface TablePaginationProps {
  totalPages: number;
  totalItems: number;
}

interface Screening1TableData {
  items: ArticleType[];
}

interface Screening2TableData {
  items: ArticleScreening2Type[];
}

export type Screening1TableProps = Screening1TableData & TablePaginationProps;
export type Screening2TableProps = Screening2TableData & TablePaginationProps;

export interface ScreeningType {
  id: string;
  clinicalQuestion: string;
  picoP: string;
  picoI: string;
  picoC: string;
  picoO: string;
  picoD: string;
  createdAt: string;
  status: string;
}

interface ScreeningsTable {
  items: ScreeningType[];
}

export type ScreeningsTableProps = ScreeningsTable & TablePaginationProps;

export interface ScreeningSummaryResponse {
  manualReview: {
    notReviewed: number;
    approved: number;
    rejected: number;
  };
  autoApproved: {
    notReviewed: number;
    approved: number;
    rejected: number;
  };
  autoRejected: {
    notReviewed: number;
    approved: number;
    rejected: number;
  };
}

export type Filter = 'notReviewed' | 'reviewed' | 'approved' | 'rejected';

interface ScreeningRequestParams extends PaginatedSearchableRequestParams {
  filter?: Filter;
}

/**
 * @see main/backend/common/lib/models/status.ts StatusEnum
 */
export const enum StatusEnum {
  CREATED = 'CREATED',
  UPLOADED_CSV = 'UPLOADED_CSV',
  PROCESSED_CSV = 'PROCESSED_CSV',
  SCREENING1_WIP = 'SCREENING1_WIP',
  SCREENING1_AWAITING_DECISION = 'SCREENING1_AWAITING_DECISION',
  SCREENING1_COMPLETE = 'SCREENING1_COMPLETE',
  SCREENING2_WIP = 'SCREENING2_WIP',
  SCREENING2_AWAITING_DECISION = 'SCREENING2_AWAITING_DECISION',
  SCREENING2_COMPLETE = 'SCREENING2_COMPLETE',
  EVIDENCE_TABLE_COMPLETE = 'EVIDENCE_TABLE_COMPLETE',
}

export interface ScreeningResponse {
  id: string;
  clinicalQuestion: string;
  picoP: string;
  picoI: string;
  picoC: string;
  picoO: string;
  status: StatusEnum;
}

const cleanupParams = (params: ScreeningRequestParams): Record<string, string> =>
  // https://stackoverflow.com/a/31209300
  // remove all keys that have falsey values
  _.omitBy(params, (v) => !v) as Record<string, string>;

export const ScreeningApi = {
  getScreening(screeningId: string) {
    return httpApiGet<ScreeningResponse>(`api/screening/${screeningId}`);
  },

  finalizeScreening1(screeningId: string) {
    return httpApiGet<{}>(`api/screening/${screeningId}/phase1Complete`);
  },

  finalizeScreening2(screeningId: string) {
    return httpApiGet<{}>(`api/screening/${screeningId}/phase2Complete`);
  },

  screening1Summary(screeningId: string) {
    return httpApiGet<ScreeningSummaryResponse>(`api/screening/${screeningId}/summary1`);
  },

  screening2Summary(screeningId: string) {
    return httpApiGet<ScreeningSummaryResponse>(`api/screening/${screeningId}/summary2`);
  },

  makeDecisionScreening1(screeningId: string, articleId: string, decision: 'approve' | 'reject' | 'reset') {
    return httpApiGet<{ manualDecisions: ArticleType['manualDecisions'] }>(
      `api/screening/${screeningId}/decision/${decision}/${articleId}`,
    );
  },

  makeDecisionScreening2(screeningId: string, articleId: string, decision: 'approve' | 'reject' | 'reset') {
    return httpApiGet<{ manualDecisions: ArticleType['manualDecisions'] }>(
      `api/screening/${screeningId}/second/decision/${decision}/${articleId}`,
    );
  },

  makeBulkDecisionScreening1(
    screeningId: string,
    decision: 'approve' | 'reject' | 'reset',
    params: ScreeningRequestParams & { autoDecision: 'manual' | 'approved' | 'rejected' },
  ) {
    return httpApiGet<{ id: string; decisions: ArticleType['manualDecisions'] }[]>(
      `api/screening/${screeningId}/decision/bulk/${decision}`,
      {
        params: cleanupParams(params),
      },
    );
  },

  makeBulkDecisionScreening2(
    screeningId: string,
    decision: 'approve' | 'reject' | 'reset',
    params: ScreeningRequestParams & { autoDecision: 'manual' | 'approved' | 'rejected' },
  ) {
    return httpApiGet<{ id: string; decisions: ArticleType['manualDecisions'] }[]>(
      `api/screening/${screeningId}/second/decision/bulk/${decision}`,
      {
        params: cleanupParams(params),
      },
    );
  },

  loadReviewScreening1(
    screeningId: string,
    type: 'manualReview' | 'autoApproved' | 'autoRejected' | 'second',
    params: ScreeningRequestParams,
  ) {
    return httpApiGet<Screening1TableProps>(`api/screening/${screeningId}/${type}`, { params: cleanupParams(params) });
  },

  loadReviewScreening2(
    screeningId: string,
    type: 'manualReview' | 'autoApproved' | 'autoRejected' | 'second',
    params: ScreeningRequestParams,
  ) {
    return httpApiGet<Screening2TableProps>(`api/screening/${screeningId}/second/${type}`, {
      params: cleanupParams(params),
    });
  },

  async uploadCsv(screeningId: string, fileContent: string): Promise<void> {
    // TODO: add a check to EVERY stage of a controller that ensures state consistency.
    //       in this case, don't allow upload if a screening is already at a later stage
    const { s3UploadUrl, s3UploadParams } = await httpApiGet<{
      s3UploadUrl: string;
      s3UploadParams: { [key: string]: string };
    }>(`api/screening/${screeningId}/uploadUrl`);

    // S3 POST accepts only `multipart/form-data` encoded payload
    // https://stackoverflow.com/a/35206069
    const formData = new FormData();
    for (const name in s3UploadParams) {
      formData.append(name, s3UploadParams[name]);
    }
    formData.append('file', fileContent);

    await fetch(s3UploadUrl, {
      method: 'POST',
      body: formData,
    });
  },

  downloadEvidenceTable(screeningId: string) {
    return httpApiGet<{ evidenceTable: string }>(`api/screening/${screeningId}/evidenceTable`);
  },

  hasPdfContent(screeningId: string) {
    return httpApiGet<{ hasPdfContent: boolean }>(`api/screening/${screeningId}/hasPdfContent`);
  },
};
