import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { Boom } from '@aws-ee/core';
import { DeploymentItemModelDefinition } from '../db/deployment-item.schema';
import { DeploymentItem, DeploymentItemKey } from '../models/deployment-item';

@Injectable()
export class DeploymentStoreService {
  constructor(
    @InjectModel(DeploymentItemModelDefinition.name)
    private deploymentItemModel: Model<DeploymentItem, DeploymentItemKey>,
  ) {}

  find(key: DeploymentItemKey): Promise<DeploymentItem> {
    return this.deploymentItemModel.get(key);
  }

  mustFind(key: DeploymentItemKey): Promise<DeploymentItem> {
    const result = this.deploymentItemModel.get(key);
    if (!result) {
      throw new NotFoundException(
        Boom.safeMsg(`deployment item of type "${key.type}" and id "${key.id}" does not exist`),
      );
    }
    return result;
  }

  async createOrUpdate(deploymentItem: DeploymentItem): Promise<DeploymentItem> {
    const key: DeploymentItemKey = { id: deploymentItem.id, type: deploymentItem.type };
    const existing = await this.deploymentItemModel.get(key);
    if (!existing) {
      return this.deploymentItemModel.create(deploymentItem);
    }
    return this.deploymentItemModel.update(key, { value: deploymentItem.value });
  }

  async delete(key: DeploymentItemKey): Promise<void> {
    return this.deploymentItemModel.delete(key);
  }
}
