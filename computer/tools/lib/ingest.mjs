import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { promisify } from 'node:util';
import { basename, dirname, extname, resolve } from 'node:path';
import { copyFile, ensureDir, exists, readText, safeTopicName, writeText } from './files.mjs';
import { mdEscape } from './markdown.mjs';
import { projectPath } from './project-paths.mjs';
import { computerPath } from './workspace.mjs';

const exec = promisify(execFile);

export async function ingestFile(root, sourcePath) {
  if (!exists(sourcePath)) throw new Error(`Source file not found: ${sourcePath}`);
  const ext = extname(sourcePath).toLowerCase();
  const base = safeTopicName(basename(sourcePath, ext));
  const outDir = projectPath(root, base, 'converted');
  const pagesDir = resolve(outDir, 'pages');
  const notesDir = resolve(outDir, 'page-notes');
  const tempPptxRenderDir = resolve(outDir, 'tmp-pptx-render');
  const agentFile = resolve(outDir, 'source.agent.md');
  const logFile = resolve(outDir, 'conversion-log.md');
  await ensureDir(outDir);

  const log = [];
  log.push(`# Conversion Log`, '', `- Source: ${sourcePath}`, `- Started: ${new Date().toISOString()}`, `- Extension: ${ext}`, '');

  let body = '';
  let stage = 'initialize conversion';
  try {
    if (ext === '.md' || ext === '.txt') {
      stage = 'read text-native file';
      const text = await readText(sourcePath, undefined);
      body = renderAgentMarkdown(sourcePath, ext, 'text-normalizer', text, '', []);
      log.push('- Used text-normalizer.');
      await removeEmptyDirIfPresent(pagesDir);
      await removeEmptyDirIfPresent(notesDir);
    } else if (ext === '.docx') {
      stage = 'extract DOCX text';
      const text = await extractOfficeText(root, sourcePath, 'docx');
      body = renderAgentMarkdown(sourcePath, ext, 'docx-text-extractor', text, '', []);
      log.push('- Used DOCX text extractor.');
      await removeEmptyDirIfPresent(pagesDir);
      await removeEmptyDirIfPresent(notesDir);
    } else if (ext === '.pdf') {
      stage = 'render PDF with pdfjs helper';
      const delegated = await tryPdfjsIngest(root, sourcePath, outDir, log);
      if (delegated) return delegated;
      stage = 'extract PDF text';
      const text = await tryPdfText(sourcePath, log);
      stage = 'render PDF pages';
      await ensureVisualDirs(pagesDir, notesDir);
      const pages = await renderPdf(root, sourcePath, pagesDir, log);
      body = renderAgentMarkdown(sourcePath, ext, 'pdf-text-and-render', text, 'Rendered PDF pages are available in `pages/`.', pages);
      stage = 'write PDF page notes';
      await writePageNotes(notesDir, pages, 'PDF page');
    } else if (ext === '.pptx') {
      stage = 'extract PPTX text';
      const text = await extractOfficeText(root, sourcePath, 'pptx');
      log.push('- Extracted PPTX text with OOXML helper.');
      stage = 'render PPTX slides';
      await ensureVisualDirs(pagesDir, notesDir);
      const pages = await renderPptx(root, sourcePath, pagesDir, log);
      body = renderAgentMarkdown(sourcePath, ext, 'pptx-text-and-render', text, 'Rendered PPTX slides are available in `pages/`.', pages);
      stage = 'write PPTX slide notes';
      await writePageNotes(notesDir, pages, 'PPTX slide');
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
      stage = 'copy image into pages directory';
      await ensureVisualDirs(pagesDir, notesDir);
      const target = resolve(pagesDir, basename(sourcePath));
      await copyFile(sourcePath, target);
      const pages = [target];
      body = renderAgentMarkdown(sourcePath, ext, 'image-copy', '', 'Image copied for visual inspection.', pages);
      stage = 'write image page note';
      await writePageNotes(notesDir, pages, 'Image');
      log.push('- Copied image into pages directory.');
    } else {
      stage = 'choose conversion path';
      throw new Error(`Unsupported file type: ${ext}`);
    }

    log.push('', `- Completed: ${new Date().toISOString()}`);
    await writeText(agentFile, body);
    await writeText(logFile, log.join('\n'));
    return { agentFile, logFile, outDir };
  } catch (error) {
    await removeIfExists(agentFile);
    await writeFailureLog(logFile, log, {
      error,
      ext,
      sourcePath,
      stage,
      paths: { outDir, pagesDir, notesDir, tempPptxRenderDir, agentFile, logFile }
    });
    throw error;
  }
}

function renderAgentMarkdown(sourcePath, ext, method, text, visualContext, pages) {
  const pageList = pages.map((page, index) => `- Page ${index + 1}: \`${page}\``).join('\n') || '- None';
  return `# Converted File: ${basename(sourcePath)}

## Source Metadata

- Source file: \`${sourcePath}\`
- File type: \`${ext}\`
- Conversion method: ${method}
- Converted at: ${new Date().toISOString()}
- Converted by: document-ingestor

## Visible Text

${mdEscape(text || 'No text was extracted. If this is a visual file, inspect the rendered pages and page notes.')}

## Visual Context

${visualContext || 'No separate visual rendering was required.'}

## Rendered Pages Or Slides

${pageList}

## Agent-Readable Reconstruction

${mdEscape(text || 'Visual inspection required. Use the rendered pages and page-notes folder to reconstruct content without summarizing away details.')}

## Conversion Limitations

- Visual-heavy files require a coding agent to inspect rendered images and update page notes.
- If an external renderer was missing, conversion fails instead of pretending success.
`;
}

async function extractOfficeText(root, sourcePath, kind) {
  const helper = computerPath(root, 'tools/helpers/extract_ooxml_text.py');
  try {
    const { stdout } = await exec('python3', [helper, sourcePath, kind], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to extract ${kind.toUpperCase()} text. python3 is required. ${error.message}`);
  }
}

async function tryPdfText(sourcePath, log) {
  try {
    const { stdout } = await exec('pdftotext', ['-layout', sourcePath, '-'], { maxBuffer: 20 * 1024 * 1024 });
    log.push('- Used pdftotext for text extraction.');
    return stdout.trim();
  } catch {
    log.push('- pdftotext unavailable or failed; continuing with rendered pages.');
    return '';
  }
}

async function tryPdfjsIngest(root, sourcePath, outDir, log) {
  const helper = computerPath(root, 'tools/helpers/ingest_pdf_pdfjs.mjs');
  if (!exists(helper)) {
    log.push('- pdfjs-helper unavailable: helper file not found.');
    return null;
  }

  const attempts = pdfjsRuntimeCandidates();
  const seen = new Set();
  for (const attempt of attempts) {
    const key = `${attempt.node}::${attempt.nodePath || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const env = { ...process.env };
    if (attempt.nodePath) env.NODE_PATH = joinNodePath(attempt.nodePath, env.NODE_PATH);

    try {
      await exec(attempt.node, [helper, sourcePath, root], {
        cwd: root,
        env,
        maxBuffer: 30 * 1024 * 1024
      });
      log.push(`- Rendered PDF pages with pdfjs-helper using ${attempt.label}.`);
      return {
        agentFile: resolve(outDir, 'source.agent.md'),
        logFile: resolve(outDir, 'conversion-log.md'),
        outDir
      };
    } catch (error) {
      log.push(`- pdfjs-helper unavailable with ${attempt.label}: ${oneLine(error.message)}`);
    }
  }

  return null;
}

async function renderPdf(root, sourcePath, pagesDir, log) {
  const prefix = resolve(pagesDir, 'page');
  try {
    await exec('pdftoppm', ['-png', sourcePath, prefix], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    throw new Error(`PDF rendering requires pdftoppm (Poppler). Missing dependency or render failed: ${error.message}`);
  }
  log.push('- Rendered PDF pages with pdftoppm.');
  return listGenerated(pagesDir);
}

async function renderPptx(root, sourcePath, pagesDir, log) {
  const tempDir = resolve(dirname(pagesDir), 'tmp-pptx-render');
  await ensureDir(tempDir);
  try {
    await exec(resolveSoffice(), ['--headless', '--convert-to', 'pdf', '--outdir', tempDir, sourcePath], { cwd: root, maxBuffer: 20 * 1024 * 1024 });
  } catch (error) {
    throw new Error(`PPTX rendering requires LibreOffice/soffice. Missing dependency or conversion failed: ${error.message}`);
  }
  const pdfName = basename(sourcePath).replace(/\.pptx$/i, '.pdf');
  const pdfPath = resolve(tempDir, pdfName);
  if (!exists(pdfPath)) throw new Error(`LibreOffice did not produce expected PDF: ${pdfPath}`);
  const pages = await renderPdf(root, pdfPath, pagesDir, log);
  log.push('- Converted PPTX to PDF with LibreOffice, then rendered slides with pdftoppm.');
  return pages;
}

function resolveSoffice() {
  return 'soffice';
}

function pdfjsRuntimeCandidates() {
  const bundledNodeDir = resolve(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node');
  return [
    {
      label: 'current Node runtime',
      node: process.execPath,
      nodePath: process.env.AGENT_COMPUTER_NODE_MODULES || process.env.NODE_PATH || ''
    },
    {
      label: 'Codex bundled Node runtime',
      node: resolve(bundledNodeDir, 'bin/node'),
      nodePath: resolve(bundledNodeDir, 'node_modules')
    }
  ].filter((candidate) => exists(candidate.node));
}

function joinNodePath(first, second) {
  return [first, second].filter(Boolean).join(':');
}

function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function listGenerated(dir) {
  const names = (await fs.readdir(dir)).filter((name) => /\.(png|jpg|jpeg)$/i.test(name)).sort();
  return names.map((name) => resolve(dir, name));
}

async function writePageNotes(notesDir, pages, label) {
  for (let i = 0; i < pages.length; i++) {
    await writeText(resolve(notesDir, `page-${String(i + 1).padStart(3, '0')}.md`), `# ${label} ${i + 1}

## Vision Pass Status

- Status: needs visual review
- Review source: inspect the rendered image below and update this page note.

## Rendered Image

\`${pages[i]}\`

## Visible Text

Record visible text here after visual review. Use embedded text as support when available.

## Visual Layout

Describe layout, hierarchy, charts, tables, diagrams, images, callouts, captions, and emphasis.

## Tables And Charts

Describe table/chart structure, labels, measures, trends, comparisons, and conclusions.

## Images And Diagrams

Describe diagrams, screenshots, process flows, icons, arrows, and visual relationships.

## Unreadable Or Uncertain Areas

Mark small, ambiguous, cropped, or visually unclear content instead of guessing.

## Agent-Readable Reconstruction

Reconstruct the page without summarizing away important content.

## Visual Reconstruction Addendum

After visual review, write what another agent needs to know to reuse this page.
`);
  }
}

async function ensureVisualDirs(pagesDir, notesDir) {
  await ensureDir(pagesDir);
  await ensureDir(notesDir);
}

async function removeIfExists(path) {
  await fs.rm(path, { force: true });
}

async function removeEmptyDirIfPresent(path) {
  try {
    await fs.rmdir(path);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTEMPTY') return;
    throw error;
  }
}

async function writeFailureLog(logFile, log, details) {
  const dependency = dependencyHint(details.ext, details.stage, details.error.message);
  const partialStatus = await partialArtifactStatus(details.paths);
  log.push(
    '',
    '## Failure',
    '',
    '- Status: failed',
    `- Failed at: ${new Date().toISOString()}`,
    `- Failure stage: ${details.stage}`,
    `- Required dependency: ${dependency}`,
    '',
    '## Error Message',
    '',
    '```text',
    details.error.message,
    '```',
    '',
    '## Partial Artifact Status',
    '',
    ...partialStatus,
    '',
    '## Safety Note',
    '',
    '- `source.agent.md` was not written because the conversion did not complete.',
    '- A failed conversion log is kept so downstream agents can see why no converted source exists.'
  );
  await writeText(logFile, log.join('\n'));
}

function dependencyHint(ext, stage, message) {
  if (ext === '.pdf' && /pdftoppm|render PDF/i.test(`${stage} ${message}`)) return 'Poppler `pdftoppm`';
  if (ext === '.pdf' && /pdftotext/i.test(`${stage} ${message}`)) return 'Optional Poppler `pdftotext`; PDFJS helper or Poppler `pdftoppm` is required for visual rendering';
  if (ext === '.pptx' && /soffice|LibreOffice/i.test(`${stage} ${message}`)) return 'LibreOffice/soffice';
  if (ext === '.pptx' && /pdftoppm|render PDF/i.test(`${stage} ${message}`)) return 'Poppler `pdftoppm` after LibreOffice PDF export';
  if (ext === '.docx' || ext === '.pptx') return 'python3 for OOXML text extraction';
  return 'none identified';
}

async function partialArtifactStatus(paths) {
  const entries = [
    ['output directory', paths.outDir],
    ['pages directory', paths.pagesDir],
    ['page-notes directory', paths.notesDir],
    ['tmp-pptx-render directory', paths.tempPptxRenderDir],
    ['source.agent.md', paths.agentFile],
    ['conversion-log.md', paths.logFile]
  ];

  const lines = [];
  for (const [label, path] of entries) {
    if (path === paths.logFile) {
      lines.push(`- ${label}: will be written with this failure report`);
      continue;
    }
    lines.push(`- ${label}: ${await describePath(path)}`);
  }
  return lines;
}

async function describePath(path) {
  try {
    const stat = await fs.stat(path);
    if (stat.isDirectory()) {
      const names = await fs.readdir(path);
      return `exists, directory, ${names.length} item(s)`;
    }
    return `exists, file, ${stat.size} bytes`;
  } catch (error) {
    if (error.code === 'ENOENT') return 'not present';
    return `unknown (${error.message})`;
  }
}
