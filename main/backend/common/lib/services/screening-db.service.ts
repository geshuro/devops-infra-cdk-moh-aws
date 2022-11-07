import { Injectable } from '@nestjs/common';
import { InjectModel, Model, Document, ScanResponse } from 'nestjs-dynamoose';

import { ScreeningModelDefinition } from '../db/screening.schema';
import { Screening, ScreeningKey } from '../models/screening';

@Injectable()
export class ScreeningDbService {
  constructor(
    @InjectModel(ScreeningModelDefinition.name)
    private screeningModel: Model<Screening, ScreeningKey>,
  ) {}

  get(key: ScreeningKey): Promise<Document<Screening>> {
    return this.screeningModel.get(key);
  }

  create(screening: Screening): Promise<Document<Screening>> {
    return this.screeningModel.create(screening);
  }

  update(key: ScreeningKey, update: Partial<Screening>): Promise<Document<Screening>> {
    return this.screeningModel.update(key, update);
  }

  list(): Promise<ScanResponse<Document<Screening>>> {
    return this.screeningModel.scan().exec();
  }

  delete(key: ScreeningKey): Promise<void> {
    return this.screeningModel.delete(key);
  }
}
