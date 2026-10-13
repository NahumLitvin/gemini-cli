/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  registerFenceRenderers,
  renderFence,
  unregisterFenceRenderers,
} from './fenceRenderers.js';

const node = (script: string) => ({
  demo: { command: `node -e "${script}"` },
});
const readAll =
  "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(";

describe('fence renderers', () => {
  afterEach(() => unregisterFenceRenderers(node('')));

  it('draws what a registered command prints for the block', () => {
    registerFenceRenderers(node(`${readAll}s.toUpperCase()))`));
    expect(renderFence('demo', 'one\ntwo', 80)).toEqual(['ONE', 'TWO']);
  });

  it('passes the block width as COLUMNS', () => {
    registerFenceRenderers(node('process.stdout.write(process.env.COLUMNS)'));
    expect(renderFence('demo', 'x', 42)).toEqual(['42']);
  });

  it('leaves languages nobody registered to the highlighter', () => {
    expect(renderFence('python', 'x', 80)).toBeNull();
  });

  it('falls back when the output is wider than the block', () => {
    registerFenceRenderers(node("process.stdout.write('x'.repeat(90))"));
    expect(renderFence('demo', 'x', 80)).toBeNull();
  });

  it('falls back when the command fails, prints nothing or hangs', () => {
    registerFenceRenderers(node('process.exit(3)'));
    expect(renderFence('demo', 'a', 80)).toBeNull();
    unregisterFenceRenderers(node(''));
    registerFenceRenderers(node(''));
    expect(renderFence('demo', 'b', 80)).toBeNull();
    unregisterFenceRenderers(node(''));
    registerFenceRenderers(node('setTimeout(()=>{},10000)'));
    expect(renderFence('demo', 'c', 80)).toBeNull();
  }, 10000);

  it('reads input and output past the pipe buffer', () => {
    registerFenceRenderers(node(`${readAll}'x\\n'.repeat(40000)))`));
    expect(renderFence('demo', 'x'.repeat(100000), 80)).toHaveLength(40000);
  });
});
