import pdf from 'pdf-parse';

/**
 * @param buffer  containing pdf
 * @returns       promise containing text extracted from specified pdf buffer */
export const pdfToStringAsync = async (buffer: Buffer): Promise<string> => (await pdf(buffer)).text;
