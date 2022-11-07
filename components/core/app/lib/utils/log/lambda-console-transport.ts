/* eslint-disable no-console */
import type { TransformableInfo } from 'logform';
import TransportStream from 'winston-transport';
import { MESSAGE, LEVEL } from 'triple-beam';

export interface LambdaConsoleTransportProps extends TransportStream.TransportStreamOptions {
  fieldsToMask?: string[];
  name?: string;
}

export class LambdaConsoleTransport extends TransportStream {
  private fieldsToMask: string[];
  public readonly name: string;

  constructor(options: LambdaConsoleTransportProps = {}) {
    super(options);
    this.name = options.name ?? 'lambda-console';
    this.fieldsToMask = options.fieldsToMask ?? ['x-amz-security-token', 'user', 'accessKey', 'password'];
  }

  log(info: TransformableInfo, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const msg = this.maskDeep(info[MESSAGE as any]);
    const level = info[LEVEL as any] as keyof typeof console;

    // Lambda relies on us calling the relevant console function
    switch (level) {
      case 'error':
        console.error(msg);
        break;
      case 'warn':
        console.warn(msg);
        break;
      case 'info':
        console.info(msg);
        break;
      case 'debug':
        console.debug(msg);
        break;
      default:
        console.log(msg);
        break;
    }

    callback?.();
  }

  private maskDeep(message: string | object): unknown {
    const mask = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(mask);
      }

      if (typeof obj === 'object') {
        return Object.keys(obj).reduce(
          (result, key) => ({
            ...result,
            [key]: this.fieldsToMask.includes(key) ? '****' : mask(obj[key]),
          }),
          {},
        );
      }

      return obj;
    };

    if (typeof message === 'object') {
      return mask(message);
    }

    try {
      const messageJson = JSON.parse(message);
      return JSON.stringify(mask(messageJson));
    } catch {
      // ignore
    }
    return message;
  }
}
