/* eslint-disable no-console */
import _ from 'lodash';

import * as errors from '../errors/error-messages';
import { Settings } from '../settings/settings';
import { initAws, Aws } from '../aws/init-aws';
import { registerGenerators } from './register-generators';
import { registerDefaults } from './register-defaults';
import { getClientSession, ClientSession } from './client-session';
import { getToken } from './token';
import { DependencyGraph } from '../models/dependency-graph';
import type { RegistryContent } from '../models/registry-content';
import type { Registry } from '../helpers/registry';
import { SessionType } from '../models/session-type';

declare const __bootstrap__: any;

/**
 * This class serves two main purposes:
 * - Contains the logic for the setup that is common to most of the test suites.
 * - The entry point to gain access to the default admin session or create other client sessions
 *
 * In your rests, you can simply use const setup = await runSetup(); to gain access to an instance of
 * this class.
 */
export class Setup {
  settings!: Settings;

  gen!: RegistryContent;
  genRegistry!: Registry;

  defaults!: RegistryContent;
  defaultsRegistry!: Registry;
  sessions: ClientSession[] = [];
  defaultAdminSessionInstance!: ClientSession;

  private dependencyGraph!: DependencyGraph;
  private aws!: Aws;

  async init() {
    // 1 - Read the global __bootstrap__ object and use it to create the settings object, the __bootstrap__ was
    //     made available in the globals by jest.config.js file
    // 2 - Use the adminToken from settings, to create the default admin session

    // eslint-disable-next-line no-undef
    const settingsMementoInGlobal = _.get(__bootstrap__, 'settingsMemento');
    if (_.isEmpty(settingsMementoInGlobal)) throw errors.missingSettingsMemento();

    // eslint-disable-next-line no-undef
    this.dependencyGraph = _.get(__bootstrap__, 'dependencyGraph');

    // Restore the settings registry from the memento that we stored in jest globals
    const settings = new Settings();
    settings.setMemento(settingsMementoInGlobal);
    this.settings = settings;

    // aws instance
    this.aws = await initAws({ settings, dependencyGraph: this.dependencyGraph });

    // Register generators
    // IMPORTANT: these generators have nothing to do with the ES6 generators.
    // The generators here are simply helper functions that return values that we can use in the tests, for example,
    // generating user names, etc.
    const { registry: genRegistry, generators } = await registerGenerators({ setup: this });
    this.gen = generators;
    this.genRegistry = genRegistry;

    // Register default values
    const { registry: defaultsRegistry, defaults } = await registerDefaults({ setup: this });
    this.defaults = defaults;
    this.defaultsRegistry = defaultsRegistry;
  }

  async defaultAdminSession() {
    // Only create a new client session if we haven't done that already
    if (this.defaultAdminSessionInstance) return this.defaultAdminSessionInstance;

    const token = this.settings.get('adminToken');
    // In the future, we can check if the token expired and if so, we can create a new one

    const session = await getClientSession({ token, setup: this });
    this.sessions.push(session);
    this.defaultAdminSessionInstance = session;

    return session;
  }

  async createAdminSession() {
    const adminSession = await this.defaultAdminSession();
    const username = this.gen.username({ tagPrefix: 'test-admin' });
    const password = this.gen.password();

    await adminSession.resources.users.create({
      username,
      email: username,
      temporaryPassword: password,
      userRoles: ['admin'],
      enabled: true,
    });

    const token = await getToken({ aws: this.aws, username, password });
    const session = await getClientSession({ token, setup: this });
    this.sessions.push(session);

    return session;
  }

  /**
   * @param {string} sessionType to return
   * @returns session of specified type */
  async createSession(sessionType: SessionType) {
    switch (sessionType) {
      case 'admin':
        return this.createAdminSession();
      case 'user':
        return this.createUserSession();
      case 'anonymous':
        return this.createAnonymousSession();
      default:
        return this.createAnonymousSession();
    }
  }

  async createAnonymousSession() {
    const session = await getClientSession({ setup: this });
    this.sessions.push(session);

    return session;
  }

  async createUserSession({
    userRoles = ['guest'],
    username = this.gen.username(),
    password = this.gen.password(),
  } = {}) {
    const adminSession = await this.defaultAdminSession();

    await adminSession.resources.users.create({
      username,
      email: username,
      temporaryPassword: password,
      userRoles,
      enabled: true,
    });
    const token = await getToken({ aws: this.aws, username, password });
    const session = await getClientSession({ token, setup: this });
    this.sessions.push(session);

    return session;
  }

  async cleanup() {
    // We need to reverse the order of the queue before we cleanup the sessions
    const sessions = _.reverse(_.slice(this.sessions));

    for (const session of sessions) {
      try {
        await session.cleanup();
      } catch (error) {
        console.error(error);
      }
    }

    this.sessions = []; // This way if the cleanup() method is called again, we don't need to cleanup again
  }
}

/**
 * Use this function to gain access to a setup instance that is initialized and ready to be used.
 */
export async function runSetup() {
  const setupInstance = new Setup();
  await setupInstance.init();

  return setupInstance;
}
