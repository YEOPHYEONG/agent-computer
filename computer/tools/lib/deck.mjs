import { promises as fs } from 'node:fs';
import { basename, resolve } from 'node:path';
import { ensureDir, readText, safeTopicName, writeText } from './files.mjs';
import { mdEscape, splitSentences, stripMarkdown } from './markdown.mjs';
import { inferProjectSlug, projectPath } from './project-paths.mjs';
import { writeEditablePptx } from './pptx-writer.mjs';

export async function planPremiumDeckFromFile(root, filePath, options = {}) {
  const plan = await writePremiumDeckPlan(root, filePath, options);
  return {
    files: plan.files,
    text: `Wrote premium PPT production plan for ${plan.title}. No PPTX was created.`
  };
}

export async function buildPremiumDeckFromFile(root, filePath, options = {}) {
  const plan = await writePremiumDeckPlan(root, filePath, options);
  const runId = options.runId || `auto-${new Date().toISOString().slice(0, 10)}-${plan.topic}`;
  const workDir = projectPath(root, plan.project, 'presentations', runId);
  const prototypePath = resolve(workDir, 'prototype', 'index.html');
  const qaDir = projectPath(root, plan.project, 'qa', runId);
  const extractedTextPath = resolve(qaDir, 'pptx-extracted-text.txt');
  const packageQaPath = resolve(qaDir, 'pptx-package-qa.json');
  const workflowQaPath = resolve(qaDir, 'pptx-workflow-qa.md');
  const pptxPath = projectPath(root, plan.project, 'presentations', `${plan.topic}.pptx`);

  await writeText(prototypePath, renderHtmlPrototype(plan.title, plan.outline));
  await writeEditablePptx(pptxPath, buildEditableDeck(plan.title, plan.outline));

  const qa = await inspectPptxPackage(pptxPath, plan.outline.slides.length);
  await ensureDir(qaDir);
  await writeText(extractedTextPath, qa.extractedText);
  await writeText(packageQaPath, JSON.stringify({ ...qa, extractedText: undefined, extractedTextPath, pptxPath, prototypePath }, null, 2));
  await writeText(workflowQaPath, renderWorkflowQa(plan.title, pptxPath, prototypePath, extractedTextPath, packageQaPath, qa));

  return {
    text: `Built editable PPTX for ${plan.title}.`,
    pptx: pptxPath,
    files: [...plan.files, prototypePath, workflowQaPath, packageQaPath, extractedTextPath],
    prototypePath,
    qaPath: workflowQaPath
  };
}

async function writePremiumDeckPlan(root, filePath, options = {}) {
  const source = await readText(filePath, undefined);
  const title = options.title || titleFromFile(filePath);
  const topic = safeTopicName(title);
  const project = inferProjectSlug(root, filePath, topic);
  const outline = buildOutline(source, title, options);

  const contentSpecPath = projectPath(root, project, 'presentations', `${topic}_ppt-content-spec.md`);
  const designSpecPath = projectPath(root, project, 'presentations', `${topic}_ppt-design-spec.md`);
  const buildPlanPath = projectPath(root, project, 'presentations', `${topic}_ppt-build-plan.md`);
  const qaPath = projectPath(root, project, 'qa', `${topic}_ppt-qa.md`);
  const plannedPptxPath = projectPath(root, project, 'presentations', `${topic}.pptx`);

  await writeText(contentSpecPath, renderContentSpec(title, filePath, outline));
  await writeText(designSpecPath, renderDesignSpec(title, outline));
  await writeText(buildPlanPath, renderBuildPlan(title, filePath, outline, contentSpecPath, designSpecPath, plannedPptxPath));
  await writeText(qaPath, renderPlanQa(title, outline));

  return {
    title,
    topic,
    project,
    outline,
    files: [contentSpecPath, designSpecPath, buildPlanPath, qaPath]
  };
}

function buildOutline(source, title, options = {}) {
  const sections = extractSections(source);
  const units = extractContentUnits(source);
  const maxSlides = clamp(Number(options.maxSlides) || 18, 10, 60);
  const referenceSet = chooseReferenceSet(source, title, options);
  const mainSections = sections.filter((section) => section.kind !== 'source-reference' && section.kind !== 'low-signal');
  const referenceSections = sections.filter((section) => section.kind === 'source-reference' || section.kind === 'low-signal');
  const slides = [];
  const sourceMap = [];

  slides.push({
    number: 1,
    role: 'cover',
    message: `${title}: what the audience should understand first`,
    required: [firstUsefulLine(source) || title],
    evidence: 'Source title and opening material',
    caveat: 'Do not imply facts not present in the source.',
    visual: 'Editorial cover with title, source chip, and workspace/file motif'
  });

  slides.push({
    number: 2,
    role: 'executive summary',
    message: 'The deck starts with the strongest conclusion and evidence boundary.',
    required: selectRepresentativeItems(units, 3, 650),
    evidence: 'Opening claims and summary material',
    caveat: 'Keep facts, interpretation, and assumptions visually distinct.',
    visual: 'Large thesis, three proof cards, and one caution rail'
  });

  const sectionSlides = mainSections.length ? mainSections : groupUnitsAsSections(units);
  const narrativeBudget = Math.max(4, maxSlides - 3);
  const deferredSections = [];

  for (let i = 0; i < sectionSlides.length; i++) {
    const section = sectionSlides[i];
    if (slides.length >= narrativeBudget) {
      deferredSections.push(section);
      continue;
    }
    const slide = makeSemanticSlide(section, i);
    slides.push(slide);
    sourceMap.push({
      section: section.title || `Source Block ${i + 1}`,
      treatment: 'narrative slide',
      slides: String(slides.length),
      note: sourceMapNote(section)
    });
  }

  if (!sectionSlides.some((section) => section.kind === 'recommendation')) {
    addSyntheticSlide(slides, source, /(recommend|next action|추천|다음|해야|필요)/i, {
      role: 'recommendation stack',
      message: 'Translate the source into decisions or next actions.',
      evidence: 'Recommendation and next-action sections where available',
      caveat: 'If source recommendations are missing, mark this as a synthesis slide.',
      visual: 'Prioritized recommendation cards with action/status labels'
    }, narrativeBudget);
  }

  if (!sectionSlides.some((section) => section.kind === 'evidence-boundary')) {
    addSyntheticSlide(slides, source, /(source|evidence|근거|출처|browser|브라우징|확인|uncertain|불확실)/i, {
      role: 'method/provenance',
      message: 'Show what evidence was used and what remains unverified.',
      evidence: 'Source, evidence, method, and uncertainty sections',
      caveat: 'Do not hide evidence gaps.',
      visual: 'Method cards, source chips, and caveat badges'
    }, narrativeBudget);
  }

  for (const section of deferredSections) {
    sourceMap.push({
      section: section.title,
      treatment: 'compressed into source map',
      slides: 'source map',
      note: 'Important logic should be referenced by the nearest narrative slide; verbatim text stays in the source file.'
    });
  }

  for (const section of referenceSections) {
    sourceMap.push({
      section: section.title,
      treatment: section.kind === 'source-reference' ? 'source archive/reference' : 'not slide-body material',
      slides: 'source map',
      note: sourceMapNote(section)
    });
  }

  slides.push({
    number: slides.length + 1,
    role: 'appendix/reference',
    message: 'Preserve the source map so condensed material can be audited without bloating the deck.',
    required: [
      `Detected source units: ${units.length}`,
      `Detected sections: ${sections.length}`,
      `Narrative sections mapped to slides: ${sourceMap.filter((entry) => entry.treatment === 'narrative slide').length}`,
      `Reference-only sections: ${sourceMap.filter((entry) => entry.treatment !== 'narrative slide').length}`
    ],
    evidence: 'Remaining source material',
    caveat: 'The source map preserves traceability; it is not a promise to paste every sentence into slides.',
    visual: 'Reference table/list with source labels'
  });

  return {
    referenceSet,
    sourceLength: source.length,
    sectionCount: sections.length,
    unitCount: units.length,
    sourceMap,
    referenceSectionCount: referenceSections.length,
    deferredSectionCount: deferredSections.length,
    assignedUnitCount: slides.reduce((count, slide) => count + (slide.required?.length || 0), 0),
    slides: slides.map((slide, index) => ({ ...slide, number: index + 1 }))
  };
}

function chooseReferenceSet(source, title, options = {}) {
  if (options.referenceSet) return referenceSetInfo(options.referenceSet, 'User-selected reference set.');
  const text = `${title}\n${source}`.toLowerCase();
  if (/board|executive|kpi|risk|투자|이사회|경영진|임원/.test(text)) {
    return referenceSetInfo('executive-board', 'The source appears to need decision, KPI, risk, and executive clarity.');
  }
  if (/product|feature|solution|workflow|roadmap|제품|기능|솔루션|로드맵/.test(text)) {
    return referenceSetInfo('product-deck', 'The source appears to explain a product, workflow, solution, or roadmap.');
  }
  if (/startup|launch|gtm|go[-\s]?to[-\s]?market|open[-\s]?source|growth|성장|출시|오픈소스/.test(text)) {
    return referenceSetInfo('startup-strategy', 'The source appears to need a launch, growth, or strategy narrative with proof.');
  }
  if (/research|evidence|source|claim|question|조사|리서치|근거|출처|질문/.test(text)) {
    return referenceSetInfo('research-briefing', 'The source is research-heavy and needs question, evidence, and caveat visibility.');
  }
  if (/brand|story|editorial|media|narrative|브랜드|스토리|미디어/.test(text)) {
    return referenceSetInfo('editorial-visual', 'The source benefits from editorial pacing and narrative visual rhythm.');
  }
  return referenceSetInfo('consulting-report', 'Default for structured reports that need crisp executive evidence and recommendations.');
}

function referenceSetInfo(name, reason) {
  const normalized = safeTopicName(name);
  return {
    name: normalized,
    board: `templates/ppt-reference-sets/${normalized}/reference-board.svg`,
    reason,
    translation: 'Use the reference board as layout and component guidance only; rebuild final slides as editable PPT elements.'
  };
}

function extractSections(source) {
  const lines = mdEscape(source).split('\n');
  const sections = [];
  let current = null;
  let referenceMode = false;
  let pendingTableHeader = null;
  let activeTable = null;

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      if (current) sections.push(current);
      const title = stripMarkdown(heading[2]);
      if (isReferenceHeading(title)) referenceMode = true;
      const kind = referenceMode ? 'source-reference' : sectionKind(title);
      current = { title, items: [], tables: [], kind, level: heading[1].length };
      pendingTableHeader = null;
      activeTable = null;
      continue;
    }
    const tableCells = parseMarkdownTableCells(line);
    if (tableCells && current) {
      if (isMarkdownSeparatorCells(tableCells)) {
        if (pendingTableHeader) {
          activeTable = { headers: pendingTableHeader, rows: [] };
          current.tables.push(activeTable);
          pendingTableHeader = null;
        }
        continue;
      }
      if (!activeTable) {
        pendingTableHeader = tableCells;
        continue;
      }
      activeTable.rows.push(tableCells);
      current.items.push(...splitLongText(formatTableRecord(current.title, activeTable.headers, tableCells)));
      continue;
    }
    pendingTableHeader = null;
    activeTable = null;
    let clean = normalizeSourceLine(line);
    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line)) clean = '';
    if (clean && current) current.items.push(...splitLongText(clean));
  }
  if (current) sections.push(current);
  return sections.filter((section) => section.items.length || section.title).map((section) => ({
    ...section,
    kind: section.items.length || section.kind === 'source-reference' ? section.kind : 'low-signal'
  }));
}

function extractContentUnits(source) {
  const lines = mdEscape(source).split('\n');
  const units = [];
  let paragraph = [];

  function flush() {
    const text = stripMarkdown(paragraph.join(' ')).replace(/\s+/g, ' ').trim();
    paragraph = [];
    if (!text) return;
    units.push(...splitLongText(text));
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      flush();
      units.push(`Section: ${stripMarkdown(line)}`);
      continue;
    }
    const tableRow = line.match(/^\|(.+)\|$/);
    if (tableRow) {
      flush();
      const cells = tableRow[1].split('|').map((cell) => stripMarkdown(cell).trim()).filter(Boolean);
      if (cells.length && !isMarkdownSeparatorCells(cells)) units.push(`Table row: ${cells.join(' / ')}`);
      continue;
    }
    const listItem = line.match(/^[-*+]\s+(.+)$/) || line.match(/^\d+[.)]\s+(.+)$/);
    if (listItem) {
      flush();
      units.push(stripMarkdown(listItem[1]));
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return units.filter(Boolean);
}

function parseMarkdownTableCells(line) {
  const value = String(line ?? '').trim();
  if (!value.startsWith('|') || !value.endsWith('|')) return null;
  const cells = value
    .slice(1, -1)
    .split('|')
    .map((cell) => normalizeTableCell(cell))
    .filter((cell) => cell.length);
  return cells.length ? cells : null;
}

function normalizeTableCell(cell) {
  return stripMarkdown(cell)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMarkdownSeparatorCells(cells) {
  return Array.isArray(cells) && cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
}

function formatTableRecord(sectionTitle, headers = [], cells = []) {
  const pairs = cells.map((cell, index) => {
    const header = normalizeTableHeader(headers[index] || `Item ${index + 1}`);
    return `${header}: ${cell}`;
  });
  const prefix = tableRecordPrefix(sectionTitle);
  return `${prefix}${pairs.join(' / ')}`;
}

function normalizeTableHeader(header) {
  const clean = normalizeTableCell(header)
    .replace(/\bor\b/gi, '/')
    .replace(/\s+/g, ' ')
    .trim();
  if (/claim|input/i.test(clean)) return 'Claim';
  if (/evidence status|status/i.test(clean)) return 'Status';
  if (/local evidence|evidence found|evidence/i.test(clean)) return 'Evidence';
  if (/report treatment|treatment/i.test(clean)) return 'Treatment';
  if (/gap|hypothesis/i.test(clean)) return 'Gap';
  if (/why/i.test(clean)) return 'Why it matters';
  if (/recommended evidence|evidence needed/i.test(clean)) return 'Evidence needed';
  if (/risk/i.test(clean)) return 'Risk';
  if (/severity/i.test(clean)) return 'Severity';
  if (/mitigation/i.test(clean)) return 'Mitigation';
  return clean || 'Item';
}

function tableRecordPrefix(sectionTitle) {
  if (/risk/i.test(sectionTitle)) return 'Risk row — ';
  if (/gap/i.test(sectionTitle)) return 'Gap row — ';
  if (/evidence|claim/i.test(sectionTitle)) return 'Evidence row — ';
  return 'Table row — ';
}

function tableForSection(section, role) {
  const tables = section.tables || [];
  if (!tables.length || !/table|matrix|risk|method|evidence/.test(role)) return null;
  const table = tables.find((candidate) => candidate.rows?.length) || tables[0];
  if (!table?.rows?.length) return null;
  const maxColumns = Math.min(table.headers.length || 0, 4);
  const headers = (table.headers || []).slice(0, maxColumns).map(normalizeTableHeader);
  const rows = table.rows.slice(0, 6).map((row) => row.slice(0, maxColumns).map((cell) => compactTableCell(cell)));
  const colWidths = columnWidthsForHeaders(headers);
  return {
    headers,
    rows,
    colWidths,
    truncatedCount: Math.max(0, table.rows.length - rows.length)
  };
}

function compactTableCell(cell) {
  const clean = normalizeTableCell(cell);
  if (clean.length <= 96) return clean;
  const sentence = splitSentences(clean)[0] || clean;
  return sentence.length <= 96 ? sentence : `${sentence.slice(0, 93).trim()}...`;
}

function columnWidthsForHeaders(headers) {
  const lower = headers.join(' ').toLowerCase();
  if (/claim/.test(lower) && /status/.test(lower) && /treatment/.test(lower)) return [0.34, 0.18, 0.28, 0.20];
  if (/gap/.test(lower) && /why/.test(lower)) return [0.32, 0.34, 0.34];
  if (/risk/.test(lower) && /severity/.test(lower)) return [0.38, 0.18, 0.44];
  return null;
}

function splitLongText(text) {
  if (text.length <= 340) return [text];
  const sentences = splitSentences(text);
  if (sentences.length > 1) return sentences;
  const chunks = [];
  for (let i = 0; i < text.length; i += 300) chunks.push(text.slice(i, i + 300).trim());
  return chunks;
}

function groupUnitsAsSections(units) {
  const groups = [];
  for (let i = 0; i < units.length; i += 4) {
    groups.push({ title: `Source Block ${groups.length + 1}`, items: units.slice(i, i + 4), kind: 'body' });
  }
  return groups;
}

function makeSemanticSlide(section, index) {
  const role = chooseRole(section.title, index, section.kind);
  const table = tableForSection(section, role);
  return {
    number: 0,
    role,
    message: messageForSection(section),
    required: selectSemanticItems(section, role),
    table,
    evidence: section.title || `Source unit group ${index + 1}`,
    caveat: caveatForRole(role, section.kind),
    visual: visualForRole(role)
  };
}

function addSyntheticSlide(slides, source, pattern, config, budget) {
  if (slides.length >= budget) return;
  const items = findItems(source, pattern);
  if (!items.length) return;
  slides.push({
    number: slides.length + 1,
    ...config,
    required: selectRepresentativeItems(items, 4, 850)
  });
}

function selectSemanticItems(section, role) {
  const items = dedupeItems(section.items || []);
  const maxItems = /evidence|risk|table|matrix/.test(role) ? 6 : 4;
  const maxChars = /evidence|risk|method/.test(role) ? 1050 : 850;
  const selected = selectRepresentativeItems(items, maxItems, maxChars);
  return selected.length ? selected : ['Preserve the section meaning and mark any missing evidence before building.'];
}

function selectRepresentativeItems(items, maxItems, maxChars) {
  const selected = [];
  let chars = 0;
  for (const item of items) {
    const clean = normalizeSourceLine(item);
    if (!clean || isLowSignalItem(clean)) continue;
    const compact = compactItem(clean);
    const nextChars = chars + compact.length;
    if (selected.length && (selected.length >= maxItems || nextChars > maxChars)) break;
    selected.push(compact);
    chars = nextChars;
  }
  return selected;
}

function dedupeItems(items) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const clean = normalizeSourceLine(item);
    const key = clean.toLowerCase().replace(/\s+/g, ' ').slice(0, 180);
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    deduped.push(clean);
  }
  return deduped;
}

function compactItem(item) {
  const clean = normalizeSourceLine(item);
  if (clean.length <= 260) return clean;
  const sentences = splitSentences(clean);
  if (sentences.length > 1 && sentences[0].length <= 260) return sentences[0];
  return `${clean.slice(0, 257).trim()}...`;
}

function sourceMapNote(section) {
  if (section.kind === 'source-reference') return 'Keep verbatim material in the source/report; use only if the user asks for a reference appendix.';
  if (section.kind === 'low-signal') return 'Workspace metadata or structural text; do not spend slide body space unless needed for provenance.';
  if ((section.items || []).length > 4) return 'Condense repeated detail into the slide proof object; keep exact wording in the source file.';
  return 'Represent directly in the slide narrative or proof object.';
}

function chooseRole(title, index, kind = '') {
  const lower = title.toLowerCase();
  if (kind === 'summary') return 'executive summary';
  if (kind === 'evidence-boundary') return 'method/provenance';
  if (kind === 'risk') return 'risk register';
  if (kind === 'recommendation') return 'recommendation stack';
  if (kind === 'finding') return 'fact card grid';
  if (kind === 'analysis') return 'interpretation stack';
  if (/timeline|history|roadmap|next|action|research needed|추가|다음/.test(lower)) return 'roadmap';
  if (/evidence|gap|risk|claim|근거|공백|리스크|주장/.test(lower)) return index % 2 ? 'risk register' : 'evidence matrix';
  if (/fact|finding|사실|확인/.test(lower)) return 'fact card grid';
  if (/recommend|추천|제안/.test(lower)) return 'recommendation stack';
  if (/method|source|appendix|출처|부록/.test(lower)) return 'method/provenance';
  if (/why|matter|문제|필요/.test(lower)) return 'pillar grid';
  if (/workflow|process|flow|구조|architecture/.test(lower)) return 'process flow';
  const roles = ['claim spine', 'comparison matrix', 'process flow', 'evidence table', 'interpretation stack', 'recommendation stack'];
  return roles[index % roles.length];
}

function messageForSection(section) {
  const title = section.title || '';
  const lower = title.toLowerCase();
  if (/evidence map|claim.*evidence|근거.*지도/.test(lower)) return `${title}: separate supported claims from validation gaps.`;
  if (/remaining gap|evidence gap|gaps checked|gaps filled|근거.*공백|확인.*필요/.test(lower)) return `${title}: turn evidence gaps into explicit validation work.`;
  if (/risk register|risk|리스크/.test(lower)) return `${title}: make launch risks visible before decisions are made.`;
  if (/recommend|next action|추천|제안|다음/.test(lower)) return `${title}: convert the source into prioritized next actions.`;
  if (/executive|summary|overview|개요/.test(lower)) return `${title}: state the decision-ready takeaway first.`;
  const first = section.items?.find((item) => item && !/^[-|]+$/.test(item) && !/^\s*\|/.test(item));
  if (!section.title) return 'Make this source block decision-ready.';
  if (!first) return `${section.title}: preserve the section logic and state the evidence boundary.`;
  return `${section.title}: ${shortClaim(first)}`;
}

function shortClaim(text) {
  const clean = normalizeSourceLine(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= 150) return clean;
  const sentence = splitSentences(clean)[0] || clean;
  return sentence.length <= 150 ? sentence : `${sentence.slice(0, 147).trim()}...`;
}

function caveatForRole(role, kind = '') {
  if (kind === 'source-reference') return 'Reference-only material; do not paste verbatim into the main deck by default.';
  if (/evidence|risk|method|appendix/.test(role)) return 'Preserve source wording and uncertainty labels.';
  if (/recommendation|roadmap/.test(role)) return 'Separate confirmed source content from proposed next actions.';
  return 'Preserve meaning and logic without pasting every sentence.';
}

function visualForRole(role) {
  const map = {
    'claim spine': 'Large claim with proof rail and caveat badge',
    'comparison matrix': 'Editable two-by-two or before/after matrix',
    'process flow': 'Editable horizontal flow using shapes and connectors',
    'evidence table': 'Editable table with source/status columns',
    'evidence matrix': 'Editable matrix with confidence/status badges',
    'fact card grid': 'Card grid with source chips',
    'interpretation stack': 'Stacked reasoning cards',
    'recommendation stack': 'Prioritized recommendation cards',
    'risk register': 'Risk table with mitigation/proof-needed column',
    roadmap: 'Grouped roadmap lanes with all actions preserved',
    'method/provenance': 'Method cards, source chips, and limitation badges',
    'pillar grid': 'Four-pillar grid with short evidence notes',
    'appendix/reference': 'Dense but editable reference layout'
  };
  return map[role] || 'Purposeful editable layout based on the source';
}

function findItems(source, pattern) {
  return extractContentUnits(source).filter((unit) => pattern.test(unit));
}

function firstUsefulLine(source) {
  return mdEscape(source).split('\n').map((line) => stripMarkdown(line).trim()).find((line) => line.length > 12);
}

function normalizeSourceLine(line) {
  const tableCells = parseMarkdownTableCells(line);
  if (tableCells && !isMarkdownSeparatorCells(tableCells)) return tableCells.join(' / ').replace(/\s+/g, ' ').trim();
  return stripMarkdown(line)
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*\d+[.)]\s+/, '')
    .replace(/\s*\|\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLowSignalItem(item) {
  if (!item) return true;
  if (/^[-|: ]+$/.test(item)) return true;
  if (/^converted at:/i.test(item)) return true;
  if (/^source file:/i.test(item) && item.length > 120) return true;
  if (/^\/Users\//.test(item)) return true;
  if (/[:：]$/.test(item) && item.length < 80) return true;
  return false;
}

function isReferenceHeading(title) {
  return /(source-preserved appendix|appendix|부록|전문|converted source|converted file|visible text|source metadata|sample source|conversion limitations|rendered pages|agent-readable reconstruction)/i.test(title);
}

function sectionKind(title) {
  const lower = title.toLowerCase();
  if (isReferenceHeading(title)) return 'source-reference';
  if (/작성 기준|method|scope|source|evidence notes|evidence gap|remaining gap|uncertain|불확실|근거|출처|checked|gaps filled|gaps checked/.test(lower)) return 'evidence-boundary';
  if (/executive|summary|key message|short answer|overview|한눈|개요/.test(lower)) return 'summary';
  if (/recommend|next action|실전|시사점|추천|제안|다음/.test(lower)) return 'recommendation';
  if (/fact|finding|사실|확인|key facts/.test(lower)) return 'finding';
  if (/interpretation|analysis|해석|insight|knowledge|data|information/.test(lower)) return 'analysis';
  if (/assumption|가정|risk|gap|공백|리스크|insufficient/.test(lower)) return 'risk';
  return 'body';
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function renderContentSpec(title, filePath, outline) {
  return `# PPT Content Spec

## Project

- Title: ${title}
- Source material: \`${filePath}\`
- Desired slide count: ${outline.slides.length}
- Selected reference set: ${outline.referenceSet.name}
- Reference board: \`${outline.referenceSet.board}\`
- Why this reference set fits: ${outline.referenceSet.reason}
- Content fidelity rule: preserve the source's claims, logic, evidence, caveats, and decisions without pasting every sentence verbatim.
- Slide text rule: include only audience-facing semantic content; keep repeated detail, logs, long paths, and source transcripts in the source map/reference layer.
- Source coverage: ${outline.unitCount} detected content units across ${outline.sectionCount} sections; ${outline.referenceSectionCount} section(s) treated as reference-only.
- PPTX creation: not performed in this step.

## Source-Fidelity Strategy

| Layer | What belongs here | Treatment |
|---|---|---|
| Slide body | Audience-facing argument, decisive evidence, key examples, essential caveats | Represent with designed proof objects, not raw paragraphs |
| Speaker notes | Presenter context, supporting details, nuance that would overcrowd slides | Preserve as notes during editable reconstruction when useful |
| Appendix/source map | Audit trail, dense tables, source-heavy detail, long supporting lists | Keep mapped and editable; add appendix only when audience needs it |
| Omit or compress | Repetition, logs, local paths, conversion metadata, low-signal wording | Exclude from slide body unless the user explicitly asks |

## Core Narrative

- Main question: What should this deck help the audience understand or decide?
- Main answer: To be finalized from source material before building slides.
- Narrative arc: opening thesis -> evidence -> implications -> recommendations -> source map/reference layer.

## Slide Outline

| Slide | Role | Key message | Required content | Evidence/source | Caveat | Visual need |
|---:|---|---|---|---|---|---|
${outline.slides.map((slide) => `| ${slide.number} | ${slide.role} | ${escapeTable(slide.message)} | ${escapeTable(renderInlineList(slide.required))} | ${escapeTable(slide.evidence)} | ${escapeTable(slide.caveat)} | ${escapeTable(slide.visual)} |`).join('\n')}

## Source Map

This map prevents silent content loss without forcing every original sentence into the deck body.

| Source section | Treatment | Slide(s) | Note |
|---|---|---|---|
${outline.sourceMap.map((entry) => `| ${escapeTable(entry.section)} | ${escapeTable(entry.treatment)} | ${escapeTable(entry.slides)} | ${escapeTable(entry.note)} |`).join('\n')}

## Gaps

- Information to verify: identify claims that require current or external evidence before final deck production.
- Content not to remove without approval: the claim/evidence/caveat/decision represented by each source-map row.
- Text that does not need to appear verbatim: repeated phrasing, long local paths, tool logs, conversion metadata, and source transcripts unless the user explicitly asks for appendix-heavy slides.
- User decision needed: audience, tone, appendix policy, and whether absolute/local paths should be anonymized before public sharing.
`;
}

function renderDesignSpec(title, outline) {
  return `# PPT Design Spec

## Direction

- Deck title: ${title}
- Tone: editorial, source-grounded, and visually structured.
- Visual density: medium for main narrative slides; controlled high density for appendix/reference slides.
- Selected reference set: ${outline.referenceSet.name}
- Reference board image: \`${outline.referenceSet.board}\`
- Reference translation notes: ${outline.referenceSet.translation}
- Full-slide screenshots: not allowed.

## Design System

- Slide size: 16:9 widescreen.
- Prototype coordinate system: 1920x1080 px.
- PPT reconstruction size: 13.333 x 7.5 in.
- Palette: warm paper background, dark text, semantic status colors for verified/gap/risk/technical items.
- Typography: system sans for editability.
- Grid: 12-column layout with consistent title and footer rails.
- Components: source chips, status badges, editable tables, process lanes, card stacks, matrices, and appendix reference blocks.

## Slide Design Outline

| Slide | Layout role | Visual structure | Main component | Editable PPT elements | Image assets | Design risk |
|---:|---|---|---|---|---|---|
${outline.slides.map((slide) => `| ${slide.number} | ${slide.role} | ${escapeTable(slide.visual)} | ${escapeTable(mainComponent(slide.role))} | Text boxes, shapes, tables/connectors where needed | None by default | ${escapeTable(designRisk(slide.role))} |`).join('\n')}

## Prototype Notes

- HTML/prototype path: \`projects/<project-slug>/presentations/<run-id>/prototype/index.html\`
- Preview PNG path: \`projects/<project-slug>/presentations/<run-id>/preview/\`
- Contact sheet path: \`projects/<project-slug>/qa/<run-id>/contact-sheet.png\`
- Sample slides to validate first: cover/opening, most complex evidence/table slide, recommendation/next-action slide.

## Design QA Rules

- No full-slide screenshot backgrounds.
- Main narrative slides must not be plain text dumps.
- Each slide needs one key message and one dominant proof object.
- Tables, cards, diagrams, badges, and process flows must remain editable where possible.
- Text must wrap inside containers without overflow.
`;
}

function renderBuildPlan(title, filePath, outline, contentSpecPath, designSpecPath, plannedPptxPath) {
  return `# PPT Build Plan

## Project

- Title: ${title}
- Source: \`${filePath}\`
- Content spec: \`${contentSpecPath}\`
- Design spec: \`${designSpecPath}\`
- Planned output PPTX: \`${plannedPptxPath}\`
- Mode: premium workflow. The plan is always written first; a full run then creates the HTML prototype, editable PPTX, and package/text QA. With \`--plan-only\`, execution stops at this planning stage.
- Reference set: ${outline.referenceSet.name} (\`${outline.referenceSet.board}\`)
- Source-fidelity strategy: slide body for audience-facing argument, notes for presenter detail, appendix/source map for audit trail, omit/compress low-signal repetition.

## Build Strategy

- Create an HTML/CSS prototype before PPTX production.
- If a local renderer is available, render PNG previews and a contact sheet for visual QA.
- Use previews as the visual reference only; never paste them as full-slide PPT images.
- Reconstruct final PPTX with editable text boxes, shapes, tables, charts, and diagrams.
- Do not insert full-slide screenshots into the final PPTX.
- Translate the selected reference board into editable components; do not paste the board as a final slide image.

## Sample Slide Gate

Build and verify these before the full deck:

| Sample | Reason | Pass criteria |
|---|---|---|
| Cover/opening | Tests tone, grid, and title hierarchy | All text editable, no overflow, strong first impression |
| Most complex evidence/table slide | Tests density and source preservation | All rows/content present, editable, readable |
| Recommendation/next-action slide | Tests decision clarity | Clear hierarchy, all actions preserved |

## Slide Implementation Plan

| Slide | Message | Layout | Components | Editable elements | Prototype status | QA notes |
|---:|---|---|---|---|---|---|
${outline.slides.map((slide) => `| ${slide.number} | ${escapeTable(slide.message)} | ${slide.role} | ${escapeTable(mainComponent(slide.role))} | Text, shapes, tables/connectors as needed | Planned | ${escapeTable(slide.caveat)} |`).join('\n')}

## QA Plan

- Package QA: validate PPTX structure when final deck is built.
- Render QA: inspect preview PNGs and contact sheet when a renderer is available; otherwise record the render limitation.
- Editability QA: confirm text, shapes, diagrams, and tables are editable where possible.
- Content fidelity QA: cross-check source-map rows against the content spec; verify logic/evidence/caveats survive even when wording is condensed.
- Visual QA: no plain text dump in the main narrative.

## Deliverables

- Content spec: \`${contentSpecPath}\`
- Design spec: \`${designSpecPath}\`
- Build plan: this file
- HTML/prototype: created by the full \`ppt\` workflow; planned only in \`--plan-only\` mode
- Rendered previews: created when a renderer is available; otherwise the QA report must state the limitation
- PPTX: created by the full \`ppt\` workflow; planned only in \`--plan-only\` mode
`;
}

function renderPlanQa(title, outline) {
  return `# PPT Plan QA

## Scope

- Title: ${title}
- Mode: premium planning stage
- Scope: validates content/design/build planning before editable PPTX reconstruction
- Low-quality text-only deck generation: not allowed
- Fidelity mode: semantic/content fidelity, not verbatim completeness

## Checks

- [x] Content spec maps source sections to slide roles or source-map treatment.
- [x] Design spec assigns visual layout roles.
- [x] Build plan requires prototype/render QA before final PPTX.
- [x] Final PPTX is gated on editable reconstruction.
- [x] Main narrative text-only dumps are prohibited.
- [x] Source transcripts and logs are not forced into slide bodies by default.
- [x] A design reference set is selected and translated into editable PPT guidance.
- [x] Source-fidelity strategy is explicit: slide body, speaker notes, appendix/source map, and omissions are separated.

## Planned Slide Count

${outline.slides.length}

## Remaining Work

- In full \`ppt\` mode: build the HTML prototype, reconstruct the editable PPTX, and run package/text QA.
- If a renderer is available: add render/contact-sheet QA.
- If running \`--plan-only\`: stop here and wait for approval or a follow-up build request.
`;
}

function mainComponent(role) {
  if (/table|matrix/.test(role)) return 'Editable table/matrix';
  if (/flow|roadmap|ladder|architecture/.test(role)) return 'Editable diagram';
  if (/risk|recommendation|fact|pillar|stack|card/.test(role)) return 'Editable cards';
  if (/appendix|reference|method/.test(role)) return 'Editable reference layout';
  return 'Editable title, proof object, and source notes';
}

function designRisk(role) {
  if (/table|matrix|appendix|reference/.test(role)) return 'Dense content may overflow; needs render QA.';
  if (/flow|roadmap|diagram|architecture/.test(role)) return 'Connectors and labels must remain aligned.';
  return 'Must avoid becoming a plain text-only slide.';
}

function renderInlineList(items) {
  return (items || []).filter(Boolean).join('<br>');
}

function escapeTable(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function titleFromFile(path) {
  return basename(path).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
}

function buildEditableDeck(title, outline) {
  return {
    title,
    slides: outline.slides.map((slide, index) => buildEditableSlide(slide, outline, index))
  };
}

function buildEditableSlide(slide, outline, index) {
  if (index === 0) return buildCoverSlide(slide, outline);
  if (slide.role === 'appendix/reference') return buildSourceMapSlide(slide, outline);
  if (slide.table) return buildTableSlide(slide, index);
  if (/risk|evidence|method/.test(slide.role)) return buildEvidenceSlide(slide, index);
  if (/roadmap|recommendation/.test(slide.role)) return buildRoadmapSlide(slide, index);
  return buildStandardSlide(slide, index);
}

function baseItems(slide, index) {
  const role = slide.role.replace(/\//g, ' / ');
  return [
    t(role.toUpperCase(), 0.67, 0.58, 3.4, 0.22, { fontSize: 8.5, bold: true, color: '6D28D9' }),
    t(shortClaim(slide.message), 0.67, 0.90, 8.6, 0.72, { fontSize: 22, bold: true }),
    t(slide.evidence || 'Source-backed slide', 0.67, 6.90, 4.6, 0.22, { fontSize: 7.5, color: '4B5563' }),
    chip(`Slide ${index + 1}`, 11.68, 0.60, 0.92, { fill: 'EEE8FF', line: 'B9A1F8', color: '6D28D9' })
  ];
}

function buildCoverSlide(slide, outline) {
  const items = [
    t('PREMIUM EDITABLE DECK', 0.67, 0.78, 3.6, 0.22, { fontSize: 9, bold: true, color: '6D28D9' }),
    t(shortTitle(slide.message), 0.67, 1.16, 7.3, 0.62, { fontSize: 31, bold: true }),
    t('Generated by ppt-builder using plan -> prototype -> editable reconstruction workflow.', 0.67, 1.92, 7.2, 0.28, { fontSize: 11.5, bold: true, color: '4B5563' }),
    card(0.67, 2.55, 5.9, 1.56),
    t('Content fidelity, not text dumping', 0.96, 2.82, 5.1, 0.32, { fontSize: 17, bold: true }),
    t('The deck preserves claims, logic, evidence, caveats, and decisions while keeping source-heavy detail traceable in the source map.', 0.96, 3.28, 4.95, 0.45, { fontSize: 10.5, color: '4B5563' }),
    chip('semantic fidelity', 0.96, 4.00, 1.35, { fill: 'E8F4ED', line: '9BC9AF', color: '2F855A' }),
    chip('editable PPTX', 2.43, 4.00, 1.12, { fill: 'EFF6FF', line: '9BBEFF', color: '2563EB' }),
    chip('source map', 3.68, 4.00, 0.96, { fill: 'EEE8FF', line: 'B9A1F8', color: '6D28D9' }),
    chip('QA gated', 4.78, 4.00, 0.86, { fill: 'FBEFD7', line: 'D7A94E', color: 'B7791F' })
  ];

  const stats = [
    ['slides', String(outline.slides.length)],
    ['source units', String(outline.unitCount)],
    ['reference sections', String(outline.referenceSectionCount)]
  ];
  stats.forEach(([label, value], i) => {
    const x = 8.35 + (i % 2) * 2.1;
    const y = 2.25 + Math.floor(i / 2) * 1.1;
    card(x, y, 1.82, 0.88, { fill: i === 0 ? 'EFF6FF' : 'FFFDF7' }, items);
    items.push(t(value, x + 0.18, y + 0.18, 1.2, 0.25, { fontSize: 18, bold: true, color: i === 0 ? '2563EB' : '111827' }));
    items.push(t(label, x + 0.18, y + 0.52, 1.4, 0.16, { fontSize: 8.0, color: '4B5563', bold: true }));
  });

  return { background: 'F7F4EC', notes: `Source map rows: ${outline.sourceMap.length}. PPTX rebuilt with editable text and shapes.`, items };
}

function buildStandardSlide(slide, index) {
  const items = baseItems(slide, index);
  const required = (slide.required || []).slice(0, 5);
  required.forEach((item, i) => {
    const x = i % 2 === 0 ? 0.82 : 6.92;
    const y = 2.35 + Math.floor(i / 2) * 1.15;
    card(x, y, 5.35, 0.92, {}, items);
    items.push(t(compactItem(item), x + 0.22, y + 0.18, 4.8, 0.34, { fontSize: 10.3, bold: i === 0 }));
    items.push(chip(i === 0 ? 'claim' : 'support', x + 0.22, y + 0.58, 0.76, { fill: i === 0 ? 'EFF6FF' : 'FFFDF7', line: i === 0 ? '9BBEFF' : 'DED7C8', color: i === 0 ? '2563EB' : '4B5563' }));
  });
  addCaveat(items, slide.caveat);
  return { background: 'F7F4EC', notes: sourceNote(slide), items };
}

function buildEvidenceSlide(slide, index) {
  const items = baseItems(slide, index);
  items.push(card(0.72, 2.16, 5.95, 3.85, { fill: 'FFFDF7' }));
  items.push(card(6.92, 2.16, 5.75, 3.85, { fill: 'FFFDF7' }));
  items.push(t('Supported', 0.98, 2.46, 2.0, 0.24, { fontSize: 15, bold: true, color: '2F855A' }));
  items.push(t('Needs care', 7.18, 2.46, 2.0, 0.24, { fontSize: 15, bold: true, color: 'C2410C' }));
  const required = slide.required || [];
  const left = required.slice(0, Math.ceil(required.length / 2));
  const right = required.slice(Math.ceil(required.length / 2));
  renderRows(items, left, 0.98, 3.02, 5.34, '2F855A', 'E8F4ED');
  renderRows(items, right.length ? right : [slide.caveat], 7.18, 3.02, 5.18, 'C2410C', 'FBE9DF');
  addCaveat(items, slide.caveat);
  return { background: 'F7F4EC', notes: sourceNote(slide), items };
}

function buildTableSlide(slide, index) {
  const items = baseItems(slide, index);
  const tableRows = [slide.table.headers, ...slide.table.rows];
  items.push({
    type: 'table',
    rows: tableRows,
    colWidths: slide.table.colWidths,
    x: 0.72,
    y: 2.06,
    w: 11.95,
    h: Math.min(4.52, 0.54 + tableRows.length * 0.52),
    headerFill: 'EEE8FF',
    bandFill: 'FFFDF7',
    line: 'DED7C8',
    fontSize: tableRows.length > 6 ? 6.6 : 7.2
  });
  const tableNote = slide.table.truncatedCount
    ? `${slide.table.truncatedCount} additional row(s) stay in the source/report reference layer.`
    : 'All detected table rows for this slide are represented in editable table cells.';
  items.push(shape(0.72, 6.02, 11.95, 0.30, { fill: 'FFFFFF', line: 'DED7C8' }));
  items.push(t(tableNote, 0.92, 6.10, 11.2, 0.10, { fontSize: 6.9, color: '4B5563', bold: true }));
  addCaveat(items, slide.caveat);
  return { background: 'F7F4EC', notes: `${sourceNote(slide)} Native table rows: ${tableRows.length}. ${tableNote}`, items };
}

function buildRoadmapSlide(slide, index) {
  const items = baseItems(slide, index);
  const lanes = ['Now', 'Next', 'Validate'];
  lanes.forEach((lane, i) => {
    const x = 0.72 + i * 4.05;
    card(x, 2.18, 3.65, 3.95, { fill: i === 0 ? 'EFF6FF' : 'FFFDF7' }, items);
    items.push(t(lane, x + 0.24, 2.48, 2.0, 0.25, { fontSize: 15.5, bold: true, color: i === 0 ? '2563EB' : '111827' }));
  });
  (slide.required || []).slice(0, 9).forEach((item, i) => {
    const lane = i % 3;
    const x = 0.98 + lane * 4.05;
    const y = 3.02 + Math.floor(i / 3) * 0.82;
    items.push(card(x, y, 3.12, 0.58, { fill: 'FFFFFF' }));
    items.push(t(compactItem(item), x + 0.16, y + 0.13, 2.76, 0.22, { fontSize: 8.5, bold: true }));
  });
  addCaveat(items, slide.caveat);
  return { background: 'F7F4EC', notes: sourceNote(slide), items };
}

function buildSourceMapSlide(slide, outline) {
  const items = baseItems(slide, outline.slides.length - 1);
  const rows = outline.sourceMap.slice(0, 9);
  items.push(card(0.72, 2.04, 11.95, 4.42));
  items.push(t('Source section', 0.96, 2.34, 2.5, 0.16, { fontSize: 8.2, bold: true, color: '6D28D9' }));
  items.push(t('Treatment', 4.08, 2.34, 2.0, 0.16, { fontSize: 8.2, bold: true, color: '6D28D9' }));
  items.push(t('Note', 6.55, 2.34, 4.5, 0.16, { fontSize: 8.2, bold: true, color: '6D28D9' }));
  rows.forEach((row, i) => {
    const y = 2.72 + i * 0.38;
    items.push(shape(0.92, y, 11.52, 0.30, { fill: i % 2 ? 'FFFDF7' : 'FFFFFF', line: 'DED7C8', shape: 'rect' }));
    items.push(t(row.section, 1.02, y + 0.07, 2.64, 0.12, { fontSize: 6.9, bold: true }));
    items.push(t(row.treatment, 4.08, y + 0.07, 2.0, 0.12, { fontSize: 6.8, color: row.treatment === 'narrative slide' ? '2F855A' : '6D28D9', bold: true }));
    items.push(t(row.note, 6.55, y + 0.07, 5.5, 0.12, { fontSize: 6.6, color: '4B5563' }));
  });
  addCaveat(items, 'Full source text remains in the source/report; this slide preserves traceability without bloating the deck body.');
  return { background: 'F7F4EC', notes: `Source map contains ${outline.sourceMap.length} rows.`, items };
}

function renderRows(items, rows, x, y, w, color, fill) {
  rows.slice(0, 5).forEach((row, i) => {
    const ry = y + i * 0.56;
    items.push(shape(x, ry, w, 0.42, { fill: 'FFFFFF', line: 'DED7C8' }));
    items.push(chip(i === 0 ? 'primary' : 'source', x + 0.12, ry + 0.09, 0.72, { fill, line: color, color, fontSize: 6.5, h: 0.22 }));
    items.push(t(compactItem(row), x + 0.96, ry + 0.10, w - 1.15, 0.16, { fontSize: 7.3, bold: i === 0 }));
  });
}

function addCaveat(items, caveat) {
  if (!caveat) return;
  items.push(shape(0.72, 6.34, 11.95, 0.42, { fill: 'FBEFD7', line: 'D7A94E' }));
  items.push(t(caveat, 0.92, 6.45, 11.4, 0.12, { fontSize: 7.8, bold: true, color: '6F4707' }));
}

function t(text, x, y, w, h, opts = {}) {
  return { type: 'text', text, x, y, w, h, ...opts };
}

function shape(x, y, w, h, opts = {}) {
  return { type: 'shape', x, y, w, h, ...opts };
}

function card(x, y, w, h, opts = {}, list) {
  const item = shape(x, y, w, h, { fill: opts.fill || 'FFFDF7', line: opts.line || 'DED7C8', shape: opts.shape || 'roundRect' });
  if (list) list.push(item);
  return item;
}

function chip(textValue, x, y, w, opts = {}) {
  return { type: 'text', text: textValue, x, y, w, h: opts.h || 0.24, fill: opts.fill || 'FFFDF7', line: opts.line || 'DED7C8', color: opts.color || '111827', fontSize: opts.fontSize || 7.2, bold: true, align: 'ctr', valign: 'ctr', padX: 0.03, padY: 0.02 };
}

function sourceNote(slide) {
  return `Evidence/source: ${slide.evidence}. Caveat: ${slide.caveat}. Source-heavy detail remains in the source map/reference layer.`;
}

function shortTitle(value) {
  return String(value || '').split(':')[0] || 'Untitled Deck';
}

function renderHtmlPrototype(title, outline) {
  const slides = outline.slides.map((slide, index) => {
    const items = slide.table ? renderPrototypeTable(slide.table) : (slide.required || []).slice(0, 5).map((item) => `<div class="card" data-ppt-type="card"><strong>${html(compactItem(item))}</strong></div>`).join('');
    const contentClass = slide.table ? 'table-wrap' : 'grid';
    const contentType = slide.table ? 'editable-table' : 'card-grid';
    return `<section class="slide" id="slide-${index + 1}" data-ppt-type="slide">
      <div class="kicker" data-ppt-type="text">${html(slide.role)}</div>
      <h1 data-ppt-type="title">${html(shortClaim(slide.message))}</h1>
      <p class="evidence" data-ppt-type="text">${html(slide.evidence)}</p>
      <div class="${contentClass}" data-ppt-type="${contentType}">${items}</div>
      <div class="caveat" data-ppt-type="badge">${html(slide.caveat)}</div>
    </section>`;
  }).join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${html(title)}</title><style>
body{margin:0;background:#f7f4ec;font-family:Arial,Helvetica,sans-serif;color:#111827}
.deck{display:flex;flex-direction:column;gap:32px;padding:32px}
.slide{position:relative;width:1920px;height:1080px;background:#f7f4ec;box-sizing:border-box;padding:96px 112px;border:1px solid #ded7c8;overflow:hidden}
.slide:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(222,215,200,.28) 1px,transparent 1px),linear-gradient(rgba(222,215,200,.22) 1px,transparent 1px);background-size:144px 100%,100% 96px;pointer-events:none}
.kicker{position:relative;color:#6d28d9;text-transform:uppercase;font-size:18px;font-weight:700;margin-bottom:20px}
h1{position:relative;font-size:54px;line-height:1.02;max-width:1180px;margin:0 0 24px}
.evidence{position:relative;font-size:22px;color:#4b5563;font-weight:700;max-width:980px}
.grid{position:relative;display:grid;grid-template-columns:repeat(2,1fr);gap:22px;margin-top:56px;max-width:1420px}
.card{background:#fffdf7;border:1px solid #ded7c8;border-radius:18px;padding:24px;font-size:23px;line-height:1.25;box-shadow:0 16px 28px rgba(17,24,39,.08)}
.table-wrap{position:relative;margin-top:42px;max-width:1560px}
table{width:100%;border-collapse:collapse;background:#fffdf7;border:1px solid #ded7c8;font-size:19px;line-height:1.2;box-shadow:0 16px 28px rgba(17,24,39,.08)}
th{background:#eee8ff;color:#4c1d95;text-align:left;font-size:17px;text-transform:uppercase;letter-spacing:.02em}
td,th{border:1px solid #ded7c8;padding:16px 18px;vertical-align:top}
tr:nth-child(even) td{background:#ffffff}
.caveat{position:absolute;left:112px;right:112px;bottom:72px;background:#fbefd7;border:1px solid #d7a94e;border-radius:14px;padding:14px 20px;color:#6f4707;font-size:18px;font-weight:700}
</style></head><body><main class="deck">${slides}</main></body></html>`;
}

function renderPrototypeTable(table) {
  const headers = `<tr>${table.headers.map((header) => `<th>${html(header)}</th>`).join('')}</tr>`;
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${html(cell)}</td>`).join('')}</tr>`).join('');
  return `<table>${headers}${rows}</table>`;
}

async function inspectPptxPackage(pptxPath, expectedSlideCount) {
  const buffer = await fs.readFile(pptxPath);
  const haystack = buffer.toString('utf8');
  const slideXmlPaths = [...new Set([...haystack.matchAll(/ppt\/slides\/slide\d+\.xml/g)].map((m) => m[0]))].sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const mediaFiles = [...new Set([...haystack.matchAll(/ppt\/media\/[^<\0\s"]+/g)].map((m) => m[0]))];
  const textFragments = [...haystack.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => unxml(m[1])).filter(Boolean);
  const imageReferenceCount = (haystack.match(/<a:blip|<p:pic/g) || []).length;
  const markdownLeakFragments = textFragments.filter(hasMarkdownTableLeak);
  const checks = {
    packageHasContentTypes: haystack.includes('[Content_Types].xml'),
    packageHasPresentationXml: haystack.includes('ppt/presentation.xml'),
    slideCountMatches: slideXmlPaths.length === expectedSlideCount,
    noMediaFiles: mediaFiles.length === 0,
    noImageReferencesInSlideXml: imageReferenceCount === 0,
    extractedTextPresent: textFragments.length > 0,
    noMarkdownTableLeakage: markdownLeakFragments.length === 0
  };
  return {
    slideXmlPaths,
    mediaFiles,
    textFragmentCount: textFragments.length,
    imageReferenceCount,
    markdownLeakCount: markdownLeakFragments.length,
    markdownLeakFragments: markdownLeakFragments.slice(0, 20),
    checks,
    extractedText: textFragments.join('\n'),
    rendererPreview: {
      attempted: false,
      reason: 'No built-in PPTX renderer is bundled. Open in PowerPoint, Keynote, or LibreOffice for final visual QA.'
    },
    verdict: Object.values(checks).every(Boolean) ? 'Pass' : 'Needs fixes'
  };
}

function renderWorkflowQa(title, pptxPath, prototypePath, extractedTextPath, packageQaPath, qa) {
  return `# PPT Builder Workflow QA

## Scope

- Title: ${title}
- PPTX: \`${pptxPath}\`
- HTML prototype: \`${prototypePath}\`
- Extracted text: \`${extractedTextPath}\`
- Package QA JSON: \`${packageQaPath}\`
- Verdict: ${qa.verdict}

## Checks

| Check | Result |
|---|---|
| PPTX package has [Content_Types].xml | ${qa.checks.packageHasContentTypes ? 'pass' : 'fail'} |
| PPTX package has ppt/presentation.xml | ${qa.checks.packageHasPresentationXml ? 'pass' : 'fail'} |
| Slide count matches plan | ${qa.checks.slideCountMatches ? 'pass' : 'fail'} |
| No ppt/media image assets | ${qa.checks.noMediaFiles ? 'pass' : 'fail'} |
| No image references in slide XML | ${qa.checks.noImageReferencesInSlideXml ? 'pass' : 'fail'} |
| Editable text extracted from slide XML | ${qa.checks.extractedTextPresent ? 'pass' : 'fail'} |
| No raw Markdown table syntax in slide text | ${qa.checks.noMarkdownTableLeakage ? 'pass' : 'fail'} |

## Evidence

- Slide XML count: ${qa.slideXmlPaths.length}
- Extracted text fragments: ${qa.textFragmentCount}
- Media files: ${qa.mediaFiles.length}
- Image references: ${qa.imageReferenceCount}
- Markdown table leakage fragments: ${qa.markdownLeakCount}

## Render Limitation

${qa.rendererPreview.reason}
`;
}

function hasMarkdownTableLeak(fragment) {
  const text = String(fragment || '').trim();
  if (!text) return false;
  if (/^\|.*\|$/.test(text)) return true;
  if (/\s\|\s/.test(text)) return true;
  if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(text)) return true;
  return false;
}

function html(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function unxml(value) {
  return String(value ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
