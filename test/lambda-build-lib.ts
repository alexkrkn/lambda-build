import fs from 'fs';
import Sinon, * as sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { LambdaBuildCore } from '../src/lambda-build-core';
import * as assert from 'assert';
import * as esbuild from 'esbuild';
import { LambdaBuildLib } from '../src/lambda-build-lib';

const lambdaBuildCore = new LambdaBuildCore({ build: esbuild.build }, fs);
const lib = new LambdaBuildLib(lambdaBuildCore);

let bundleAndArchiveStub: Sinon.SinonStub;

describe('LambdaBuildLib', () => {

  beforeEach(() => {
    bundleAndArchiveStub = sinon.stub(lambdaBuildCore, 'bundleAndArchive').resolves({
      bundle: '__bundle__',
      meta: '__meta__',
      archiveSize: '__archive_size__',
      archive: Buffer.from('__archive__'),
    });
  });

  afterEach(sinon.restore);

  it('should generate and return a meta file content, if requested', async () => {
    const res = await lib.build({
      entry: '__entry__',
      external: ['__external__'],
      metafile: true,
    });
    assert.strictEqual(bundleAndArchiveStub.firstCall.args[2], true);
    assert.strictEqual(res.meta, '__meta__');
  });

  it('should not return a meta file content by default', async () => {
    await lib.build({
      entry: '__entry__',
      external: ['__external__'],
    });
    assert.strictEqual(bundleAndArchiveStub.firstCall.args[2], false);
  });

});
