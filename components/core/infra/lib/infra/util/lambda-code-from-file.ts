import ts from 'typescript';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { FunctionCode } from '@aws-cdk/aws-cloudfront';

interface CloudfrontFunctionCodeFromFileProps {
  fileName: string;
  replacements?: Record<string, string>;
}

/**
 * Read a file and transpiles it to code that is usable for CloudFront functions.
 */
export function cloudFrontFunctionCodeFromFile({
  fileName,
  replacements,
}: CloudfrontFunctionCodeFromFileProps): FunctionCode {
  // Read in the file contents
  let content = fs.readFileSync(fileName).toString('utf-8');

  // Transpile from TS to JS
  content = ts.transpile(content, {
    target: ts.ScriptTarget.ES5, // CloudFront supports ES5 only
    module: ts.ModuleKind.ES2020, // ES2020 creates a single export at the end which can be removed easily
    removeComments: true,
  });

  // Remove export statements (not allowed in CloudFront functions)
  content = filterExportLines(content);

  // Optionally inline configurations with handlebars
  if (replacements) {
    content = Handlebars.compile(content)(replacements);
  }
  return FunctionCode.fromInline(content);
}

/**
 * Remove all ES module exports to create a plain JS file
 */
function filterExportLines(content: string) {
  return content
    .split('\n')
    .filter((line) => !line.startsWith('export '))
    .join('\n');
}
