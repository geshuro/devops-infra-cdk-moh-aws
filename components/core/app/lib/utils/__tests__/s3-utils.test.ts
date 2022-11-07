import { createReadStream } from 'fs';
import path from 'path';
import { streamToBuffer, streamToString } from '../s3-utils';

describe('s3-utils', () => {
  const testFileContents = 'A test';
  describe('streamToString', () => {
    it('returns string promise from stream', async () =>
      expect(streamToString({ stream: createReadStream(path.resolve(__dirname, 'data/test.txt')) })).resolves.toBe(
        testFileContents,
      ));

    it('rejects invalid stream', async () =>
      expect(streamToString({ stream: createReadStream('foo') })).rejects.toMatchObject({ code: 'ENOENT' }));
  });

  describe('streamToBuffer', () => {
    it('returns buffer promise from stream', async () =>
      expect(streamToBuffer({ stream: createReadStream(path.resolve(__dirname, 'data/test.txt')) })).resolves.toEqual(
        Buffer.from(testFileContents),
      ));

    it('rejects invalid stream', async () =>
      expect(streamToBuffer({ stream: createReadStream('foo') })).rejects.toMatchObject({ code: 'ENOENT' }));
  });
});
