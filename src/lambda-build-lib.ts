import { LambdaBuildCore, argsDefatuls } from './lambda-build-core';

export interface BuildArchiveArgs {
  entry?: string;
  external?: string[];
  metafile?: boolean;
}

export interface BuildRes {
  archive: Buffer;
  archiveSize: string;
  meta?: string;
}

export interface BuildAndUploadArgs {
  lambdas: string[];
  entry?: string;
  external?: string[];
  metafile?: boolean;
  region?: string;
}

export interface BuildAndUploadRes {
  archive: Buffer;
  archiveSize: string;
  meta?: string;
  updatedArns: string[];
}

export class LambdaBuildLib {
  constructor(private lambdaBuildCore: LambdaBuildCore) {}

  public build = async (args?: BuildArchiveArgs): Promise<BuildRes> => {
    const entry = args?.entry ?? argsDefatuls.entry;
    const external = args?.external ?? argsDefatuls.external;
    const metafile = args?.metafile ?? argsDefatuls.metafile;
    const res = await this.lambdaBuildCore.bundleAndArchive(
      entry,
      external,
      metafile
    );
    return res;
  };

  public buildAndUpload = async (
    args: BuildAndUploadArgs
  ): Promise<BuildAndUploadRes> => {
    const entry = args.entry ?? argsDefatuls.entry;
    const external = args.external ?? argsDefatuls.external;
    const metafile = args.metafile ?? argsDefatuls.metafile;
    const region = args.region ?? argsDefatuls.region;
    const lambdas = args.lambdas ?? argsDefatuls.lambdas;
    if (!lambdas.length) {
      throw Error('Must specify lambdas to upload the archive to');
    }
    const buildRes = await this.build({ entry, external, metafile });
    let updatedArns: string[] = [];
    if (buildRes.archive && region) {
      const all = [];
      for (const lambda of lambdas) {
        all.push(
          this.lambdaBuildCore.publishLambda(region, lambda, buildRes.archive)
        );
      }
      const arns = await Promise.all(all);
      updatedArns = arns.filter((arn) => Boolean(arn)) as string[];
    }
    return {
      archive: buildRes.archive,
      archiveSize: buildRes.archiveSize,
      meta: buildRes.meta,
      updatedArns,
    };
  };
}
