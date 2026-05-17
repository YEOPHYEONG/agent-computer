import { promises as fs } from 'node:fs';
import { basename, extname } from 'node:path';
import { readText, safeTopicName, writeText } from './files.mjs';
import { inferProjectSlug, projectPath } from './project-paths.mjs';

export async function verifyFile(root, filePath, options = {}) {
  if (extname(filePath).toLowerCase() === '.pptx') return verifyPptx(root, filePath, options);

  const text = await readText(filePath, undefined);
  const issues = [];

  if (text.length < 400) issues.push(issue('important', 'Output may be too short for durable work.'));
  if (/TODO|TBD|placeholder/i.test(text)) issues.push(issue('important', 'Output contains TODO/TBD/placeholder language.'));
  if (!/source|evidence|근거|출처/i.test(text)) issues.push(issue('minor', 'No explicit evidence/source section found.'));
  if (/summary|요약/i.test(text) && !/preserve|보존|not removed|축약하지/i.test(text)) {
    issues.push(issue('minor', 'Summary language appears without an explicit content-preservation note.'));
  }
  if (/\b(sent|posted|published)\b/i.test(text) && !/approved|approval|승인/i.test(text)) {
    issues.push(issue('critical', 'External action claim may lack approval language.'));
  }

  const topic = safeTopicName(basename(filePath).replace(/\.[^.]+$/, ''));
  const project = inferProjectSlug(root, filePath, topic);
  const out = projectPath(root, project, 'qa', `${topic}_qa.md`);
  const critical = issues.filter((i) => i.severity === 'critical');
  const important = issues.filter((i) => i.severity === 'important');
  const minor = issues.filter((i) => i.severity === 'minor');
  const body = `# QA Report

## File

\`${filePath}\`

## Request

${options.request || 'No original request provided.'}

## Verdict

${critical.length ? 'Needs fixes before delivery.' : important.length ? 'Usable with important fixes recommended.' : 'Passes basic QA.'}

## Critical Issues

${renderIssues(critical)}

## Important Issues

${renderIssues(important)}

## Minor Issues

${renderIssues(minor)}

## Recommended Fixes

${issues.length ? '- Address the issues above and rerun QA.' : '- No fixes required by the basic V0 QA rules.'}
`;
  await writeText(out, body);
  return { file: out, text: `Wrote ${out}` };
}

async function verifyPptx(root, filePath, options = {}) {
  const buffer = await fs.readFile(filePath);
  const signatureOk = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const haystack = buffer.toString('latin1');
  const slideMatches = [...haystack.matchAll(/ppt\/slides\/slide\d+\.xml/g)];
  const uniqueSlides = new Set(slideMatches.map((m) => m[0]));
  const textFragments = [...haystack.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => unxml(m[1])).filter(Boolean);
  const markdownLeaks = textFragments.filter(hasMarkdownTableLeak);
  const issues = [];

  if (!signatureOk) issues.push(issue('critical', 'File does not start with a ZIP/PPTX signature.'));
  if (!haystack.includes('[Content_Types].xml')) issues.push(issue('critical', 'PPTX package is missing [Content_Types].xml.'));
  if (!haystack.includes('ppt/presentation.xml')) issues.push(issue('critical', 'PPTX package is missing ppt/presentation.xml.'));
  if (uniqueSlides.size === 0) issues.push(issue('critical', 'PPTX package contains no slide XML files.'));
  if (markdownLeaks.length) {
    issues.push(issue('critical', `PPTX slide text contains raw Markdown table syntax (${markdownLeaks.length} fragment(s)); convert tables into editable table cells or readable row text.`));
  }

  const topic = safeTopicName(basename(filePath).replace(/\.[^.]+$/, ''));
  const project = inferProjectSlug(root, filePath, topic);
  const out = projectPath(root, project, 'qa', `${topic}_qa.md`);
  const critical = issues.filter((i) => i.severity === 'critical');
  const body = `# PPTX QA Report

## File

\`${filePath}\`

## Request

${options.request || 'No original request provided.'}

## Verdict

${critical.length ? 'Needs fixes before delivery.' : 'Passes basic PPTX package QA.'}

## Package Checks

- ZIP/PPTX signature: ${signatureOk ? 'pass' : 'fail'}
- Content types file present: ${haystack.includes('[Content_Types].xml') ? 'pass' : 'fail'}
- Presentation file present: ${haystack.includes('ppt/presentation.xml') ? 'pass' : 'fail'}
- Slide XML files detected: ${uniqueSlides.size}
- Extracted editable text fragments: ${textFragments.length}
- Raw Markdown table syntax: ${markdownLeaks.length ? `fail (${markdownLeaks.length})` : 'pass'}

## Issues

${renderIssues(issues)}

## Remaining Manual QA

- Open the PPTX in PowerPoint, Keynote, or LibreOffice.
- Confirm all text is editable.
- Confirm no slide is a full-slide screenshot.
- Confirm dense source content was split into extra slides instead of removed.
`;
  await writeText(out, body);
  return { file: out, text: `Wrote ${out}` };
}

function issue(severity, message) {
  return { severity, message };
}

function renderIssues(items) {
  return items.length ? items.map((i) => `- ${i.message}`).join('\n') : '- None';
}

function hasMarkdownTableLeak(fragment) {
  const text = String(fragment || '').trim();
  if (!text) return false;
  if (/^\|.*\|$/.test(text)) return true;
  if (/\s\|\s/.test(text)) return true;
  if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(text)) return true;
  return false;
}

function unxml(value) {
  return String(value ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
