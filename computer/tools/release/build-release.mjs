#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { constants as fsConstants } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '../../..');
const args = process.argv.slice(2);
const version = option('--version', 'v0-preview');
const force = has('--force');
const target = resolve(root, 'dist', `agent-computer-${version}`);

const ALWAYS_SKIP_DIRS = new Set(['.git', 'node_modules', 'dist']);
const GENERATED_TOP_LEVEL_DIRS = new Set([
  'workspace/inbox',
  'workspace/projects',
  'workspace/converted',
  'workspace/reports',
  'workspace/tasks',
  'workspace/outputs',
  'workspace/archive',
  'workspace/trash'
]);

const EMPTY_RELEASE_DIRS = [
  'workspace/projects',
  'workspace/inbox',
  'workspace/outputs',
  'workspace/converted',
  'workspace/reports',
  'workspace/tasks',
  'workspace/archive',
  'workspace/trash'
];

const GUIDE_FILES = new Map([
  ['workspace/projects/README.md', `# Projects

This is where Agent Computer saves durable user-facing work.

Open a project folder to find source material, converted files, research, reports, presentations, QA, assets, and task notes.
`],
  ['workspace/inbox/README.md', `# Inbox

Put source files here when you want Agent Computer to process them.

Durable outputs should be written under \`workspace/projects/<project-slug>/\`.
`],
  ['workspace/outputs/README.md', `# Outputs

Temporary staging area. Durable outputs should normally be moved or copied into \`workspace/projects/<project-slug>/\`.
`],
  ['workspace/converted/README.md', `# Converted

Temporary or legacy converted files may appear here. New durable conversions should live under \`workspace/projects/<project-slug>/converted/\`.
`],
  ['workspace/reports/README.md', `# Reports

Temporary or legacy reports may appear here. New durable reports should live under \`workspace/projects/<project-slug>/reports/\`.
`],
  ['workspace/tasks/README.md', `# Tasks

Temporary or legacy tasks may appear here. Project-specific tasks should live under \`workspace/projects/<project-slug>/tasks/\`.
`],
  ['workspace/archive/README.md', `# Archive

Old but useful public-safe material can live here. Do not commit private archives.
`],
  ['workspace/trash/README.md', `# Trash

Discarded public-safe material can live here. Do not commit private trash files.
`]
]);

async function main() {
  await assertTargetReady();
  await copyReleaseTree();
  await ensureReleaseDirs();
  const scan = await scanRelease();
  const checks = runSmokeChecks();
  await writeManifest(scan, checks);

  const failedChecks = checks.filter((check) => check.status !== 'pass');
  if (scan.errors.length || failedChecks.length) {
    console.error(`Release build completed with ${scan.errors.length} scan error(s) and ${failedChecks.length} failed check(s).`);
    console.error(`Target: ${target}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Release build complete: ${target}`);
  console.log(`Files copied: ${scan.fileCount}`);
  console.log('Scan: pass');
  console.log('Smoke checks: pass');
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

async function assertTargetReady() {
  if (await exists(target)) {
    if (!force) {
      throw new Error(`Release target already exists: ${target}. Re-run with --force to replace it.`);
    }
    await fs.rm(target, { recursive: true, force: true });
  }
  await fs.mkdir(target, { recursive: true });
}

async function copyReleaseTree() {
  const files = await listSourceFiles(root);
  for (const rel of files) {
    const src = resolve(root, rel);
    const dest = resolve(target, rel);
    await fs.mkdir(dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

async function listSourceFiles(start) {
  const files = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = relative(start, full);
      if (entry.isDirectory()) {
        if (shouldSkipDir(rel, entry.name)) continue;
        await walk(full);
      } else if (entry.isFile()) {
        if (shouldCopyFile(rel, entry.name)) files.push(rel);
      }
    }
  }

  await walk(start);
  return files.sort();
}

function shouldSkipDir(rel, name) {
  if (ALWAYS_SKIP_DIRS.has(name)) return true;
  if (rel.endsWith('/tests/tmp') || rel.includes('/tests/tmp/')) return true;
  if (rel === 'computer/memory/private' || rel.startsWith('computer/memory/private/')) return true;
  if (rel.includes('/private/')) return true;
  return false;
}

function shouldCopyFile(rel, name) {
  if (name === '.DS_Store') return false;
  if (name === '.env' || name.startsWith('.env.')) return false;
  if (rel.endsWith('.log')) return false;
  if (rel.startsWith('computer/memory/private/')) return false;
  if (['computer/memory/context.md', 'computer/memory/user-preferences.md', 'computer/memory/pattern-library.md', 'computer/memory/memory-update-log.md'].includes(rel)) return false;
  if (['computer/system/workspace-index.md', 'computer/system/workspace-map.md', 'computer/system/project-index.md', 'computer/system/last-dry-run.md', 'computer/system/file-move-log.md'].includes(rel)) return false;
  if (rel.startsWith('computer/system/move-manifests/')) return false;

  const parts = rel.split('/');
  const generatedKey = parts[0] === 'workspace' ? `${parts[0]}/${parts[1] || ''}` : parts[0];
  if (GENERATED_TOP_LEVEL_DIRS.has(generatedKey)) {
    return rel === `${generatedKey}/README.md`;
  }

  return true;
}

async function ensureReleaseDirs() {
  for (const dir of EMPTY_RELEASE_DIRS) {
    await fs.mkdir(resolve(target, dir), { recursive: true });
  }
  for (const [rel, content] of GUIDE_FILES) {
    const dest = resolve(target, rel);
    if (!(await exists(dest))) {
      await fs.mkdir(dirname(dest), { recursive: true });
      await fs.writeFile(dest, content, 'utf8');
    }
  }
}

async function scanRelease() {
  const files = await listFiles(target);
  const errors = [];
  const warnings = [];

  for (const rel of files) {
    const full = resolve(target, rel);
    const stat = await fs.stat(full);

    if (rel.includes('.DS_Store')) errors.push(`${rel}: .DS_Store must not be included.`);
    if (rel.startsWith('computer/memory/private/')) errors.push(`${rel}: private memory must not be included.`);
    if (/^computer\/memory\/(context|user-preferences|pattern-library|memory-update-log)\.md$/.test(rel)) {
      errors.push(`${rel}: real memory file must not be included.`);
    }
    if (/^workspace\/(inbox|projects|reports|converted|outputs|tasks|archive|trash)\/.+/.test(rel) && !/\/README\.md$/.test(rel)) {
      errors.push(`${rel}: generated user artifact must not be included.`);
    }
    if (stat.size > 5_000_000) warnings.push(`${rel}: file is larger than 5MB; verify it belongs in the release.`);

    if (isTextLike(rel)) {
      const text = await fs.readFile(full, 'utf8');
      if (/\/Users\/[A-Za-z0-9._-]+[\/\s)>\]]/.test(text)) errors.push(`${rel}: contains an absolute /Users path.`);
      for (const email of text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []) {
        if (!isAllowedExampleEmail(email)) errors.push(`${rel}: contains non-example email address ${email}.`);
      }
      if (/(sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/.test(text)) {
        errors.push(`${rel}: contains a token-like secret pattern.`);
      }
    }
  }

  return { fileCount: files.length, errors, warnings, files };
}

async function listFiles(start) {
  const files = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = relative(start, full);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.push(rel);
    }
  }
  await walk(start);
  return files.sort();
}

function isTextLike(rel) {
  return /\.(md|json|js|mjs|cjs|txt|yml|yaml|gitignore|svg|html|css|xml)$/i.test(rel)
    || ['README', 'LICENSE'].includes(rel);
}

function isAllowedExampleEmail(email) {
  return /@(example\.com|example\.org|example\.net)$/i.test(email);
}

function runSmokeChecks() {
  const commands = [
    ['node', ['--check', 'computer/tools/lib/registry.mjs']],
    ['node', ['--check', 'computer/tools/lib/research.mjs']],
    ['node', ['--check', 'computer/tools/lib/deck.mjs']],
    ['node', ['computer/tools/agent-computer.mjs', 'route', '너 어떻게 써?']],
    ['node', ['computer/tools/agent-computer.mjs', 'route', '이 PDF 읽어서 보고서랑 PPT까지 만들어줘']],
    ['node', ['computer/tools/agent-computer.mjs', 'route', '뉴스레터 성공사례를 딥하게 조사하고 성공 공식으로 정리해서 PPT로 만들어줘']],
    ['node', ['computer/tools/agent-computer.mjs', 'route', 'person@example.com을 차니라는 연락처로 저장해줘']]
  ];

  return commands.map(([cmd, commandArgs]) => {
    const result = spawnSync(cmd === 'node' ? process.execPath : cmd, commandArgs, {
      cwd: target,
      encoding: 'utf8'
    });
    return {
      command: [cmd, ...commandArgs].join(' '),
      status: result.status === 0 ? 'pass' : 'fail',
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim()
    };
  });
}

async function writeManifest(scan, checks) {
  const lines = [
    '# Release Manifest',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Version: ${version}`,
    `Target: \`dist/agent-computer-${version}\``,
    '',
    '## Summary',
    '',
    `- Files copied: ${scan.fileCount}`,
    `- Scan errors: ${scan.errors.length}`,
    `- Scan warnings: ${scan.warnings.length}`,
    `- Smoke checks: ${checks.filter((check) => check.status === 'pass').length}/${checks.length} passed`,
    '',
    '## Scan Errors',
    '',
    ...(scan.errors.length ? scan.errors.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Scan Warnings',
    '',
    ...(scan.warnings.length ? scan.warnings.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Smoke Checks',
    ''
  ];

  for (const check of checks) {
    lines.push(`### ${check.command}`, '');
    lines.push(`- Status: ${check.status}`, '');
    if (check.stdout) lines.push('```text', truncate(check.stdout), '```', '');
    if (check.stderr) lines.push('stderr:', '', '```text', truncate(check.stderr), '```', '');
  }

  await fs.writeFile(resolve(target, 'RELEASE_MANIFEST.md'), lines.join('\n'), 'utf8');
}

function truncate(text, max = 2000) {
  return text.length > max ? `${text.slice(0, max)}\n... truncated ...` : text;
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
