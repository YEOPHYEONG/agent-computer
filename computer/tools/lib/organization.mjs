import { promises as fs } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { ensureDir, exists, listFiles, readText, safeTopicName, writeText } from './files.mjs';
import { computerPath, userPath, userRoot } from './workspace.mjs';

const CORE_TOP_LEVEL = new Set([
  'AGENTS.md', 'CLAUDE.md', 'README.md', 'LICENSE', 'package.json',
  '.gitignore', 'agents', 'archive', 'docs', 'examples', 'memory',
  'projects', 'review-needed', 'system', 'tasks', 'templates', 'tools', 'trash', 'node_modules'
]);

const SUPPORTED_POLICIES = ['project-based', 'function-based', 'output-type-based', 'date-based', 'hybrid'];

export async function organizeWorkspace(root, options = {}) {
  const policyPath = computerPath(root, 'system/organization-policy.md');
  if (!exists(policyPath)) {
    if (!options.policy) {
      return renderPolicyQuestion();
    }
    await writePolicy(policyPath, options.policy);
  } else if (options.policy) {
    const existing = parsePolicy(await readText(policyPath, ''));
    if (existing !== options.policy) await writePolicy(policyPath, options.policy, { updated: true, previous: existing });
  }

  const policy = options.policy || parsePolicy(await readText(policyPath, ''));
  const plan = await planMoves(root, policy);
  const manifestPath = computerPath(root, `system/move-manifests/${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const planText = renderPlan(plan, policy, options.dryRun);

  if (options.dryRun) {
    await writeText(computerPath(root, 'system/last-dry-run.md'), planText);
    return planText;
  }

  if (!options.yes) {
    return `${planText}

Actual file moves require explicit \`--yes\`, even for a single file. Re-run with \`--yes\` after reviewing, or use \`--dry-run\` first.`;
  }

  await ensureDir(dirname(manifestPath));
  const completed = [];
  for (const move of plan.moves) {
    await ensureDir(dirname(move.to));
    if (exists(move.to)) {
      plan.review.push({ ...move, reason: 'Destination already exists' });
      continue;
    }
    await fs.rename(move.from, move.to);
    completed.push(move);
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    policy,
    moves: completed.map((move) => ({ from: move.from, to: move.to, reason: move.reason }))
  };
  await writeText(manifestPath, JSON.stringify(manifest, null, 2));
  await appendMoveLog(root, manifestPath, completed, plan.review);
  await writeText(computerPath(root, 'system/workspace-index.md'), await indexAfterOrganize(root));

  return `# Organize Complete

- Policy: ${policy}
- Completed moves: ${completed.length}
- Review needed: ${plan.review.length}
- Manifest: ${rel(root, manifestPath)}
- Log: system/file-move-log.md`;
}

export async function undoLastOrganize(root) {
  const manifestDir = computerPath(root, 'system/move-manifests');
  if (!exists(manifestDir)) return 'No move manifests found.';
  const names = (await fs.readdir(manifestDir)).filter((name) => name.endsWith('.json')).sort();
  if (names.length === 0) return 'No move manifests found.';
  const latest = resolve(manifestDir, names[names.length - 1]);
  const manifest = JSON.parse(await readText(latest, '{}'));
  const undone = [];
  const blocked = [];

  for (const move of [...manifest.moves].reverse()) {
    if (!exists(move.to)) {
      blocked.push({ ...move, reason: 'Moved file no longer exists at destination' });
      continue;
    }
    if (exists(move.from)) {
      blocked.push({ ...move, reason: 'Original path already exists' });
      continue;
    }
    await ensureDir(dirname(move.from));
    await fs.rename(move.to, move.from);
    undone.push(move);
  }

  await appendMoveLog(root, latest, undone.map((m) => ({ from: m.to, to: m.from, reason: 'undo' })), blocked);
  await writeText(computerPath(root, 'system/workspace-index.md'), await indexAfterOrganize(root));
  return `# Undo Complete

- Manifest: ${rel(root, latest)}
- Undone moves: ${undone.length}
- Blocked moves: ${blocked.length}
- Index updated: system/workspace-index.md`;
}

async function writePolicy(path, policy) {
  const normalized = SUPPORTED_POLICIES.includes(policy) ? policy : 'project-based';
  await writeText(path, `# Organization Policy

- Policy: ${normalized}
- Created: ${new Date().toISOString()}

## Workspace Structure Preference

- Structure basis: ${normalized === 'project-based' || normalized === 'hybrid' ? 'project-first' : normalized}
- Preferred default: project-first, then work type.
- Goal: humans should find every report, deck, source, and QA artifact by opening one project folder first.

## Preferred Project Layout

\`\`\`text
projects/
  <project-slug>/
    source/          original or user-provided files
    converted/       agent-readable converted documents
    research/        quick/deep research briefs and source packs
    reports/         written reports and narrative documents
    presentations/   PPTX decks and slide planning artifacts
    qa/              QA reports and verification logs
    assets/          images, rendered pages, contact sheets, media
    tasks/           project-specific task briefs
    archive/         stale or superseded project artifacts
\`\`\`

## Work Type Rules

- Reports go under \`reports/\`.
- Research briefs go under \`research/\`.
- PPTX files and PPT planning files go under \`presentations/\`.
- QA files go under \`qa/\`.
- Images and visual assets go under \`assets/\`.
- Unknown or ambiguous files go to \`review-needed/\` unless a confident project target exists.

## Safety Rules

- Always prefer \`--dry-run\` before moving.
- Actual moves require explicit \`--yes\`, even for one file.
- Write a reversible move manifest.
- Never recursively reorganize files already under \`projects/\`.

## Supported Policies

- project-based
- function-based
- output-type-based
- date-based
- hybrid
`);
}

function renderPolicyQuestion() {
  return `# Organization Policy Needed

Choose how this workspace should be organized before moving files.

Recommended for this Agent Computer:

- \`project-based\`: group everything by project first, then by work type.

Other supported policies:

- \`function-based\`: group by owning function such as reports/source/decks.
- \`output-type-based\`: group by artifact type.
- \`date-based\`: group by month.
- \`hybrid\`: project-first behavior with lightweight type inference.

Recommended layout:

\`\`\`text
projects/<project-slug>/
  source/
  converted/
  research/
  reports/
  presentations/
  qa/
  assets/
  tasks/
  archive/
\`\`\`

Run:

\`\`\`bash
node computer/tools/agent-computer.mjs organize --policy project-based --dry-run
\`\`\`

After reviewing the dry-run, approve movement with:

\`\`\`bash
node computer/tools/agent-computer.mjs organize --policy project-based --yes
\`\`\``;
}

function parsePolicy(text) {
  const match = text.match(/Policy:\s*([a-z-]+)/i);
  return match?.[1] || 'project-based';
}

async function planMoves(root, policy) {
  const files = await listFiles(userRoot(root));
  const moves = [];
  const review = [];
  const plannedTargets = new Map();

  for (const file of files) {
    const first = file.rel.split('/')[0];
    if (CORE_TOP_LEVEL.has(first)) continue;
    if (isTopLevelFolderReadme(file)) continue;
    if (file.rel.includes('/review-needed/')) continue;
    const target = classifyTarget(root, file, policy);
    if (!target) {
      review.push({ from: file.path, to: userPath(root, 'review-needed', file.rel), reason: 'No confident target' });
      continue;
    }
    if (target !== file.path) {
      const alreadyPlannedFrom = plannedTargets.get(target);
      if (alreadyPlannedFrom) {
        review.push({ from: file.path, to: target, reason: `Destination conflicts with planned move from ${alreadyPlannedFrom}` });
        continue;
      }
      if (exists(target)) {
        review.push({ from: file.path, to: target, reason: 'Destination already exists' });
        continue;
      }
      plannedTargets.set(target, file.path);
      moves.push({ from: file.path, to: target, reason: `policy:${policy}` });
    }
  }

  return { moves, review };
}

function isTopLevelFolderReadme(file) {
  const parts = file.rel.split('/');
  return parts.length === 2 && parts[1].toLowerCase() === 'readme.md';
}

function classifyTarget(root, file, policy) {
  const ext = file.ext;
  const name = basename(file.path);
  const date = file.mtime.toISOString().slice(0, 7);
  if (policy === 'date-based') return userPath(root, 'archive', date, name);
  if (policy === 'function-based') return userPath(root, ownerFolder(ext), name);
  if (policy === 'output-type-based') return userPath(root, outputFolder(file), name);
  if (policy === 'project-based' || policy === 'hybrid') {
    const project = inferProjectName(file) || 'general';
    return userPath(root, 'projects', project, outputFolder(file), name);
  }
  return null;
}

function outputFolder(file) {
  const ext = file.ext;
  const name = basename(file.path);
  const rel = file.rel || '';
  const normalizedName = safeTopicName(name);
  if (rel.startsWith('converted/')) {
    if (rel.includes('/pages/') || rel.includes('/contact-sheets/')) return 'assets';
    return 'converted';
  }
  if (rel.includes('/qa/')) return 'qa';
  if (rel.includes('/preview/') || rel.includes('/contact-sheets/')) return 'assets';
  if (rel.includes('/prototype/') || rel.includes('/output/')) return 'presentations';
  if (rel.includes('/scripts/')) return 'tasks';
  if (/(\b|-|_)qa(\b|-|_|\.)/.test(normalizedName) || normalizedName.endsWith('-qa-md')) return 'qa';
  if (/ppt-(content-spec|design-spec|build-plan|production-plan|qa)/.test(normalizedName)) return 'presentations';
  if (normalizedName.includes('email-package')) return 'reports';
  if (normalizedName.includes('reflection')) return 'reports';
  if (['.pptx', '.key'].includes(ext)) return 'presentations';
  if (['.html', '.htm'].includes(ext)) return 'presentations';
  if (['.pdf', '.docx', '.txt', '.md'].includes(ext)) {
    if (normalizedName.includes('report')) return 'reports';
    if (normalizedName.includes('research')) return 'research';
    return 'source';
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return 'assets';
  return 'review-needed';
}

function ownerFolder(ext) {
  if (['.pptx'].includes(ext)) return 'reports/presentations';
  if (['.md', '.txt', '.docx', '.pdf'].includes(ext)) return 'reports/source';
  return 'review-needed';
}

function inferProjectName(file) {
  const parts = file.rel.split('/');
  if (parts[0] === 'outputs') {
    const presentationIndex = parts.indexOf('presentations');
    if (presentationIndex !== -1 && parts[presentationIndex + 1]) return safeTopicName(parts[presentationIndex + 1]);
  }
  if (parts[0] === 'converted' && parts[1]) return safeTopicName(parts[1]);
  if (parts[0] === 'reports') return cleanProjectStem(basename(file.path, file.ext));
  const stem = safeTopicName(basename(file.path, file.ext));
  return cleanProjectStem(stem);
}

function cleanProjectStem(value) {
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

function renderPlan(plan, policy, dryRun) {
  const lines = [
    dryRun ? '# Organization Dry Run' : '# Organization Plan',
    '',
    `- Policy: ${policy}`,
    policy === 'project-based' || policy === 'hybrid'
      ? '- Layout: `workspace/projects/<project-slug>/<work-type>/`'
      : `- Layout: ${policy}`,
    `- Planned moves: ${plan.moves.length}`,
    `- Review needed: ${plan.review.length}`,
    '',
    '## Planned Moves',
    ''
  ];
  for (const move of plan.moves) lines.push(`- \`${move.from}\` -> \`${move.to}\` (${move.reason})`);
  lines.push('', '## Review Needed', '');
  for (const item of plan.review) lines.push(`- \`${item.from}\` (${item.reason})`);
  return lines.join('\n');
}

async function appendMoveLog(root, manifestPath, moves, review) {
  const path = computerPath(root, 'system/file-move-log.md');
  const previous = await readText(path, '# File Move Log\n\n');
  const lines = [
    previous.trim(),
    '',
    `## ${new Date().toISOString()}`,
    '',
    `- Manifest: ${rel(root, manifestPath)}`,
    `- Moves: ${moves.length}`,
    `- Review/blocked: ${review.length}`,
    ''
  ];
  for (const move of moves) lines.push(`- \`${rel(root, move.from)}\` -> \`${rel(root, move.to)}\` (${move.reason})`);
  for (const item of review) lines.push(`- Review: \`${rel(root, item.from)}\` (${item.reason})`);
  await writeText(path, lines.join('\n'));
}

async function indexAfterOrganize(root) {
  const files = await listFiles(userRoot(root));
  const lines = ['# Workspace Index', '', `Generated: ${new Date().toISOString()}`, ''];
  for (const file of files) lines.push(`- \`${file.rel}\``);
  return lines.join('\n');
}

function rel(root, path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}
