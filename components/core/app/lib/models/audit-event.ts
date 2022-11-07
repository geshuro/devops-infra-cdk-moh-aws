import { Principal } from './principal';

export interface AuditEventProps {
  /**
   * Optional user friendly string message. This defaults to "auditEvent.action", if missing.
   */
  message?: string;

  /**
   * The action that is being audited.
   */
  action: string;

  /**
   * The body containing some information about the audit event. The body can be any javascript
   * object containing extra information about the audit event.
   */
  body?: unknown;
}

export class AuditEvent {
  /**
   * Optional user friendly string message. This defaults to "auditEvent.action", if missing.
   */
  readonly message?: string;

  /**
   * The action that is being audited.
   */
  readonly action: string;

  /**
   * JavaScript object containing information about the actor who is performing the
   * specified action.
   */
  readonly actor?: { uid: string };

  /**
   * The body containing some information about the audit event. The body can be any javascript
   * object containing extra information about the audit event.
   */
  readonly body?: unknown;

  /**
   * Optional timestamp when the event occurred. This defaults to current time. The
   * "auditEvent.timestamp" is in Epoch Unix timestamp format.
   */
  readonly timestamp: number;

  constructor(props: AuditEventProps) {
    this.message = props.message ?? props.action;
    this.action = props.action;
    this.body = props.body;
    this.timestamp = Date.now();
  }

  withActor(principal?: Principal): this {
    (this as WritableAuditEvent).actor = { uid: principal?.uid ?? '__system__' };
    return this;
  }
}

type WritableAuditEvent = { -readonly [P in keyof AuditEvent]: AuditEvent[P] };
