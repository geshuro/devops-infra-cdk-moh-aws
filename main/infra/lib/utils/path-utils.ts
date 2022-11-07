import * as path from 'path';
import * as fs from 'fs';
import { Code } from '@aws-cdk/aws-lambda';
import { Source, ISource } from '@aws-cdk/aws-s3-deployment';

export const pkgPath = (pkg: string): string => path.dirname(require.resolve(pkg));

export const sourceFromPkg = (pkg: string): ISource => Source.asset(pkgPath(pkg));

export const codeFromPkg = (pkg: string): Code => Code.fromAsset(pkgPath(pkg));

export const sourceFromPkgPathIfExists = (pkg: string, pathInPkg: string): ISource | undefined => {
  const samlPath = `${path.join(pkgPath(pkg), pathInPkg)}/`;
  if (fs.existsSync(samlPath)) {
    return Source.asset(samlPath);
  }
  return undefined;
};
