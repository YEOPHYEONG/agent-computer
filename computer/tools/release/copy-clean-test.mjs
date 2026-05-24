#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { constants as fsConstants } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '../../..');
const args = process.argv.slice(2);
const version = option('--version', `test-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
const targetArg = option('--target', '');
const force = has('--force');

if (!targetArg) {
  console.error('Usage: node computer/tools/release/copy-clean-test.mjs --version <name> --target <path> [--force]');
  process.exit(1);
}

const target = resolve(process.cwd(), targetArg);
const releaseDir = resolve(root, 'dist', `agent-computer-${version}`);

async function main() {
  assertSafeTarget(target);
  await buildRelease();
  await copyRelease();
  const scan = await scanCopiedRelease(target);
  if (scan.errors.length) {
    console.error(`Clean test copy failed scan with ${scan.errors.length} error(s):`);
    for (const error of scan.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Clean test copy ready: ${target}`);
  console.log(`Source release: ${releaseDir}`);
  console.log(`Files copied: ${scan.fileCount}`);
  console.log('Workspace user-output folders contain guide README files only.');
}

function option(name, fallback = '') {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function has(name) {
  return args.includes(name);
}

async function exists(path) {
  try {
    await fs.access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function assertSafeTarget(path) {
  const rel = relative(root, path);
  if (rel && !rel.startsWith('..') && !resolve(root, rel).startsWith(resolve(root, 'dist'))) {
    throw new Error('Refusing to copy a test release inside the source tree. Use ../test-temp/... or another external test folder.');
  }
}

async function buildRelease() {
  const commandArgs = ['computer/tools/release/build-release.mjs', '--version', version];
  if (force) commandArgs.push('--force');
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`Release build failed for version ${version}.`);
  }
}

async function copyRelease() {
  if (await exists(target)) {
    if (!force) {
      throw new Error(`Target already exists: ${target}. Re-run with --force or choose a new target.`);
    }
    await fs.rm(target, { recursive: true, force: true });
  }
  await fs.mkdir(dirname(target), { recursive: true });
  await fs.cp(releaseDir, target, { recursive: true });
}

async function scanCopiedRelease(start) {
  const files = await listFiles(start);
  const errors = [];
  for (const rel of files) {
    if (/^workspace\/(inbox|projects|reports|converted|outputs|tasks|archive|trash)\/.+/.test(rel) && !/\/README\.md$/.test(rel)) {
      errors.push(`${rel}: generated user artifact must not be included in clean test copies.`);
    }
    if (rel.startsWith('computer/memory/private/')) {
      errors.push(`${rel}: private memory must not be included.`);
    }
  }
  return { fileCount: files.length, errors };
}

async function listFiles(start) {
  const files = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(dir, entry.name);
      const rel = relative(start, full);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.push(rel);
    }
  }
  await walk(start);
  return files.sort();
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
