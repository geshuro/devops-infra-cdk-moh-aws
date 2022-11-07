import { types, Instance } from 'mobx-state-tree';

// import { parseError } from '../helpers/utils';

function parseError(err: any) {
  const message = err?.message || 'Something went wrong';
  const code = err?.code;
  const status = err?.status;
  const requestId = err?.requestId;
  const error: any = new Error(message);

  error.code = code;
  error.requestId = requestId;
  error.root = err;
  error.status = status;

  return error;
}

export const Err = types.model('Err', {
  message: '',
  code: '',
  requestId: '',
});

export type Err = Instance<typeof Err>;

export const toErr = (error: any): Err => {
  const parsed = parseError(error);
  return Err.create({
    message: parsed.message || '',
    code: parsed.code || '',
    requestId: parsed.toErr || '',
  });
};
