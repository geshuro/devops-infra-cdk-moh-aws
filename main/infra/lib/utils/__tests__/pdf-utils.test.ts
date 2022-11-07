import { readFileSync } from 'fs';
import path from 'path';
import { pdfToStringAsync } from '../pdf-utils';

describe('pdfToStringAsync', () => {
  it('returns expected text from pdf', async () =>
    expect(pdfToStringAsync(readFileSync(path.resolve(__dirname, 'data/test.pdf')))).resolves.toContain('Test PDF'));
});
