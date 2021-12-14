import * as fsPromises from 'fs/promises';
import chalk from 'chalk';
import { LambdaBuildCore } from './lambda-build-core';

export const ZIP_FILE_NAME = 'archive.zip';
export const META_FILE_NAME = 'meta.json';

type LogWriter = { log: typeof console.log };

interface LambdaBuildArgs {
  entry: string;
  external: string[];
  metafile: boolean;
  region?: string;
  lambdas?: string[];
}

export class LambdaBuildCli {

  constructor(
    private fsys: typeof fsPromises,
    private output: LogWriter,
    private lambdaBuildCore: LambdaBuildCore,
  ) {
  }

  public commandArchive = async (options: LambdaBuildArgs): Promise<void> => {
    try {
      this.output.log();
      // console.log('archive');
      // console.log({ options });

      this.output.log(chalk.bold(' ️⚡️ Bundling %s'), options.entry);

      if (options.external.length) {
        this.output.log(chalk.dim('  → Excluding %s'), options.external.join(','));
      }

      const res = await this.lambdaBuildCore.bundleAndArchive(options.entry, options.external, options.metafile);

      if (res.meta && options.metafile) {
        await this.fsys.writeFile(META_FILE_NAME, res.meta);
        this.output.log(chalk.dim('  → Generated %s'), META_FILE_NAME);
      }

      if (res.archive) {
        await this.fsys.writeFile(ZIP_FILE_NAME, res.archive);
        this.output.log(chalk.green.bold('  ✔ Created %s') + chalk.dim.green(' %s'), ZIP_FILE_NAME, res.archiveSize);
      }

      this.output.log();
    } catch (err) {
      this.outputErrors(err);
    }
  }

  private publishAndLog = async (region: string, functionName: string, archive: Buffer): Promise<string | undefined> => {
    this.output.log(chalk.dim('  → Uploading %s'), functionName);
    const arn = await this.lambdaBuildCore.publishLambda(region, functionName, archive);
    if (arn) {
      this.output.log(chalk.white('  ✔ Successfully uploaded %s'), functionName);
    }
    return arn;
  }

  public commandUpload = async (options: LambdaBuildArgs) => {
    try {
      this.output.log();
      // console.log('archive');
      // console.log({ options });

      this.output.log(chalk.bold(' ⚡️ Bundling & Uploading %s'), options.entry);

      if (options.external.length) {
        this.output.log(chalk.dim('  → Excluding %s'), options.external.join(','));
      }

      const res = await this.lambdaBuildCore.bundleAndArchive(options.entry, options.external, options.metafile);
      this.output.log(chalk.green.dim('  → Bundle archived %s'), res.archiveSize);

      if (res.meta) {
        await this.fsys.writeFile(META_FILE_NAME, res.meta);
        this.output.log(chalk.dim('  → Generated %s'), META_FILE_NAME);
      }

      if (res.archive && options.lambdas && options.region) {
        this.output.log(chalk.dim('  → Using region %s'), options.region);
        const all = [];
        for (const lambda of options.lambdas) {
          all.push(this.publishAndLog(options.region, lambda, res.archive));
        }
        const arns = await Promise.all(all);
        const uploadedArns = arns.filter(arn => Boolean(arn));
        this.output.log(chalk.green.bold('  ✔ Successfully uploaded %s function(s)'), uploadedArns.length);
      }

      this.output.log();
    } catch (err: unknown) {
      this.outputErrors(err);
    }
  }

  public outputErrors = (err: unknown) => {
    this.output.log();
    this.output.log(chalk.bold.underline.red(`Errors:`));
    if (err instanceof Error) {
      this.output.log(err.message);
    } else {
      this.output.log(err);
    }
    this.output.log();
  }

}
