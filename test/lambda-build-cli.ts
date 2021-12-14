import fsPromises from 'fs/promises';
import fs from 'fs';
import Sinon, * as sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { LambdaBuildCore } from '../src/lambda-build-core';
import { LambdaBuildCli, META_FILE_NAME } from '../src/lambda-build-cli';
import * as assert from 'assert';
import * as esbuild from 'esbuild';

const output = { log: console.log };

const lambdaBuildCore = new LambdaBuildCore({ build: esbuild.build }, fs);
const cli = new LambdaBuildCli(
  fsPromises,
  output,
  lambdaBuildCore,
);

let bundleAndArchiveStub: Sinon.SinonStub;
// let fsWriteFileStub: Sinon.SinonStub;
let consoleLogStub: Sinon.SinonStub;

describe('LambdaBuildCli', () => {

  beforeEach(() => {
    consoleLogStub = sinon.stub(output, 'log').resolves();
    // fsWriteFileStub = sinon.stub(fsPromises, 'writeFile').resolves();
    bundleAndArchiveStub = sinon.stub(lambdaBuildCore, 'bundleAndArchive').resolves({
      bundle: '__bundle__',
      meta: '__meta__',
      archiveSize: '__archive_size__',
      archive: Buffer.from('__archive__'),
    });
  });

  afterEach(sinon.restore);

  it('should generate a meta file, if requested', async () => {
    await cli.commandArchive({
      entry: '__entry__',
      external: ['__external__'],
      metafile: true,
    });
    assert.strictEqual(bundleAndArchiveStub.firstCall.args[2], true);
    const logItemIndex = consoleLogStub.args.findIndex(log => log[0]?.match(/generated/i) && log[1] === META_FILE_NAME);
    assert.ok(logItemIndex > -1);
  });

  it('should not generate a meta file, if requested not to', async () => {
    await cli.commandArchive({
      entry: '__entry__',
      external: ['__external__'],
      metafile: false,
    });
    assert.strictEqual(bundleAndArchiveStub.firstCall.args[2], false);
    const logItemIndex = consoleLogStub.args.findIndex(log => log[0]?.match(/generated/i) && log[1] === META_FILE_NAME);
    assert.ok(logItemIndex === -1);
  });

});
