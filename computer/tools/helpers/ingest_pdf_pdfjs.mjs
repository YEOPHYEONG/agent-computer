#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { basename, extname, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { ensureDir, safeTopicName, writeText } from '../lib/files.mjs';
import { mdEscape } from '../lib/markdown.mjs';

const require = createRequire(import.meta.url);

function usage() {
  return `Usage: node tools/helpers/ingest_pdf_pdfjs.mjs <source.pdf> [workspace-root]

Requires pdfjs-dist and @napi-rs/canvas to be resolvable by Node.
`;
}

async function loadPdfTools() {
  try {
    const pdfjsPath = require.resolve('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjs = await import(pathToFileURL(pdfjsPath).href);
    const canvas = require('@napi-rs/canvas');
    return { pdfjs, canvas };
  } catch (error) {
    throw new Error(
      `Missing PDF helper dependencies. Set NODE_PATH to the bundled node_modules or install local dependencies. ${error.message}`
    );
  }
}

function textLineKey(y) {
  return Math.round(y / 3) * 3;
}

function normalizeText(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

function extractLines(textItems) {
  const rows = new Map();
  for (const item of textItems) {
    const text = normalizeText(item.str);
    if (!text) continue;
    const transform = item.transform || [0, 0, 0, 0, 0, 0];
    const x = Number(transform[4] || 0);
    const y = Number(transform[5] || 0);
    const key = textLineKey(y);
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push({ text, x, y });
  }

  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, items]) =>
      items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s+([,.;:!?%])/g, '$1')
        .trim()
    )
    .filter(Boolean);
}

function fencedText(lines) {
  const text = Array.isArray(lines) ? lines.join('\n') : String(lines ?? '');
  return ['```text', mdEscape(text || '(No embedded text extracted.)'), '```'].join('\n');
}

function pageNote(page) {
  return `# PDF Page ${page.number}

## Vision Pass Status

- Status: needs visual review
- Review source: inspect \`${page.renderedImageRel}\` directly, then update the sections below.
- Default approach: use the rendered page image as the visual source of truth and the embedded text as support.

## Rendered Image

\`${page.renderedImageRel}\`

## Visible Text

${fencedText(page.lines)}

## Visual Layout

- Rendered image size: ${page.renderedWidth} x ${page.renderedHeight}px.
- Text reconstruction method: embedded PDF text grouped by page coordinates, then ordered top-to-bottom and left-to-right.
- Visual elements, diagrams, tables, and image-only text are preserved in the rendered image for inspection.
- Vision pass notes:
  - Page role/purpose:
  - Layout structure:
  - Visual hierarchy and emphasis:
  - Important non-text context:

## Tables And Charts

- Not automatically classified. Inspect \`${page.renderedImageRel}\` for table/chart structure.
- If present, describe table/chart structure, labels, measures, trends, comparisons, and conclusions here.

## Images And Diagrams

- Non-text visuals are retained in the rendered page image.
- If present, describe diagrams, screenshots, icons, process flows, callouts, arrows, and relationships here.

## Unreadable Or Uncertain Areas

- Mark small, ambiguous, cropped, or visually unclear content here instead of guessing.

## Agent-Readable Reconstruction

${fencedText(page.lines)}

## Visual Reconstruction Addendum

- After visual review, write the page in a form another agent can reuse without opening the image unless visual precision is required.
`;
}

function sourceMarkdown(sourcePath, outDir, pages, contactSheets, options) {
  const pageIndex = pages
    .map(
      (page) =>
        `- Page ${page.number}: \`${page.pageNoteRel}\`, image \`${page.renderedImageRel}\`, ${page.lines.length} reconstructed text line(s), ${page.textItemCount} text item(s)`
    )
    .join('\n');
  const sheetList = contactSheets.map((sheet) => `- \`${relative(outDir, sheet)}\``).join('\n') || '- None';

  const pageSections = pages
    .map(
      (page) => `### Page ${page.number}

#### Rendered Image

\`${page.renderedImageRel}\`

#### Vision Pass Status

- Status: needs visual review
- Review target: \`${page.renderedImageRel}\`

#### Visible Text

${fencedText(page.lines)}

#### Visual Layout

- Rendered image size: ${page.renderedWidth} x ${page.renderedHeight}px.
- Text was reconstructed from embedded PDF text using coordinate grouping.
- Inspect the rendered image for visual hierarchy, diagrams, images, tables, and any text not present in embedded PDF text.
- Update the page note after visual review with layout, tables/charts, diagrams, image context, uncertainty, and reusable reconstruction.

#### Agent-Readable Reconstruction

${fencedText(page.lines)}
`
    )
    .join('\n');

  return `# Converted File: ${basename(sourcePath)}

## Source Metadata

- Source file: \`${sourcePath}\`
- File type: \`.pdf\`
- Pages: ${pages.length}
- Conversion method: pdfjs-dist text extraction plus @napi-rs/canvas page rendering
- Render scale: ${options.scale}
- Converted at: ${options.convertedAt}
- Converted by: document-ingestor/pdfjs-helper

## Output Files

- Agent Markdown: \`${relative(outDir, options.agentFile)}\`
- Conversion log: \`${relative(outDir, options.logFile)}\`
- Rendered pages: \`pages/\`
- Page notes: \`page-notes/\`
- Extracted plain text: \`extracted-text/\`
- Contact sheets: \`contact-sheets/\`
- Visual review checklist: \`${relative(outDir, options.visualReviewFile)}\`

## Visual Review Status

- Status: needs page-by-page vision review
- Instruction: inspect each rendered page image and update the matching \`page-notes/page-XXX.md\`.
- Source of truth for visual structure: rendered PNGs in \`pages/\`.
- Embedded text is support material; it is not a substitute for reading the page image.

## Page Index

${pageIndex}

## Contact Sheets

${sheetList}

## Page-Level Markdown

${pageSections}

## Conversion Notes

- This file preserves embedded PDF text page by page instead of summarizing it.
- Page PNGs preserve visual context for diagrams, screenshots, layout, tables, charts, and image-only areas.
- Visual understanding is a separate review step. Inspect rendered PNGs and update page notes before using this as a final high-fidelity interpretation of visual-heavy pages.
`;
}

function visualReviewMarkdown(sourcePath, outDir, pages, contactSheets, options) {
  const sheetList = contactSheets.map((sheet) => `- [ ] Inspect \`${relative(outDir, sheet)}\``).join('\n') || '- None';
  const pageRows = pages
    .map(
      (page) =>
        `| ${page.number} | [ ] | \`${page.renderedImageRel}\` | \`${page.pageNoteRel}\` | ${page.lines.length} | Fill visual layout, tables/charts, diagrams, uncertainties, and visual addendum |`
    )
    .join('\n');

  return `# Visual Review Checklist

## Source

- Source file: \`${sourcePath}\`
- Generated at: ${options.convertedAt}
- Pages: ${pages.length}

## Purpose

Use this file after conversion to perform the document-ingestor vision pass. The conversion step renders pages and extracts embedded text; the vision pass turns page images into reusable visual understanding.

## Rules

- Inspect the rendered PNG for each page.
- Do not treat embedded text order as the final page meaning when the visual layout says otherwise.
- Preserve tables, charts, diagrams, screenshots, callouts, captions, page hierarchy, and uncertainty.
- If a page is dense, write what another agent needs to know to use the page without reopening the image.
- Mark unclear or unreadable areas instead of guessing.

## Contact Sheet Review

${sheetList}

## Page Review Queue

| Page | Reviewed | Image | Page Note | Embedded Lines | Required Update |
|---:|---|---|---|---:|---|
${pageRows}

## Completion Criteria

- Every page note has \`Vision Pass Status\` changed from \`needs visual review\` to \`reviewed\`.
- Every visual-heavy page has concrete layout and visual component notes.
- Tables/charts/diagrams are described structurally, not merely listed as present.
- Uncertain areas are marked clearly.
`;
}

function logMarkdown(sourcePath, outDir, pages, contactSheets, options) {
  return `# Conversion Log

- Source: ${sourcePath}
- Started: ${options.startedAt}
- Completed: ${options.convertedAt}
- Extension: .pdf
- Page count: ${pages.length}
- Method: pdfjs-dist embedded text extraction and @napi-rs/canvas rendering
- Render scale: ${options.scale}

## Output

- Output directory: ${outDir}
- Agent Markdown: ${options.agentFile}
- Page notes written: ${pages.length}
- Rendered page images written: ${pages.length}
- Contact sheets written: ${contactSheets.length}
- Visual review checklist: ${options.visualReviewFile}

## Validation

- Loaded the PDF successfully.
- Rendered every page to PNG.
- Extracted embedded text page by page.
- Created page-level Markdown notes.
- Created a visual review checklist for page-by-page vision pass.

## Limitations

- Visual review is not automatically completed by this helper. A coding agent should inspect rendered PNGs and update page notes.
- Layout reconstruction from embedded text is coordinate-based and approximate. Tables and diagrams are preserved visually but not semantically classified until the vision pass.
- If Korean or English text appears out of order in a page, inspect the page image and update that page note manually.
`;
}

async function createContactSheets({ pages, outDir, canvasTools }) {
  const { createCanvas, loadImage } = canvasTools;
  const sheets = [];
  const perSheet = 6;
  const thumbWidth = 320;
  const thumbHeight = 180;
  const labelHeight = 32;
  const gap = 18;
  const cols = 2;
  const rows = 3;
  const sheetWidth = cols * thumbWidth + (cols + 1) * gap;
  const sheetHeight = rows * (thumbHeight + labelHeight) + (rows + 1) * gap;
  const sheetsDir = resolve(outDir, 'contact-sheets');
  await ensureDir(sheetsDir);

  for (let start = 0; start < pages.length; start += perSheet) {
    const chunk = pages.slice(start, start + perSheet);
    const canvas = createCanvas(sheetWidth, sheetHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetWidth, sheetHeight);
    ctx.fillStyle = '#111111';
    ctx.font = '16px sans-serif';

    for (let index = 0; index < chunk.length; index++) {
      const page = chunk[index];
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = gap + col * (thumbWidth + gap);
      const y = gap + row * (thumbHeight + labelHeight + gap);
      const image = await loadImage(page.renderedImage);
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(x, y, thumbWidth, thumbHeight);
      ctx.drawImage(image, x, y, thumbWidth, thumbHeight);
      ctx.strokeStyle = '#cccccc';
      ctx.strokeRect(x, y, thumbWidth, thumbHeight);
      ctx.fillStyle = '#111111';
      ctx.fillText(`Page ${page.number}`, x, y + thumbHeight + 22);
    }

    const end = start + chunk.length;
    const sheetPath = resolve(sheetsDir, `contact-sheet-${String(start + 1).padStart(3, '0')}-${String(end).padStart(3, '0')}.png`);
    await fs.writeFile(sheetPath, canvas.toBuffer('image/png'));
    sheets.push(sheetPath);
  }

  return sheets;
}

async function main() {
  const sourceArg = process.argv[2];
  const rootArg = process.argv[3] || process.cwd();
  if (!sourceArg) throw new Error(usage());

  const sourcePath = resolve(process.cwd(), sourceArg);
  if (extname(sourcePath).toLowerCase() !== '.pdf') throw new Error(`Expected a PDF file: ${sourcePath}`);

  const root = resolve(process.cwd(), rootArg);
  const base = safeTopicName(basename(sourcePath, extname(sourcePath)));
  const outDir = resolve(root, 'projects', base, 'converted');
  const pagesDir = resolve(outDir, 'pages');
  const notesDir = resolve(outDir, 'page-notes');
  const textDir = resolve(outDir, 'extracted-text');
  const agentFile = resolve(outDir, 'source.agent.md');
  const logFile = resolve(outDir, 'conversion-log.md');
  const visualReviewFile = resolve(outDir, 'visual-review.md');
  const scale = Number(process.env.PDF_RENDER_SCALE || '2');
  const startedAt = new Date().toISOString();

  const { pdfjs, canvas } = await loadPdfTools();
  const { createCanvas } = canvas;
  await ensureDir(pagesDir);
  await ensureDir(notesDir);
  await ensureDir(textDir);

  const data = new Uint8Array(await fs.readFile(sourcePath));
  const doc = await pdfjs.getDocument({
    data,
    disableWorker: true,
    useSystemFonts: true
  }).promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const renderedWidth = Math.ceil(viewport.width);
    const renderedHeight = Math.ceil(viewport.height);
    const canvasPage = createCanvas(renderedWidth, renderedHeight);
    const context = canvasPage.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, renderedWidth, renderedHeight);

    await page.render({
      canvasContext: context,
      viewport,
      background: 'white'
    }).promise;

    const renderedImage = resolve(pagesDir, `page-${String(pageNumber).padStart(3, '0')}.png`);
    await fs.writeFile(renderedImage, canvasPage.toBuffer('image/png'));

    const textContent = await page.getTextContent();
    const textItems = textContent.items || [];
    const lines = extractLines(textItems);
    const pageTextPath = resolve(textDir, `page-${String(pageNumber).padStart(3, '0')}.txt`);
    await writeText(pageTextPath, `${lines.join('\n')}\n`);

    const pageRecord = {
      number: pageNumber,
      renderedImage,
      renderedImageRel: relative(outDir, renderedImage),
      renderedWidth,
      renderedHeight,
      lines,
      textItemCount: textItems.filter((item) => normalizeText(item.str)).length
    };
    pageRecord.pageNote = resolve(notesDir, `page-${String(pageNumber).padStart(3, '0')}.md`);
    pageRecord.pageNoteRel = relative(outDir, pageRecord.pageNote);
    await writeText(pageRecord.pageNote, pageNote(pageRecord));
    pages.push(pageRecord);
    page.cleanup();
  }

  await writeText(
    resolve(textDir, 'all-pages.txt'),
    pages.map((page) => [`--- Page ${page.number} ---`, ...page.lines, ''].join('\n')).join('\n')
  );

  const contactSheets = await createContactSheets({ pages, outDir, canvasTools: canvas });
  const convertedAt = new Date().toISOString();
  const options = { scale, startedAt, convertedAt, agentFile, logFile, visualReviewFile };
  await writeText(agentFile, sourceMarkdown(sourcePath, outDir, pages, contactSheets, options));
  await writeText(visualReviewFile, visualReviewMarkdown(sourcePath, outDir, pages, contactSheets, options));
  await writeText(logFile, logMarkdown(sourcePath, outDir, pages, contactSheets, options));

  console.log(`Wrote ${agentFile}`);
  console.log(`Log ${logFile}`);
  console.log(`Pages ${pages.length}`);
  console.log(`Contact sheets ${contactSheets.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
