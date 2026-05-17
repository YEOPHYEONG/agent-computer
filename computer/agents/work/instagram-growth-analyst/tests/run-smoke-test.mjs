#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const testDir = dirname(fileURLToPath(import.meta.url));
const agentDir = resolve(testDir, '..');
const workspaceRoot = resolve(agentDir, '../../..');
const script = resolve(agentDir, 'tools/analyze-instagram-growth.mjs');
const input = resolve(agentDir, 'examples/sample-posts.csv');
const output = resolve(testDir, 'tmp/smoke-report.md');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await fs.mkdir(dirname(output), { recursive: true });
const { stdout } = await execFileAsync(process.execPath, [
  script,
  '--input',
  input,
  '--project',
  'instagram-growth-smoke',
  '--profile',
  'Sample Profile',
  '--out',
  output
], { cwd: workspaceRoot });

const report = await fs.readFile(output, 'utf8');
assert(stdout.includes('Wrote'), 'Tool did not report a written file.');
assert(report.includes('# Instagram Growth Analysis'), 'Missing report title.');
assert(report.includes('## Executive Summary'), 'Missing executive summary.');
assert(report.includes('## Recommended Experiments'), 'Missing experiments section.');
assert(report.includes('No external posting or account access was performed.'), 'Missing safety boundary.');
assert(report.includes('Sample Profile'), 'Profile option was not included.');

console.log(`Smoke test passed: ${output}`);
