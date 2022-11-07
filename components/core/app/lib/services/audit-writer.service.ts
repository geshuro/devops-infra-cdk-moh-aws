import { Injectable, Optional } from '@nestjs/common';

import { LoggerService } from './logger.service';
import { AuditWriter } from '../extensions/audit-writer';
import { AuditWriterResult } from '../models/audit-writer-result';
import { AuditEvent } from '../models/audit-event';
import { ContextService } from './context.service';

/**
 * Main audit logging writer service implementation that provides a standard interface for writing audit logs.
 * The service is only responsible for writing audit events.
 */
@Injectable()
export class AuditWriterService {
  private auditWriters: AuditWriter[] = [];

  constructor(private readonly log: LoggerService, @Optional() private readonly contextService?: ContextService) {}

  /**
   * Audit implementers must call this function to register themselves
   * @param auditWriter The audit writer
   */
  register(auditWriter: AuditWriter): void {
    this.auditWriters.push(auditWriter);
  }

  /**
   * Audit method responsible for writing the specified audit event.
   *
   * The method first prepares the given event by calling the "prepare" method of the plugins. Each plugin gets a chance
   * to contribute to preparing the given audit event. The plugins can return the given audit event as is or modify it
   * and return prepared audit event. The audit event returned by the last plugin from the "prepare" method is used as
   * the effective audit event.
   *
   * After audit event is prepared, it writes the audit event by calling the "write" method of the plugins. Each plugin
   * gets a chance to write the given audit event to their respective persistent layer.
   *
   * The method returns a promise that resolves only after all plugins for "audit" extension point are resolved
   * (i.e., after the event has been written by all audit writer plugins). If any plugin throws an error, the method
   * stops calling further plugins and fails (i.e., returns a Promise that rejects with the same error).
   *
   * @param requestContext The request context object containing principal (caller) information.
   * The principal's identifier object is expected to be available as "requestContext.principalIdentifier"
   *
   * @param auditEvent The audit event.
   */
  async write(auditEvent: AuditEvent): Promise<AuditWriterResult> {
    return this.writeAuditEvent(auditEvent, false);
  }

  /**
   * This method is very similar to the {@link write} method.
   *
   * The main differences are:
   * - The method fires writing audit event using the plugins and returns right away. The method returns a Promise that
   * resolve immediately (i.e., does not wait for all plugins to finish writing)
   * - In case, any plugin fails writing audit event, the method ignores that error and continues invoking other plugins
   * from the plugin registry (for the "audit" extension point).
   *
   * @param requestContext
   * @param auditEvent
   * @param args
   */
  writeAndForget(auditEvent: AuditEvent): AuditWriterResult {
    this.writeAuditEvent(auditEvent, true).catch((e) => this.log.error(e));
    return { status: 'unknown' };
  }

  private async writeAuditEvent(auditEvent: AuditEvent, continueOnError: boolean): Promise<AuditWriterResult> {
    const preparedAuditEvent = await this.prepareAuditEvent(auditEvent, continueOnError);

    await Promise.all(
      this.auditWriters.map(async (writer) => {
        try {
          await writer.write(preparedAuditEvent);
        } catch (err) {
          if (!continueOnError) {
            throw err;
          }
        }
      }),
    );
    return { status: 'success', auditEvent };
  }

  private async prepareAuditEvent(auditEvent: AuditEvent, continueOnError: boolean) {
    let resultEvent = auditEvent.withActor(this.contextService?.getCurrentPrincipal());

    for (const writer of this.auditWriters) {
      try {
        resultEvent = await writer.prepare(resultEvent);
      } catch (err) {
        if (!continueOnError) {
          throw err;
        }
      }
    }

    return resultEvent;
  }
}
