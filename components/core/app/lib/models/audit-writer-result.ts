import { AuditEvent } from './audit-event';

export interface AuditWriterResultSuccess {
  status: 'success';
  auditEvent: AuditEvent;
}

export interface AuditWriterResultUnknown {
  status: 'unknown';
}

export type AuditWriterResult = AuditWriterResultSuccess | AuditWriterResultUnknown;
