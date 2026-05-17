import { basename, resolve } from 'node:path';
import { readText, safeTopicName, writeText } from './files.mjs';
import { inferProjectSlug, projectPath } from './project-paths.mjs';
import { computerPath } from './workspace.mjs';

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*\S+/i,
  /token\s*[:=]\s*\S+/i,
  /password\s*[:=]\s*\S+/i,
  /secret\s*[:=]\s*\S+/i,
  /\bsk-[a-z0-9_-]{12,}/i,
  /\bgh[pousr]_[a-z0-9_]{12,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/
];

const PRIVATE_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?\d[\d\s().-]{8,}\d)\b/,
  /\b(?:\d{6}[-\s]?\d{7})\b/
];

export async function curateMemory(root, filePath) {
  const text = await readText(filePath, undefined);
  const topic = safeTopicName(basename(filePath).replace(/\.[^.]+$/, ''));
  const project = inferProjectSlug(root, filePath, topic);
  const hasSecret = SECRET_PATTERNS.some((pattern) => pattern.test(text));
  const reviewedAt = nowKstIso();
  const candidates = extractMemoryCandidates(text);
  const safeCandidates = hasSecret ? [] : candidates.filter((candidate) => !isSensitive(candidate.text));
  const skippedSensitive = candidates.filter((candidate) => isSensitive(candidate.text));
  const additions = hasSecret ? [] : await writeMemoryFiles(root, safeCandidates, { source: filePath, reviewedAt });
  const logBody = renderMemoryLog({
    filePath,
    reviewedAt,
    hasSecret,
    candidates,
    safeCandidates,
    skippedSensitive,
    additions
  });
  const globalLog = computerPath(root, 'memory/memory-update-log.md');
  const projectLog = projectPath(root, project, 'qa', `${topic}_memory-curation.md`);

  await writeText(globalLog, logBody);
  await writeText(projectLog, logBody);

  return {
    text: `Curated memory from ${filePath}. Added ${additions.length} item(s); skipped ${candidates.length - additions.length} candidate(s).`,
    file: projectLog,
    files: [globalLog, ...[...new Set(additions.map((item) => item.path))]]
  };
}

function extractMemoryCandidates(text) {
  const candidates = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    if (!line || isStructuralLine(line) || isTemporaryLine(line)) continue;
    const category = classifyMemoryLine(line);
    if (!category) continue;
    candidates.push({
      category,
      text: line,
      target: targetForCategory(category),
      reason: reasonForCategory(category)
    });
  }

  return dedupeCandidates(candidates);
}

function classifyMemoryLine(line) {
  if (/(prefer|preference|always|never|must|default|기본|선호|항상|절대|반드시|하지 말|해야|원해|좋아|싫어)/i.test(line)) return 'preference';
  if (/(workflow|process|pattern|framework|playbook|checklist|반복|패턴|프로세스|워크플로|플레이북|체크리스트|기준)/i.test(line)) return 'pattern';
  if (/(project|product|brand|agent computer|workspace|repo|오픈소스|프로젝트|제품|브랜드|워크스페이스)/i.test(line)) return 'context';
  if (/(verified|confirmed|source|evidence|근거|출처|확인됨|검증됨)/i.test(line)) return 'source';
  return null;
}

function targetForCategory(category) {
  if (category === 'preference') return 'memory/user-preferences.md';
  if (category === 'pattern') return 'memory/pattern-library.md';
  if (category === 'context') return 'memory/context.md';
  if (category === 'source') return 'memory/source-notes.md';
  return 'memory/context.md';
}

function reasonForCategory(category) {
  const reasons = {
    preference: 'Reusable user preference or constraint.',
    pattern: 'Reusable workflow, QA rule, or decision pattern.',
    context: 'Durable project/product context.',
    source: 'Reusable evidence or source note.'
  };
  return reasons[category] || 'Potentially reusable memory.';
}

async function writeMemoryFiles(root, candidates, meta) {
  const additions = [];
  const grouped = new Map();

  for (const candidate of candidates) {
    if (!grouped.has(candidate.target)) grouped.set(candidate.target, []);
    grouped.get(candidate.target).push(candidate);
  }

  for (const [target, items] of grouped.entries()) {
    const path = computerPath(root, target);
    const existing = await readText(path, defaultMemoryFile(target));
    const existingKeys = new Set(extractExistingMemoryKeys(existing));
    const newItems = items.filter((item) => !existingKeys.has(memoryKey(item.text)));
    if (!newItems.length) continue;
    const section = [
      '',
      `## ${meta.reviewedAt.slice(0, 10)} Update`,
      '',
      `Source: \`${meta.source}\``,
      '',
      ...newItems.map((item) => `- ${item.text}`)
    ].join('\n');
    await writeText(path, `${existing.trimEnd()}\n${section}\n`);
    for (const item of newItems) additions.push({ ...item, path });
  }

  return additions;
}

function defaultMemoryFile(target) {
  const title = target
    .replace(/^memory\//, '')
    .replace(/\.md$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return `# ${title}\n\nReusable memory curated by Agent Computer.\n`;
}

function extractExistingMemoryKeys(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => memoryKey(line.replace(/^-\s+/, '')));
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const deduped = [];
  for (const candidate of candidates) {
    const key = `${candidate.category}:${memoryKey(candidate.text)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
  }
  return deduped;
}

function memoryKey(text) {
  return normalizeLine(text).toLowerCase().replace(/[`*_]/g, '').slice(0, 220);
}

function normalizeLine(line) {
  return String(line || '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[-*+]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isStructuralLine(line) {
  return /^(memory|notes?|source|request|todo|done|added|updated|skipped|reasoning|산출물|요청|메모|노트)$/i.test(line);
}

function isTemporaryLine(line) {
  return /(today only|one[-\s]?off|temporary|이번만|오늘만|일회성|임시|나중에 지워)/i.test(line);
}

function isSensitive(line) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(line)) || PRIVATE_PATTERNS.some((pattern) => pattern.test(line));
}

function renderMemoryLog({ filePath, reviewedAt, hasSecret, candidates, safeCandidates, skippedSensitive, additions }) {
  const skipped = candidates.filter((candidate) => !additions.some((item) => item.text === candidate.text));
  return `# Memory Update

## Source

- File: \`${filePath}\`
- Reviewed: ${reviewedAt}

## Sensitive Data Check

${hasSecret ? '- Potential secret detected. No memory was written automatically.' : '- No secret pattern detected in the source file.'}
${skippedSensitive.length ? `- ${skippedSensitive.length} candidate(s) contained private/sensitive data and were skipped.` : '- No candidate-level private data pattern detected.'}

## Added

${additions.length ? additions.map((item) => `- ${item.category}: ${item.text} -> \`${item.path}\``).join('\n') : '- None'}

## Candidates Reviewed

${candidates.length ? candidates.map((item) => `- ${item.category}: ${item.text}`).join('\n') : '- No durable memory candidates found.'}

## Skipped

${skipped.length ? skipped.map((item) => `- ${item.category}: ${item.text}`).join('\n') : '- None'}

## Reasoning

- Durable memory is limited to reusable preferences, patterns, project context, and source notes.
- Temporary notes, secrets, private contact data, and weak one-off statements are not promoted.
- Safe candidates reviewed: ${safeCandidates.length}
`;
}

function nowKstIso() {
  const date = new Date();
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.toISOString().replace('Z', '')}+09:00`;
}
