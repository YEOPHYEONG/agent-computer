import { basename, relative } from 'node:path';
import { ensureDir, readText, safeTopicName, writeText } from './files.mjs';
import { inferProjectSlug, projectPath } from './project-paths.mjs';
import { userRoot } from './workspace.mjs';

export async function buildWebPageFromFile(root, filePath, options = {}) {
  const source = await readText(filePath, undefined);
  const title = options.title || inferTitle(source) || basename(filePath).replace(/\.[^.]+$/, '');
  const topic = safeTopicName(title);
  const project = inferProjectSlug(root, filePath, topic);
  const outDir = projectPath(root, project, 'web', topic);
  const sourceRel = relative(userRoot(root), filePath).replace(/\\/g, '/');
  const toc = extractToc(source);
  const htmlBody = markdownToHtml(source);

  await ensureDir(outDir);
  const indexPath = `${outDir}/index.html`;
  const cssPath = `${outDir}/styles.css`;
  const jsPath = `${outDir}/app.js`;
  const readmePath = `${outDir}/README.md`;

  await writeText(indexPath, renderIndex({ title, sourceRel, toc, htmlBody }));
  await writeText(cssPath, renderCss());
  await writeText(jsPath, renderJs());
  await writeText(readmePath, renderReadme({ title, sourceRel, indexPath, cssPath, jsPath }));

  return {
    files: [indexPath, cssPath, jsPath, readmePath],
    text: `Wrote local web artifact under ${outDir}`
  };
}

function inferTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || '';
}

function extractToc(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter(Boolean)
    .slice(0, 18)
    .map((match) => ({
      level: match[1].length,
      title: stripInline(match[2]),
      id: slugify(match[2])
    }));
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    out.push('<ul>');
    for (const item of list) out.push(`<li>${inline(item)}</li>`);
    out.push('</ul>');
    list = [];
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 5);
      const text = stripInline(heading[2]);
      out.push(`<h${level} id="${slugify(text)}">${inline(text)}</h${level}>`);
      continue;
    }

    if (line.trim().startsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      flushParagraph();
      flushList();
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i += 1;
      }
      i -= 1;
      out.push(renderTable(tableLines));
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return out.join('\n');
}

function renderTable(lines) {
  const rows = lines
    .filter((line) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line))
    .map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
  if (!rows.length) return '';
  const [head, ...body] = rows;
  const headHtml = head.map((cell) => `<th>${inline(cell)}</th>`).join('');
  const bodyHtml = body.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('\n');
  return `<div class="table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function renderIndex({ title, sourceRel, toc, htmlBody }) {
  const tocHtml = toc.length
    ? toc.map((item) => `<a class="toc-link level-${item.level}" href="#${item.id}">${escapeHtml(item.title)}</a>`).join('\n')
    : '<span class="toc-empty">No section headings found.</span>';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <header class="hero">
    <div class="eyebrow">Agent Computer Web Report</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="dek">This page is a presentation layer generated from a separate Markdown research/report artifact. The source report remains the durable evidence layer.</p>
    <div class="source-pill">Source: ${escapeHtml(sourceRel)}</div>
  </header>
  <main class="shell">
    <aside class="toc" aria-label="Table of contents">
      <div class="toc-title">Sections</div>
      ${tocHtml}
    </aside>
    <article class="report">
      ${htmlBody}
    </article>
  </main>
  <script src="./app.js"></script>
</body>
</html>
`;
}

function renderCss() {
  return `:root {
  color-scheme: light;
  --bg: #f6f3ee;
  --ink: #171717;
  --muted: #5e625f;
  --line: #d8d2c8;
  --paper: #fffdfa;
  --accent: #235f8f;
  --accent-2: #1f7a5c;
  --warn: #8d4f20;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
}

.hero {
  min-height: 360px;
  padding: 64px clamp(24px, 6vw, 96px) 44px;
  background:
    linear-gradient(135deg, rgba(35, 95, 143, 0.18), rgba(31, 122, 92, 0.12)),
    var(--paper);
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  font-size: 13px;
  font-weight: 760;
  letter-spacing: 0;
  color: var(--accent);
  text-transform: uppercase;
}

h1 {
  max-width: 1050px;
  margin: 18px 0;
  font-size: clamp(42px, 6vw, 78px);
  line-height: 0.96;
  letter-spacing: 0;
}

.dek {
  max-width: 780px;
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 19px;
}

.source-pill {
  display: inline-flex;
  max-width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.66);
  border-radius: 999px;
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.shell {
  display: grid;
  grid-template-columns: minmax(190px, 260px) minmax(0, 1fr);
  gap: 32px;
  width: min(1320px, calc(100% - 40px));
  margin: 34px auto 72px;
}

.toc {
  position: sticky;
  top: 18px;
  align-self: start;
  max-height: calc(100vh - 36px);
  overflow: auto;
  padding: 18px;
  border: 1px solid var(--line);
  background: rgba(255, 253, 250, 0.82);
  border-radius: 8px;
}

.toc-title {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
  color: var(--muted);
}

.toc-link {
  display: block;
  padding: 7px 0;
  color: var(--ink);
  text-decoration: none;
  border-top: 1px solid rgba(216, 210, 200, 0.7);
  font-size: 14px;
}

.toc-link.level-3 {
  padding-left: 12px;
  color: var(--muted);
}

.toc-link.active {
  color: var(--accent);
  font-weight: 760;
}

.report {
  min-width: 0;
  padding: clamp(24px, 4vw, 52px);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(31, 28, 23, 0.07);
}

.report h2,
.report h3,
.report h4,
.report h5 {
  margin: 42px 0 14px;
  line-height: 1.12;
  letter-spacing: 0;
}

.report h2 {
  font-size: 34px;
}

.report h3 {
  font-size: 25px;
  color: var(--accent);
}

.report h4,
.report h5 {
  font-size: 20px;
}

.report p,
.report li {
  font-size: 17px;
}

.report p {
  margin: 12px 0;
}

.report ul {
  padding-left: 22px;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
  margin: 22px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  background: #fff;
}

th,
td {
  padding: 12px 14px;
  vertical-align: top;
  border-bottom: 1px solid var(--line);
  text-align: left;
}

th {
  color: var(--accent);
  background: #f1f7f8;
  font-size: 13px;
  text-transform: uppercase;
}

code {
  padding: 2px 5px;
  border-radius: 4px;
  background: #ece6dc;
}

strong {
  color: #0f4533;
}

@media (max-width: 860px) {
  .shell {
    display: block;
  }

  .toc {
    position: static;
    margin-bottom: 20px;
  }

  h1 {
    font-size: 42px;
  }
}
`;
}

function renderJs() {
  return `const links = [...document.querySelectorAll('.toc-link')];
const headings = links
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateActiveLink() {
  const current = headings
    .filter((heading) => heading.getBoundingClientRect().top < 160)
    .at(-1);
  links.forEach((link) => link.classList.remove('active'));
  if (!current) return;
  const active = links.find((link) => link.getAttribute('href') === '#' + current.id);
  if (active) active.classList.add('active');
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();
`;
}

function renderReadme({ title, sourceRel }) {
  return `# ${title}

This is a local static web artifact generated by \`web-builder\`.

## Source Of Truth

- Source report: \`${sourceRel}\`

The HTML page is a presentation layer. Keep the Markdown report as the durable research/report source of truth.

## Files

- \`index.html\`
- \`styles.css\`
- \`app.js\`

## QA Notes

- Open \`index.html\` locally to inspect layout.
- Check that source/caveat boundaries from the report are still visible.
- If this page came from deep research, verify that the full Markdown research/report artifact also exists.
`;
}

function inline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function stripInline(value) {
  return value.replace(/[*_`#]/g, '').trim();
}

function slugify(value) {
  return safeTopicName(stripInline(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
