import { AuditEvent } from '../models/audit-event';

export interface AuditWriter {
  prepare(auditEvent: AuditEvent): Promise<AuditEvent>;
  write(auditEvent: AuditEvent): Promise<AuditEvent>;
}
