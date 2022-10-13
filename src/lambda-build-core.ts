import * as fs from 'fs';
import { build } from 'esbuild';
import JSZip from 'jszip';
import filesize from 'filesize';
import {
  LambdaClient,
  UpdateFunctionCodeCommand,
} from '@aws-sdk/client-lambda';

const INDEX_JS = './index.js';
const INDEX_TS = './index.ts';
const BUNDLE_NAME_IN_ARCHIVE = 'index.js';

export const argsDefatuls = {
  entry: './index.js|ts',
  output: './archive.zip',
  external: [],
  metafile: false,
  region: 'us-east-1',
  lambdas: [],
};

export interface BundlingResult {
  bundle: string;
  meta?: string;
}

export interface ArhcivingResult extends BundlingResult {
  archive: Buffer;
  archiveSize: string;
}

type Builder = { build: typeof build };

export class LambdaBuildCore {
  constructor(private builder: Builder, private fsys: typeof fs) {}

  public bundleAndArchive = async (
    entry: string,
    external: string[],
    isMetafile: boolean
  ): Promise<ArhcivingResult> => {
    const res = await this.createBundle(entry, external, isMetafile);
    const archive = await this.createArchive(res.bundle);
    const archiveSize = this.getBundleSize(archive);
    return {
      archive,
      archiveSize,
      bundle: res.bundle,
      meta: res.meta,
    };
  };

  public publishLambda = async (
    region: string,
    functionName: string,
    archive: Buffer
  ): Promise<string | undefined> => {
    const client = new LambdaClient({ region });
    const command = new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: archive,
    });
    const res = await client.send(command);
    // console.log({ res });
    return res.FunctionArn;
  };

  private determineEntry = (fileName: string): string => {
    const notFoundErrorMsg = `Could not find ${argsDefatuls.entry} - please specify an entry point using the -e flag`;
    if (fileName === argsDefatuls.entry) {
      if (this.fsys.existsSync(INDEX_JS)) {
        return INDEX_JS;
      }
      if (this.fsys.existsSync(INDEX_TS)) {
        return INDEX_TS;
      }
      throw Error(notFoundErrorMsg);
    } else {
      if (!this.fsys.existsSync(fileName)) {
        throw Error(notFoundErrorMsg);
      }
      return fileName;
    }
  };

  private createBundle = async (
    fileName: string,
    external: string[],
    metafile: boolean
  ): Promise<BundlingResult> => {
    const entry = this.determineEntry(fileName);
    const res = await this.builder.build({
      logLevel: 'silent',
      entryPoints: [entry],
      bundle: true,
      write: false,
      minify: false,
      target: 'node12',
      platform: 'node',
      absWorkingDir: process.cwd(),
      external,
      metafile,
    });
    const bundlingResult: BundlingResult = {
      bundle: res.outputFiles[0].text,
    };
    if (metafile && res.metafile) {
      bundlingResult.meta = JSON.stringify(res.metafile);
    }
    const { errors, warnings } = res;
    if (errors.length || warnings.length) {
      // console.log({ errors, warnings });
    }
    return bundlingResult;
  };

  private getBundleSize = (buf: Buffer): string => {
    return filesize(buf.toString().length);
  };

  private createArchive = async (bundle: string): Promise<Buffer> => {
    const zip = new JSZip();
    zip.file(BUNDLE_NAME_IN_ARCHIVE, bundle);
    const buf = await zip.generateAsync({ type: 'nodebuffer' });

    return buf;
  };
}
