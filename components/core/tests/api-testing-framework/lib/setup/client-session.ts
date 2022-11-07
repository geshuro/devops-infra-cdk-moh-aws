import _ from 'lodash';
import axios, { AxiosInstance } from 'axios';

import type { Setup } from './setup';
import type { Settings } from '../settings/settings';
import { registerResources } from '../resources/register-resources';
import type { Registry } from '../helpers/registry';
import type { RegistryContent } from '../models/registry-content';

/**
 * This class has the following purpose:
 * - The entry point to gain access to the resources abstractions
 * - Represents the principal issuing the API calls
 * - Holds the token for the principal
 * - Holds a reference to the configured axios instance
 * - Holds a list of cleanup tasks
 */
export class ClientSession {
  readonly settings: Settings;
  readonly setup: Setup;
  axiosClient!: AxiosInstance;

  resources!: RegistryContent;
  registry!: Registry;
  cleanupQueue!: any[];
  user: any;

  public token?: string;

  /**
   * @deprecated Use `token` instead
   */
  public get idToken(): string | undefined {
    return this.token;
  }

  constructor({ token, setup }: { token?: string; setup: Setup }) {
    this.token = token;
    this.setup = setup;
    this.settings = setup.settings;

    // Each element is an object (cleanupTask) of shape { id, command = async fn() }
    this.cleanupQueue = [];

    this.initAxiosClient();
  }

  get anonymous() {
    return _.isEmpty(this.token);
  }

  async init() {
    await this.registerResources();

    // Load the user associated with this token unless it is an anonymous session
    if (this.anonymous) return;

    this.user = await (this.resources.currentUser as any).get();
  }

  initAxiosClient() {
    const websiteUrl = this.settings.get('websiteUrl');
    // We need to specify the 'Origin' header otherwise we will get CORS issues
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Origin': websiteUrl };

    // For anonymous sessions, authorization cookie is not required
    if (!this.anonymous) {
      headers.Cookie = `token=${this.token}`;
    }

    this.axiosClient = axios.create({
      baseURL: this.settings.get('apiEndpoint'),
      timeout: 30000, // 30 seconds to mimic API gateway timeout
      headers,
      withCredentials: true,
    });
  }

  async registerResources() {
    const { registry, resources } = await registerResources({ clientSession: this });
    this.resources = resources;
    this.registry = registry;
  }

  async cleanup() {
    // We need to reverse the order of the queue before we execute the cleanup tasks
    const items = _.reverse(_.slice(this.cleanupQueue));

    for (const { task } of items) {
      try {
        await task();
      } catch (error) {
        console.error(error);
      }
    }

    this.cleanupQueue = []; // This way if the cleanup() method is called again, we don't need to cleanup again
  }

  // This is used by the Resource and CollectionResource base classes. You rarely need to use this method unless you
  // want to add your explicit cleanup task
  // @param {object} cleanupTask an object of shape { id, command = async fn() }
  addCleanupTask(cleanupTask) {
    this.cleanupQueue.push(cleanupTask);
  }

  // Given the id of the cleanup task, remove it from the cleanup queue. If there is more than one task with the same
  // id in the queue, all of the tasks with the matching id will be removed.
  // If the method is able to remove the task, the removed task will be returned otherwise undefined is returned
  removeCleanupTask(id) {
    return _.remove(this.cleanupQueue, ['id', id]);
  }

  /**
   * @deprecated Use `updateToken` instead
   */
  updateIdToken(token: string | undefined) {
    return this.updateToken(token);
  }

  async updateToken(token: string | undefined) {
    this.token = token;
    this.initAxiosClient();
    await this.registerResources();
  }
}

export async function getClientSession({ token, setup }: { token?: string; setup: Setup }) {
  const session = new ClientSession({ token, setup });
  await session.init();
  return session;
}
