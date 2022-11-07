/* eslint-disable no-console */
import _ from 'lodash';
import toastr from 'toastr';

type ToastrOptions = typeof toastr.options;

type NotificationMessage = string | (Error & { friendly?: string });
type NotificationMessageOrMessages = NotificationMessage | NotificationMessage[];

export function displayError(msg: NotificationMessageOrMessages, error?: Error, timeOut = 20000): void {
  toastr.error(toMessage(msg, error), 'We have a problem!', { ...toasterErrorOptions, timeOut });
  if (error) console.error(msg, error);
  if (_.isError(msg)) console.error(msg);
}

export function displayWarning(msg: NotificationMessageOrMessages, error?: Error, timeOut = 20000): void {
  toastr.warning(toMessage(msg, error), 'Warning!', { ...toasterWarningOptions, timeOut });
  if (error) console.error(msg, error);
  if (_.isError(msg)) console.error(msg);
}

export function displaySuccess(msg: NotificationMessageOrMessages, title = 'Submitted!'): void {
  toastr.success(toMessage(msg), title, toasterSuccessOptions);
}

function toMessage(msg: NotificationMessageOrMessages, error?: Error) {
  if (_.isError(msg)) {
    return `${msg.message || msg.friendly} <br/>&nbsp;`;
  }

  if (_.isError(error)) {
    return `${msg} - ${error.message} <br/>&nbsp;`;
  }

  if (Array.isArray(msg)) {
    const messages = msg;
    const size = _.size(messages);

    if (size === 0) {
      return 'Unknown error <br/>&nbsp;';
    }
    if (size === 1) {
      return `${messages[0]}<br/>&nbsp;`;
    }
    const result: string[] = [];
    result.push('<br/>');
    result.push('<ul>');
    _.forEach(messages, (message) => {
      result.push(`<li style="margin-left: -20px;">${message}</li>`);
    });
    result.push('</ul><br/>&nbsp;');

    return result.join('');
  }

  if (_.isEmpty(msg)) return 'Unknown error <br/>&nbsp;';

  return `${msg} <br/>&nbsp;`;
}

const toasterErrorOptions: ToastrOptions = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  timeOut: 20000,
  extendedTimeOut: 50000,
};

const toasterWarningOptions: ToastrOptions = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  timeOut: 20000,
  extendedTimeOut: 50000,
};

const toasterSuccessOptions: ToastrOptions = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: true,
  timeOut: 3000,
  extendedTimeOut: 10000,
};
