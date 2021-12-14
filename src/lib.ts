import { LambdaBuildCore } from './lambda-build-core';
import { LambdaBuildLib } from './lambda-build-lib';
import { build as esbuild } from 'esbuild';
import fs from 'fs';

const lambdaBuildCore = new LambdaBuildCore({ build: esbuild }, fs);
const lambdaBuildLib = new LambdaBuildLib(lambdaBuildCore);

export const build = lambdaBuildLib.build;
export const buildAndUpload = lambdaBuildLib.buildAndUpload;
