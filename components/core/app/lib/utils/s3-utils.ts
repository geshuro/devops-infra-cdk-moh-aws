import { Readable } from 'stream';

/**
 * Convert a S3 URI into an aws sdk friendly format.
 *
 * @param s3Uri The URI. For example `s3://myBucket/folder/file.txt`
 */
export function parseS3Uri(props: { s3Uri: string }): { Bucket: string; Key: string } {
  const tok = props.s3Uri.split('/');
  const Bucket = tok[2];
  const Key = tok.slice(3).join('/');
  return { Bucket, Key };
}

/**
 * @param props readable stream and optional maximum length
 * @returns     promise containing buffer read from stream, limited to maxLength if present */
export const streamToBuffer = async (props: { stream: Readable; maxLength?: number }): Promise<Buffer> => {
  let currLength = 0;
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    props.stream.on('data', (chunk: Uint8Array) => {
      if (!props.maxLength || currLength < props.maxLength) {
        currLength += chunk.length;
        chunks.push(chunk);
      }
    });
    props.stream.on('error', reject);
    props.stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

/**
 * @param props readable stream and optional maximum length
 * @returns     promise containing string read from stream, limited to maxLength if present */
export function streamToString(props: { stream: Readable; maxLength?: number }): Promise<string> {
  return streamToBuffer(props).then((buffer) => buffer.toString('utf-8'));
}
