import { toErr } from '../Err';

describe('toErr', () => {
  it('maps parameter to Error', () => {
    const object = {
      message: 'message',
      code: 'code',
    };
    expect(toErr(object)).toMatchObject({ ...object, requestId: '' });
  });
});
