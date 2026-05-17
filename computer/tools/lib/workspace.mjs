import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function workspaceRoot() {
  let current = process.cwd();
  while (current !== dirname(current)) {
    if (existsSync(resolve(current, 'AGENTS.md')) && (existsSync(resolve(current, 'agents')) || existsSync(resolve(current, 'computer')))) {
      return current;
    }
    current = dirname(current);
  }
  return dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
}

export function computerRoot(root = workspaceRoot()) {
  const layered = resolve(root, 'computer');
  return existsSync(layered) ? layered : root;
}

export function userRoot(root = workspaceRoot()) {
  const layered = resolve(root, 'workspace');
  return existsSync(layered) ? layered : root;
}

export function computerPath(root, ...parts) {
  return resolve(computerRoot(root), ...parts);
}

export function userPath(root, ...parts) {
  return resolve(userRoot(root), ...parts);
}

export function resolveWorkspacePath(root, input) {
  if (!input) return root;
  if (input.startsWith('/')) return input;
  const candidates = [
    resolve(root, input),
    resolve(userRoot(root), input),
    resolve(computerRoot(root), input)
  ];
  return candidates.find((candidate) => existsSync(candidate)) || candidates[0];
}

export function toWorkspaceRelative(root, path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}
