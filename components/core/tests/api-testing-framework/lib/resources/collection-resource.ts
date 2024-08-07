/* eslint-disable no-console */
import _ from 'lodash';
import type { AxiosInstance, AxiosError } from 'axios';

import { transformAxiosError } from '../setup/axios-error';
import type { Setup } from '../setup/setup';
import type { Settings } from '../settings/settings';
import type { ClientSession } from '../setup/client-session';
import type { ResourceNode } from './resource';

/**
 * A collection resource node base class. All other collection resource nodes should extend from
 * this class. This class implements the standard RESTful "verbs" so that extending classes don't have to do that.
 * The frequency of changes to this class is expected to be minimal.
 */
export class CollectionResourceNode {
  readonly clientSession: any;
  readonly type: string;
  readonly childType: string;
  readonly settings: Settings;
  readonly id?: string;
  readonly childIdProp: string;
  readonly parent?: ResourceNode;
  api?: string;

  protected axiosClient: AxiosInstance;
  protected setup: Setup;

  constructor({
    clientSession,
    type,
    childType,
    childIdProp = 'id',
    parent,
    id,
  }: {
    clientSession: ClientSession;
    type: string;
    childType: string;
    childIdProp?: string;
    parent?: ResourceNode;
    id?: string;
  }) {
    this.clientSession = clientSession;
    this.axiosClient = clientSession.axiosClient;
    this.setup = clientSession.setup;
    this.settings = this.setup.settings;
    this.type = type;
    this.childType = childType;
    // The name of the id property of the child resource node. Most child resource nodes have 'id' as the name of the
    // id property, with a few exceptions such as the User resource where the 'uid' is the name of the
    // id property.
    this.childIdProp = childIdProp;
    this.parent = parent;
    this.id = id;
  }

  // When creating a child resource on the server, this method provides default values.
  // Extender should override this method and implement their own logic for providing default values
  defaults(resource = {}) {
    return resource;
  }

  async create(body = {}, params = {}, { api = this.api, applyDefault = true } = {}) {
    // Because of the cleanup logic, before we do the create, we need to ensure that the extender of this collection
    // resource node class has a method that returns the resource node for the child resource.
    // For example, if the extender class is 'Users' and it provides childType = 'user', then Users class must have
    // a method called 'user()'.
    if (!_.isFunction(this[this.childType])) {
      throw new Error(`The collection resource node ['${this.type}'] must have a method named [${this.childType}()]`);
    }

    const requestBody = applyDefault ? this.defaults(body) : body;
    const resource = await this.doCall(async () => this.axiosClient.post(api!, requestBody, { params }));
    const id = _.get(resource, this.childIdProp);
    const taskId = `${this.childType}-${id}`;
    const resourceNode = this[this.childType](id);

    // We add a cleanup task to the cleanup queue for the session
    this.clientSession.addCleanupTask({ id: taskId, task: async () => resourceNode.cleanup(resource) });

    return resource;
  }

  async update(body = {}, params = {}, { api = this.api } = {}) {
    return this.doCall(async () => this.axiosClient.put(api!, body, { params }));
  }

  // Because this is a collection resource node, the GET method returns an array of the instance child resources
  // from the server
  async get(params = {}, { api = this.api } = {}) {
    return this.doCall(async () => this.axiosClient.get(api!, { params }));
  }

  // In general, most of the APIs on the server side should not support the ability to delete a collection
  // resource. However, it might be desireable that we test against this. Therefore, this method exists.
  async delete(body = {}, params = {}, { api = this.api } = {}) {
    return this.doCall(async () => this.axiosClient.delete(api!, body));
  }

  // We wrap the call to axios so that we can capture the boom code and payload attributes passed from the
  // server
  async doCall(fn) {
    try {
      const response = await fn();
      return response.data;
    } catch (error) {
      throw transformAxiosError(error as AxiosError);
    }
  }
}
