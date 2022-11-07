/* eslint-disable no-console */
import _ from 'lodash';
import type { AxiosInstance, AxiosError } from 'axios';

import { transformAxiosError } from '../setup/axios-error';
import type { ClientSession } from '../setup/client-session';
import type { Setup } from '../setup/setup';
import type { Settings } from '../settings/settings';

/**
 * A resource node base class. Other resource nodes should extend from this class.
 * This class implements the standard RESTful "verbs" so that extending classes don't have to do that.
 * The frequency of changes to this class is expected to be minimal.
 */
export class ResourceNode {
  readonly clientSession: any;
  readonly type: string;
  readonly settings: Settings;
  readonly id: string;
  readonly parent?: ResourceNode;
  readonly api?: string;

  protected axiosClient: AxiosInstance;
  protected setup: Setup;

  constructor({
    clientSession,
    type,
    id,
    parent,
  }: {
    clientSession: ClientSession;
    type: string;
    id: string;
    parent?: ResourceNode;
  }) {
    this.clientSession = clientSession;
    this.axiosClient = clientSession.axiosClient;
    this.setup = clientSession.setup;
    this.settings = this.setup.settings;
    this.type = type;
    this.id = id;
    this.parent = parent;

    // Most child resource nodes have standard api patterns: /api/<parent resource type>/{id}
    // But we can only assume this if both the 'id' and 'parent' are provided. In addition,
    // the extending class can simply choose to construct their own specialized api path
    // and do so in their own constructor functions.
    if (!_.isEmpty(id) && !_.isEmpty(parent)) {
      this.api = `${parent?.api}/${id}`;
    }
  }

  // When creating the resource on the server, this method provides default values.
  // Extender should override this method and implement their own logic for providing default values
  defaults(resource = {}) {
    return resource;
  }

  async create(body = {}, params = {}, { api = this.api, applyDefault = true } = {}) {
    const requestBody = applyDefault ? this.defaults(body) : body;
    const resource = await this.doCall(async () => this.axiosClient.post(api!, requestBody, { params }));
    const taskId = `${this.type}-${this.id}`;

    // We add a cleanup task to the cleanup queue for the session
    this.clientSession.addCleanupTask({ id: taskId, task: async () => this.cleanup(resource) });

    return resource;
  }

  async get(params = {}, { api = this.api } = {}) {
    return this.doCall(async () => this.axiosClient.get(api!, { params }));
  }

  async update(body = {}, params = {}, { api = this.api } = {}) {
    return this.doCall(async () => this.axiosClient.put(api!, body, { params }));
  }

  async delete(params = {}, { api = this.api } = {}) {
    return this.doCall(async () => {
      const response = await this.axiosClient.delete(api!, { params });

      // Because we explicity deleting the resource, there is no longer a need to run the cleanup
      // task for this resource  (if one existed)
      const taskId = `${this.type}-${this.id}`;
      this.clientSession.removeCleanupTask(taskId);
      return response;
    });
  }

  // We wrap the call to axios so that we can capture the boom code and payload attributes passed from the server
  async doCall(fn) {
    try {
      const response = await fn();
      return _.get(response, 'data');
    } catch (error) {
      throw transformAxiosError(error as AxiosError);
    }
  }

  // This method has the default implementation of the cleanup task for the resource.
  // Classes extending the resource node class can choose to override this method and
  // provide their own implementation but only when appropriate.
  async cleanup(_resource: any) {
    // The cleanup logic is as follows:
    // - We first try to delete the resource on the server using the delete() method
    // - However, it is possible that the user that created the resource does not have permission
    //   to delete the resource or the user might have become inactive. Because of this we will
    //   also try to perform the same delete() method but with default admin credentials

    try {
      await this.delete();
    } catch (error) {
      // Now we try with default admin credentials
      const adminSession = await this.setup.defaultAdminSession();
      this.axiosClient = adminSession.axiosClient;
      await this.delete();
    }
  }
}
