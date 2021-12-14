import fs from 'fs';
import Sinon, * as sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { LambdaBuildCore } from '../src/lambda-build-core';
import * as assert from 'assert';
import * as esbuild from 'esbuild';

const builder = { build: esbuild.build };
const core = new LambdaBuildCore(builder, fs);

let buildStub: Sinon.SinonStub;
// let fsStub: Sinon.SinonStub;

const mockJson = { contents: '__json__' };

describe('LambdaBuildCore', () => {

  beforeEach(() => {
    sinon.stub(fs, 'existsSync').returns(true);
    buildStub = sinon.stub(builder, 'build').resolves({
      outputFiles: [{ text: '__bundle__', path: '', contents: Buffer.from('') }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metafile: mockJson as any,
      errors: [],
      warnings: [],
    });
  });

  afterEach(sinon.restore);

  it('should generate using esbuild, and return a meta file content, if requested', async () => {
    const res = await core.bundleAndArchive('path/to/file', [], true);
    assert.strictEqual(buildStub.firstCall.firstArg.metafile, true);
    assert.strictEqual(res.meta, JSON.stringify(mockJson));
  });

  it('should generate a metafile, if requested not to', async () => {
    const res = await core.bundleAndArchive('path/to/file', [], false);
    assert.strictEqual(buildStub.firstCall.firstArg.metafile, false);
    assert.strictEqual(res.meta, undefined);
  });

});
