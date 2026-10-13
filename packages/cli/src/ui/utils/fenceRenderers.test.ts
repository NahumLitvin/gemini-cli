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

const entries = (command: string) => ({ demo: { command } });

describe('fence renderers', () => {
  afterEach(() => unregisterFenceRenderers(entries('')));

  it('returns the lines a registered command prints', () => {
    registerFenceRenderers('/ext', entries('tr a-z A-Z'));
    expect(renderFence('demo', 'one\ntwo', 80)).toEqual(['ONE', 'TWO']);
  });

  it('passes the extension path and width', () => {
    registerFenceRenderers(
      '/ext',
      entries('cat >/dev/null; echo "$EXTENSION_PATH $COLUMNS"'),
    );
    expect(renderFence('demo', 'x', 42)).toEqual(['/ext 42']);
  });

  it('ignores languages nobody registered', () => {
    expect(renderFence('python', 'x', 80)).toBeNull();
  });

  it('falls back when output is wider than the block', () => {
    registerFenceRenderers(
      '/ext',
      entries("cat >/dev/null; printf '%090d\\n' 0"),
    );
    expect(renderFence('demo', 'x', 80)).toBeNull();
  });

  it('falls back when the command fails or hangs', () => {
    registerFenceRenderers('/ext', entries('exit 3'));
    expect(renderFence('demo', 'a', 80)).toBeNull();
    unregisterFenceRenderers(entries(''));
    registerFenceRenderers('/ext', entries('sleep 10'));
    expect(renderFence('demo', 'b', 80)).toBeNull();
  }, 10000);

  it('reads output past the pipe buffer', () => {
    registerFenceRenderers(
      '/ext',
      entries('cat >/dev/null; yes x | head -n 40000'),
    );
    expect(renderFence('demo', 'x'.repeat(100000), 80)).toHaveLength(40000);
  });
});
