#!/usr/bin/env node
import yargs from 'yargs';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import { build } from 'esbuild';
import { hideBin } from 'yargs/helpers';
import { LambdaBuildCore, argsDefatuls } from './lambda-build-core';
import { LambdaBuildCli } from './lambda-build-cli';

const lambdaBuildCore = new LambdaBuildCore({ build }, fs);
const cli = new LambdaBuildCli(fsPromises, console, lambdaBuildCore);

const main = async () => {
  await yargs(hideBin(process.argv))
    .command(
      ['archive', '$0'],
      'Bundle and archive your lambda function code',
      () => {
        //
      },
      async (argv: yargs.Arguments) => {
        await cli.commandArchive({
          entry: argv.entry as string,
          output: argv.output as string,
          external: argv.external as string[],
          metafile: argv.metafile as boolean,
        });
      }
    )
    .command(
      'upload <lambdas...>',
      'Bundle, archive and upload to the given lambda functions',
      (yargs) => {
        return yargs
          .positional('lambdas', {
            describe: 'a list of lambdas to upload the bundle to',
          })
          .option('region', {
            alias: 'r',
            type: 'string',
            default: argsDefatuls.region,
            description: 'set the region of the lambda functions',
          })
          .example([
            [
              '$0 upload my-func1 my-func2',
              'bundle, archive and upload to my-func1 and my-func2',
            ],
            [
              '$0 upload my-func1 -r us-east-2',
              'upload the archived bundle to my-func1 in the region us-east-2',
            ],
          ]);
      },
      async (argv: yargs.Arguments) => {
        await cli.commandUpload({
          entry: argv.entry as string,
          output: argv.output as string,
          external: argv.external as string[],
          metafile: argv.metafile as boolean,
          lambdas: argv.lambdas as string[],
          region: argv.region as string,
        });
      }
    )
    .options({
      e: {
        alias: 'entry',
        type: 'string',
        default: argsDefatuls.entry,
        description:
          'The name of the entry file containing the lambda handler(s)',
      },
      '0': {
        alias: 'output',
        type: 'string',
        default: argsDefatuls.output,
        description: 'The output path for the archive',
      },
      x: {
        alias: 'external',
        type: 'array',
        default: argsDefatuls.external,
        description:
          'Exclude these libraries from bundling, for example libraries that you already load in a layer',
      },
      m: {
        alias: 'metafile',
        type: 'boolean',
        default: argsDefatuls.metafile,
        description:
          'Generate a meta.json file that can be used to analyze the bundle',
      },
    })
    .example([
      ['$0', 'bundle index.js into archive.zip'],
      ['$0 archive -e src/index.ts', 'bundle src/index.ts into archive.zip'],
      [
        '$0 archive -e src/index.ts -o src/package.zip',
        'bundle src/index.ts into package.zip',
      ],
      [
        '$0 archive -x lodash dayjs',
        'bundle and archive index.js but exclude lodash and dayjs from the bundle',
      ],
      ['$0 archive -m', 'generate a meta.json file to analyze the bundle'],
      ['$0 upload --help', "learn more about the 'upload' command"],
    ])
    .wrap(yargs.terminalWidth())
    .parse();
};

main();
