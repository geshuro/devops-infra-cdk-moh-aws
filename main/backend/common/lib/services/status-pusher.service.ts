import { Injectable } from '@nestjs/common';
import { ALLOWED_STATUSES, StatusEnum } from '../models/status';

import { ScreeningDbService } from './screening-db.service';

interface StatusMessage {
  screeningId: string;
}

@Injectable()
export class StatusPusherService {
  private screeningDbService: ScreeningDbService;

  constructor(screeningDbService: ScreeningDbService) {
    this.screeningDbService = screeningDbService;
  }

  private async writeToDDB(props: { screeningId: string; status: string }) {
    const screening = await this.screeningDbService.get({ id: props.screeningId });
    if (screening) {
      console.log(`currentStatus: ${screening.status}`);
    }
    if (!screening && props.status !== StatusEnum.CREATED) {
      throw new Error(`Incorrect status change: creating a new screening with status ${props.status}`);
    } else if (props.status === screening.status) {
      // no update is needed
      return;
    } else if (screening.status !== ALLOWED_STATUSES[ALLOWED_STATUSES.indexOf(props.status) - 1]) {
      throw new Error(`Incorrect status change: going from ${screening.status} to ${props.status}`);
    }

    await this.screeningDbService.update({ id: props.screeningId }, { status: props.status });
  }

  async created(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.CREATED,
    });
  }

  async uploadedCSV(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.UPLOADED_CSV,
    });
  }

  async processedCSV(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.PROCESSED_CSV,
    });
  }

  async screening1WIP(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.SCREENING1_WIP,
    });
  }

  async screening2WIP(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.SCREENING2_WIP,
    });
  }

  async screening1AwaitingDecision(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.SCREENING1_AWAITING_DECISION,
    });
  }

  async screening2AwaitingDecision(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.SCREENING2_AWAITING_DECISION,
    });
  }

  async screening1Complete(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.SCREENING1_COMPLETE,
    });
  }

  async screening2Complete(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.SCREENING2_COMPLETE,
    });
  }

  async evidenceTableComplete(props: StatusMessage) {
    await this.writeToDDB({
      screeningId: props.screeningId,
      status: StatusEnum.EVIDENCE_TABLE_COMPLETE,
    });
  }
}
