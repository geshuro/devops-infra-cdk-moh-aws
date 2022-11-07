import { AuditWriterService, LoggerService, Boom, AuditEvent } from '@aws-ee/core';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import {
  EventBridgeClient,
  PutRuleCommand,
  DeleteRuleCommand,
  PutTargetsCommand,
  RemoveTargetsCommand,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { EventbridgeConfig } from '../config/eventbridge-config';
import { Rule } from '../models/rule';
import { RuleTarget } from '../models/rule-target';
import { Event } from '../models/event';

@Injectable()
export class EventbridgeService {
  private solutionEventBusName: string;

  constructor(
    private readonly log: LoggerService,
    private readonly auditWriter: AuditWriterService,
    configService: ConfigService,
  ) {
    this.solutionEventBusName = configService.get<EventbridgeConfig>(EventbridgeConfig.KEY)!.solutionEventBusName;
  }

  /**
   * Registers an event rule on the specified EventBridge bus, defaults to the solution-wide bus if no bus is specified.
   *
   * @param rule The rule to create
   * @param destinationEventBus The event bus, defaults to the solution event bus
   * @returns An object containing the `id` and `arn` of the newly created rule.
   */
  async createRule(
    rule: Rule,
    destinationEventBus = this.solutionEventBusName,
  ): Promise<{
    id: string;
    arn: string;
  }> {
    const id = rule.id;
    let result;
    try {
      // Create the rule
      const cmd = new PutRuleCommand({
        Name: id,
        EventBusName: destinationEventBus,
        EventPattern: rule.eventPattern,
        State: 'ENABLED',
      });

      result = await this.eventBridgeClient.send(cmd);
    } catch (err) {
      this.log.error(err);
      throw new InternalServerErrorException(
        Boom.msg(`Failed to create rule for bus ${destinationEventBus} and rule ${id}: ${(err as Error).message}`),
      );
    }

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'create-rule',
        body: { ...rule, destinationEventBus },
      }),
    );

    return { id, arn: result.RuleArn! };
  }

  /**
   * Deletes an event rule on the specified EventBridge bus.
   *
   * @param opts - The id.
   * @param destinationEventBus The event bus, defaults to the solution event bus
   * @returns  An object containing the `id` of the deleted rule.
   */
  async deleteRule(
    { id }: { id: string },
    destinationEventBus = this.solutionEventBusName,
  ): Promise<{
    id: string;
  }> {
    try {
      // Delete the rule
      const cmd = new DeleteRuleCommand({
        Name: id,
        EventBusName: destinationEventBus,
      });

      await this.eventBridgeClient.send(cmd);
    } catch (err) {
      this.log.error(err);
      throw new InternalServerErrorException(
        Boom.msg(`Failed to delete rule for bus ${destinationEventBus} and rule ${id}: ${(err as Error).message}`),
      );
    }

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'delete-rule',
        body: { id, destinationEventBus },
      }),
    );

    return { id };
  }

  /**
   * Registers a target for an event rule on the specified EventBridge bus, defaults to the solution-wide bus if no bus is specified.
   *
   * @param ruleTarget - The rule target
   * @param destinationEventBus The event bus, defaults to the solution event bus
   *
   * @returns An object containing the `id` of the target.
   */
  async createRuleTarget(
    ruleTarget: RuleTarget,
    destinationEventBus = this.solutionEventBusName,
  ): Promise<{
    ruleId: string;
    id: string;
  }> {
    const ruleId = ruleTarget.id;
    const pathsMap = ruleTarget.inputTransformer?.pathsMap;
    // This cannot be more than 64 characters in length and you need it later to removeTargets before deleting rule
    const id = `eb-${nanoid()}`;
    try {
      // Create the rule target
      const cmd = new PutTargetsCommand({
        Rule: ruleId,
        Targets: [
          {
            Arn: ruleTarget.targetArn,
            Id: id,
            InputTransformer: {
              InputTemplate: ruleTarget.inputTransformer?.template,
              InputPathsMap: pathsMap ? JSON.parse(pathsMap) : undefined,
            },
          },
        ],
        EventBusName: destinationEventBus,
      });

      await this.eventBridgeClient.send(cmd);
    } catch (err) {
      this.log.error(err);
      throw new InternalServerErrorException(
        Boom.msg(
          `Failed to create rule target for bus ${destinationEventBus} and rule ${ruleId}: ${(err as Error).message}`,
        ),
      );
    }

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'create-rule-target',
        body: { ruleId, ...ruleTarget, id, destinationEventBus },
      }),
    );

    return { ruleId, id };
  }

  /**
   * Deletes a rule target from a rule on the specified EventBridge bus.
   *
   * @param opts The id and ruleId
   * @param destinationEventBus The event bus, defaults to the solution event bus
   *
   * @returns An object containing the `id` of the deleted target and the `ruleId`.
   */
  async deleteRuleTarget(
    { id, ruleId }: { id: string; ruleId: string },
    destinationEventBus = this.solutionEventBusName,
  ): Promise<{
    id: string;
    ruleId: string;
  }> {
    try {
      // Delete the rule
      const cmd = new RemoveTargetsCommand({
        Ids: [id],
        Rule: ruleId,
        EventBusName: destinationEventBus,
      });

      await this.eventBridgeClient.send(cmd);
    } catch (err) {
      this.log.error(err);
      throw new InternalServerErrorException(
        Boom.msg(
          `Failed to delete rule target for bus ${destinationEventBus}, rule ${ruleId} and rule target ${id}: ${
            (err as Error).message
          }`,
        ),
      );
    }

    // Write audit event
    await this.auditWriter.write(
      new AuditEvent({
        action: 'delete-rule-target',
        body: { ruleId, id, destinationEventBus },
      }),
    );

    return { id, ruleId };
  }

  /**
   * Publishes the event to the specified EventBridge bus, defaults to the solution-wide bus if no bus is specified.
   *
   * @param event The event to publish
   * @param destinationEventBus The event bus, defaults to the solution event bus
   *
   * @returns  An array containing the EventBridge IDs of the new events that were published on the solution-wide event bus.
   */
  async publishEvent(event: Event, destinationEventBus = this.solutionEventBusName): Promise<string[] | undefined> {
    // Map the common event schema to the EventBridge base schema
    const cmd = new PutEventsCommand({
      Entries: [
        {
          Detail: JSON.stringify(event.detail),
          DetailType: event.detailType,
          EventBusName: destinationEventBus,
          Source: event.sourceSystem,
          Time: event.createdAt ? new Date(event.createdAt) : undefined,
        },
      ],
    });

    // Publish the event
    let result;
    try {
      result = await this.eventBridgeClient.send(cmd);
    } catch (err) {
      this.log.error(err);
      throw new InternalServerErrorException(
        Boom.msg(`Failed to put events on bus ${destinationEventBus}: ${(err as Error).message}`),
      );
    }

    // Get the list of the published events (should be just 1), and map it as an array of the EventBridge IDs given to them
    let newEntries: string[] = [];
    if (Array.isArray(result.Entries)) {
      newEntries = result.Entries.map((entry) => entry.EventId!);
    } else {
      newEntries = [];
    }

    await this.auditWriter.write(
      new AuditEvent({ action: 'publish-event', body: { rawEvent: event, result, newEntries } }),
    );

    return newEntries;
  }

  private get eventBridgeClient() {
    return new EventBridgeClient({});
  }
}
