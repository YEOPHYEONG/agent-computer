import { basename, extname, relative, resolve } from 'node:path';
import { safeTopicName } from './files.mjs';
import { computerRoot, userPath, userRoot } from './workspace.mjs';

export function inferProjectSlug(root, filePath, fallback = '') {
  const rel = relative(root, filePath).replace(/\\/g, '/');
  const userRel = relative(userRoot(root), filePath).replace(/\\/g, '/');
  const computerRel = relative(computerRoot(root), filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  const userParts = userRel.split('/');
  const computerParts = computerRel.split('/');

  if (parts[0] === 'projects' && parts[1]) return safeTopicName(parts[1]);
  if (parts[0] === 'workspace' && parts[1] === 'projects' && parts[2]) return safeTopicName(parts[2]);
  if (userParts[0] === 'projects' && userParts[1]) return safeTopicName(userParts[1]);
  if (parts[0] === 'agents' && parts[2]) return safeTopicName(parts[2]);
  if (parts[0] === 'computer' && parts[1] === 'agents' && parts[3]) return safeTopicName(parts[3]);
  if (computerParts[0] === 'agents' && computerParts[2]) return safeTopicName(computerParts[2]);
  if (parts[0] === 'converted' && parts[1]) return safeTopicName(parts[1]);
  if (parts[0] === 'workspace' && parts[1] === 'converted' && parts[2]) return safeTopicName(parts[2]);
  if (userParts[0] === 'converted' && userParts[1]) return safeTopicName(userParts[1]);
  if (parts[0] === 'outputs') {
    const presentationIndex = parts.indexOf('presentations');
    if (presentationIndex !== -1 && parts[presentationIndex + 1]) return safeTopicName(parts[presentationIndex + 1]);
  }
  if (userParts[0] === 'outputs') {
    const presentationIndex = userParts.indexOf('presentations');
    if (presentationIndex !== -1 && userParts[presentationIndex + 1]) return safeTopicName(userParts[presentationIndex + 1]);
  }
  if (parts[0] === 'reports') return cleanProjectSlug(basename(filePath, extname(filePath)));
  if (parts[0] === 'workspace' && parts[1] === 'reports') return cleanProjectSlug(basename(filePath, extname(filePath)));
  if (userParts[0] === 'reports') return cleanProjectSlug(basename(filePath, extname(filePath)));

  return cleanProjectSlug(fallback || basename(filePath, extname(filePath)));
}

export function projectPath(root, projectSlug, workType, ...parts) {
  return userPath(root, 'projects', safeTopicName(projectSlug), workType, ...parts);
}

export function cleanProjectSlug(value) {
  const stem = safeTopicName(value);
  const cleaned = stem
    .replace(/-(quick|deep)-research$/, '')
    .replace(/-research$/, '')
    .replace(/-report$/, '')
    .replace(/-ppt-(content-spec|design-spec|build-plan|qa)$/, '')
    .replace(/-ppt-production-plan$/, '')
    .replace(/-(content-spec|design-spec|build-plan|production-plan)$/, '')
    .replace(/-email-package$/, '')
    .replace(/-reflection$/, '')
    .replace(/-qa$/, '')
    .replace(/-editable$/, '');
  return cleaned || stem;
}
