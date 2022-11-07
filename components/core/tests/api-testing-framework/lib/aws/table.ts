import _ from 'lodash';

export class Table {
  readonly name: string;
  readonly dynamoDb: any;
  readonly aws: any;
  readonly settings: any;
  readonly sdk: any;

  readonly fullName: string;

  private helpers: any;

  constructor({ dynamoDb, name }) {
    this.name = name;
    this.dynamoDb = dynamoDb;
    this.aws = dynamoDb.aws;
    this.settings = dynamoDb.aws.settings;
    this.sdk = dynamoDb.sdk;

    this.helpers = dynamoDb.helpers;
    const prefix = dynamoDb.aws.settings.get('dbPrefix');
    const fullName = `${prefix}-${_.upperFirst(name)}`;

    this.fullName = fullName;
  }

  query = () => this.helpers.query().table(this.fullName);
  scanner = () => this.helpers.scanner().table(this.fullName);
  getter = () => this.helpers.getter().table(this.fullName);
  updater = () => this.helpers.updater().table(this.fullName);
  deleter = () => this.helpers.deleter().table(this.fullName);
}
