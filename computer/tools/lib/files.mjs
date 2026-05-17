import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { computerPath } from './workspace.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'private']);

export async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

export async function readText(path, fallback = '') {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw error;
  }
}

export async function writeText(path, text) {
  await ensureDir(dirname(path));
  await fs.writeFile(path, text, 'utf8');
}

export async function copyFile(src, dest) {
  await ensureDir(dirname(dest));
  await fs.copyFile(src, dest);
}

export function exists(path) {
  return existsSync(path);
}

export async function listFiles(root, options = {}) {
  const files = [];
  const maxDepth = options.maxDepth ?? 12;

  async function walk(dir, depth) {
    if (depth > maxDepth) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue;
      const full = join(dir, entry.name);
      const rel = relative(root, full);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(full, depth + 1);
      } else if (entry.isFile()) {
        const stat = await fs.stat(full);
        files.push({
          path: full,
          rel,
          ext: extname(entry.name).toLowerCase(),
          size: stat.size,
          mtime: stat.mtime
        });
      }
    }
  }

  await walk(root, 0);
  return files.sort((a, b) => a.rel.localeCompare(b.rel));
}

export async function buildWorkspaceIndex(root) {
  const files = await listFiles(root);
  const grouped = new Map();
  for (const file of files) {
    const top = file.rel.split('/')[0] || '.';
    if (!grouped.has(top)) grouped.set(top, []);
    grouped.get(top).push(file);
  }

  const lines = [
    '# Workspace Index',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Files indexed: ${files.length}`,
    ''
  ];

  for (const [group, groupFiles] of [...grouped.entries()].sort()) {
    lines.push(`## ${group}`, '');
    for (const file of groupFiles) {
      lines.push(`- \`${file.rel}\` (${file.size} bytes, modified ${file.mtime.toISOString()})`);
    }
    lines.push('');
  }

  const out = computerPath(root, 'system/workspace-index.md');
  await writeText(out, lines.join('\n'));
  return out;
}

export function safeTopicName(input) {
  return (input || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}
