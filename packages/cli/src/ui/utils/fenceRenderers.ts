/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';

export interface FenceRendererConfig {
  command: string;
}

const TIMEOUT_MS = 3000;
const CACHE_LIMIT = 256;
const renderers = new Map<string, string>();
const cache = new Map<string, string[] | null>();

export function registerFenceRenderers(
  entries: Record<string, FenceRendererConfig> | undefined,
): void {
  for (const [lang, { command }] of Object.entries(entries ?? {})) {
    if (!renderers.has(lang)) renderers.set(lang, command);
  }
  cache.clear();
}

export function unregisterFenceRenderers(
  entries: Record<string, FenceRendererConfig> | undefined,
): void {
  for (const lang of Object.keys(entries ?? {})) renderers.delete(lang);
  cache.clear();
}

export function renderFence(
  lang: string | null,
  code: string,
  width: number,
): string[] | null {
  const command = lang ? renderers.get(lang) : undefined;
  if (!command) return null;
  const key = `${lang}\0${width}\0${code}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  const lines = run(command, code, width);
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, lines);
  return lines;
}

function run(command: string, code: string, width: number): string[] | null {
  try {
    const out = execSync(command, {
      input: code,
      timeout: TIMEOUT_MS,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'ignore'],
      env: { ...process.env, COLUMNS: String(width) },
    }).toString();
    const lines = out.replace(/\r?\n$/, '').split(/\r?\n/);
    if (!out.trim() || lines.some((l) => stringWidth(stripAnsi(l)) > width)) {
      return null;
    }
    return lines;
  } catch {
    return null;
  }
}
