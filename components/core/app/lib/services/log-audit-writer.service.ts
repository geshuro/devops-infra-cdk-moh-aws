import { Injectable } from '@nestjs/common';

import { AuditWriter } from '../extensions/audit-writer';
import { AuditEvent } from '../models/audit-event';
import { AuditWriterService } from './audit-writer.service';
import { LoggerService } from './logger.service';

@Injectable()
export class LogAuditWriterService implements AuditWriter {
  constructor(private readonly log: LoggerService, writer: AuditWriterService) {
    writer.register(this);
  }

  async prepare(auditEvent: AuditEvent): Promise<AuditEvent> {
    if (!(auditEvent as any).logEventType) {
      (auditEvent as any).logEventType = 'audit';
    }
    return auditEvent;
  }

  async write(auditEvent: AuditEvent): Promise<AuditEvent> {
    this.log.info(auditEvent);
    return auditEvent;
  }
}
