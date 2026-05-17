#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(toolDir, '../../../..');
const today = localDateStamp();

const aliases = {
  date: ['date', 'published_at', 'timestamp', 'post_date', 'created_at'],
  contentType: ['content_type', 'type', 'media_type', 'format', 'post_type'],
  topic: ['topic', 'pillar', 'content_pillar', 'theme', 'series'],
  caption: ['caption', 'copy', 'text', 'hook', 'title'],
  followers: ['followers', 'follower_count', 'audience_size'],
  followersGained: ['followers_gained', 'new_followers', 'follower_growth', 'gained_followers'],
  reach: ['reach', 'accounts_reached'],
  impressions: ['impressions', 'views_impressions'],
  likes: ['likes', 'like_count'],
  comments: ['comments', 'comment_count'],
  shares: ['shares', 'share_count', 'sends'],
  saves: ['saves', 'save_count'],
  profileVisits: ['profile_visits', 'profile_visits_count', 'profile_activity'],
  websiteTaps: ['website_taps', 'link_clicks', 'website_clicks'],
  plays: ['plays', 'views', 'reel_plays', 'video_views'],
  hour: ['hour', 'publish_hour'],
  weekday: ['weekday', 'day_of_week']
};

const numericFields = new Set([
  'followers',
  'followersGained',
  'reach',
  'impressions',
  'likes',
  'comments',
  'shares',
  'saves',
  'profileVisits',
  'websiteTaps',
  'plays',
  'hour'
]);

function usage() {
  return `Instagram Growth Analyst

Usage:
  node agents/work/instagram-growth-analyst/tools/analyze-instagram-growth.mjs --input <file> [--project <slug>] [--profile <name>] [--followers <n>] [--out <file>]

Notes:
  - Input and output paths must stay inside this workspace.
  - Supported input formats: CSV, TSV, JSON.
  - This tool does not access Instagram or the network.`;
}

function localDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    }
  }
  return args;
}

function assertInsideWorkspace(path, label) {
  const resolved = resolve(path);
  if (resolved !== workspaceRoot && !resolved.startsWith(`${workspaceRoot}/`)) {
    throw new Error(`${label} must be inside the Agent Computer workspace: ${resolved}`);
  }
  return resolved;
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function aliasMap() {
  const map = new Map();
  for (const [canonical, list] of Object.entries(aliases)) {
    for (const item of list) map.set(normalizeKey(item), canonical);
  }
  return map;
}

function safeSlug(input) {
  return String(input || 'instagram-growth-analysis')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'instagram-growth-analysis';
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
  if (!rows.length) return [];

  const [headers, ...dataRows] = rows;
  return dataRows.map((cells) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header.trim()] = cells[index] ?? '';
    });
    return item;
  });
}

async function readInput(inputPath) {
  const ext = extname(inputPath).toLowerCase();
  const text = await fs.readFile(inputPath, 'utf8');
  if (ext === '.json') {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.posts)) return parsed.posts;
    if (Array.isArray(parsed.data)) return parsed.data;
    throw new Error('JSON input must be an array, or an object with posts/data array.');
  }
  if (ext === '.tsv') return parseDelimited(text, '\t');
  return parseDelimited(text, ',');
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim().replace(/,/g, '').replace(/%$/, '');
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeRecords(rows, options) {
  const map = aliasMap();
  const fallbackFollowers = toNumber(options.followers);

  return rows.map((raw, index) => {
    const normalized = { raw, rowNumber: index + 2 };
    for (const [key, value] of Object.entries(raw)) {
      const canonical = map.get(normalizeKey(key));
      if (!canonical) continue;
      normalized[canonical] = numericFields.has(canonical) ? toNumber(value) : String(value || '').trim();
    }

    const date = parseDate(normalized.date);
    const weekday = normalized.weekday || (date ? date.toLocaleDateString('en-US', { weekday: 'short' }) : '');
    const hour = normalized.hour ?? (date ? date.getHours() : null);
    const followers = normalized.followers ?? fallbackFollowers;
    const likes = normalized.likes ?? 0;
    const comments = normalized.comments ?? 0;
    const shares = normalized.shares ?? 0;
    const saves = normalized.saves ?? 0;
    const engagement = likes + comments + shares + saves;
    const reach = normalized.reach ?? null;
    const impressions = normalized.impressions ?? null;

    return {
      ...normalized,
      dateObj: date,
      dateLabel: date ? localDateStamp(date) : (normalized.date || 'unknown'),
      contentType: normalized.contentType || 'unknown',
      topic: normalized.topic || 'unknown',
      caption: normalized.caption || '',
      followers,
      weekday,
      hour,
      likes,
      comments,
      shares,
      saves,
      reach,
      impressions,
      engagement,
      erReach: reach ? engagement / reach : null,
      erImpressions: impressions ? engagement / impressions : null,
      erFollowers: followers ? engagement / followers : null,
      saveRate: reach ? saves / reach : null,
      shareRate: reach ? shares / reach : null,
      commentRate: reach ? comments / reach : null,
      profileVisitRate: reach && normalized.profileVisits ? normalized.profileVisits / reach : null,
      score: likes + comments * 2 + shares * 3 + saves * 4 + (normalized.profileVisits ?? 0) * 2 + (normalized.websiteTaps ?? 0) * 3
    };
  });
}

function sum(records, field) {
  return records.reduce((total, record) => total + (record[field] ?? 0), 0);
}

function mean(values) {
  const present = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (!present.length) return null;
  return present.reduce((total, value) => total + value, 0) / present.length;
}

function median(values) {
  const present = values.filter((value) => typeof value === 'number' && Number.isFinite(value)).sort((a, b) => a - b);
  if (!present.length) return null;
  const middle = Math.floor(present.length / 2);
  return present.length % 2 ? present[middle] : (present[middle - 1] + present[middle]) / 2;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return Math.round(value).toLocaleString('en-US');
}

function formatDecimal(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return Number(value).toFixed(digits);
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return `${(value * 100).toFixed(1)}%`;
}

function md(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function truncate(value, max = 74) {
  const text = md(value || '');
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function groupBy(records, field) {
  const groups = new Map();
  for (const record of records) {
    const key = String(record[field] || 'unknown').trim() || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.entries()].map(([name, items]) => ({
    name,
    count: items.length,
    avgReach: mean(items.map((item) => item.reach)),
    avgEngagement: mean(items.map((item) => item.engagement)),
    avgErReach: mean(items.map((item) => item.erReach)),
    avgSaveRate: mean(items.map((item) => item.saveRate)),
    avgShareRate: mean(items.map((item) => item.shareRate)),
    avgScore: mean(items.map((item) => item.score))
  })).sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
}

function groupRows(groups, limit = 8) {
  if (!groups.length) return '| n/a | 0 | n/a | n/a | n/a | n/a |';
  return groups.slice(0, limit).map((group) => (
    `| ${md(group.name)} | ${group.count} | ${formatNumber(group.avgReach)} | ${formatPercent(group.avgErReach)} | ${formatPercent(group.avgSaveRate)} | ${formatPercent(group.avgShareRate)} |`
  )).join('\n');
}

function topPostRows(records) {
  return records
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((record, index) => (
      `| ${index + 1} | ${record.dateLabel} | ${md(record.contentType)} | ${md(record.topic)} | ${truncate(record.caption || '(no caption)')} | ${formatNumber(record.reach)} | ${formatNumber(record.engagement)} | ${formatPercent(record.erReach)} |`
    )).join('\n');
}

function dataQuality(records) {
  const fields = ['date', 'contentType', 'topic', 'caption', 'followers', 'reach', 'impressions', 'likes', 'comments', 'shares', 'saves'];
  return fields.map((field) => {
    const present = records.filter((record) => record[field] !== null && record[field] !== undefined && record[field] !== '').length;
    return { field, present, missing: records.length - present };
  });
}

function confidence(records) {
  const quality = dataQuality(records);
  const importantMissing = quality
    .filter((item) => ['date', 'reach', 'likes', 'comments', 'shares', 'saves'].includes(item.field))
    .reduce((total, item) => total + item.missing, 0);
  if (records.length >= 20 && importantMissing <= records.length) return 'medium-high';
  if (records.length >= 8 && importantMissing <= records.length * 2) return 'medium';
  return 'directional';
}

function sentenceList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- No strong pattern detected from the supplied data.';
}

function buildInsights(records, groupsByType, groupsByTopic) {
  const insights = [];
  const risks = [];
  const medianReach = median(records.map((record) => record.reach));
  const medianEr = median(records.map((record) => record.erReach));
  const bestType = groupsByType.find((group) => group.count >= 2) || groupsByType[0];
  const bestTopic = groupsByTopic.find((group) => group.count >= 2) || groupsByTopic[0];
  const bestSaveTopic = groupsByTopic.slice().sort((a, b) => (b.avgSaveRate ?? 0) - (a.avgSaveRate ?? 0))[0];
  const underDistributed = records.filter((record) => (
    medianReach && medianEr && record.reach && record.reach < medianReach && record.erReach && record.erReach > medianEr * 1.25
  ));
  const broadButShallow = records.filter((record) => (
    medianReach && medianEr && record.reach && record.reach > medianReach * 1.25 && record.erReach && record.erReach < medianEr * 0.75
  ));

  if (bestType) {
    insights.push(`Best format signal: ${bestType.name} has the strongest weighted performance among available content types (${bestType.count} posts, avg ER by reach ${formatPercent(bestType.avgErReach)}).`);
  }
  if (bestTopic) {
    insights.push(`Best topic signal: ${bestTopic.name} is the clearest topic candidate to repeat or expand (${bestTopic.count} posts, avg reach ${formatNumber(bestTopic.avgReach)}).`);
  }
  if (bestSaveTopic && bestSaveTopic.avgSaveRate) {
    insights.push(`Save-worthy material appears strongest around ${bestSaveTopic.name} (avg save rate ${formatPercent(bestSaveTopic.avgSaveRate)}), which is useful for educational or reference content.`);
  }
  if (underDistributed.length) {
    insights.push(`${underDistributed.length} post(s) had above-median resonance with below-median reach. Repackage those ideas with stronger opening frames, collaboration, or distribution support.`);
  }

  if (records.length < 8) risks.push('Sample size is small, so treat patterns as hypotheses rather than settled strategy.');
  if (!records.some((record) => record.reach)) risks.push('Reach is missing, so the report cannot separate distribution problems from content resonance.');
  if (!records.some((record) => record.followers)) risks.push('Follower counts are missing, so follower-normalized engagement rates are unavailable.');
  if (broadButShallow.length) risks.push(`${broadButShallow.length} high-reach post(s) had weak engagement rate. Check whether the hook attracted broad but poorly matched attention.`);

  return { insights, risks };
}

function experimentRows(groupsByType, groupsByTopic, records) {
  const bestType = groupsByType[0]?.name || 'best-performing format';
  const bestTopic = groupsByTopic[0]?.name || 'best-performing topic';
  const top = records.slice().sort((a, b) => b.score - a.score)[0];
  const topIdea = top?.caption ? truncate(top.caption, 44) : bestTopic;
  const rows = [
    ['Repeatable winner sprint', `If ${bestTopic} is genuinely resonating, repeating it in ${bestType} should lift saves and shares.`, `Publish 3 variations of "${topIdea}" with different hooks and the same core promise.`, 'Avg saves/reach and shares/reach beat current median.', '14 days'],
    ['Distribution rescue', 'High-resonance ideas with limited reach may need stronger packaging, timing, or collaboration.', 'Take the best below-median reach post and remake it with a sharper first line, clearer visual payoff, and one collaboration or cross-promotion path.', 'Reach improves while ER by reach stays above median.', '7 to 14 days'],
    ['Conversion bridge', 'Posts that earn profile visits or website taps can be turned into clearer next-step content.', 'Add one soft CTA pattern to top-topic posts: profile promise, comment prompt, or saveable checklist.', 'Profile visits/reach or website taps/reach improves without lowering saves.', '14 days']
  ];
  return rows.map((row) => `| ${row.map(md).join(' | ')} |`).join('\n');
}

function actionPlanRows(groupsByType, groupsByTopic) {
  const bestType = groupsByType[0]?.name || 'top format';
  const bestTopic = groupsByTopic[0]?.name || 'top topic';
  const rows = [
    [1, `Select 3 proven ${bestTopic} ideas from the top-post table.`, 'Keep the original audience promise intact.'],
    [2, `Draft 3 hooks for each idea and map each to ${bestType} or the closest available format.`, 'Favor clarity over cleverness.'],
    [3, 'Create one saveable asset and one shareable opinion or checklist.', 'Separate save intent from share intent.'],
    [4, 'Publish the first variation and record reach, saves, shares, comments, and profile visits after 24 hours.', 'Use the experiment log template.'],
    [7, 'Publish the second variation with a different hook or opening frame.', 'Hold topic constant so the hook test is cleaner.'],
    [10, 'Publish the third variation with a CTA test.', 'Measure conversion behavior, not only likes.'],
    [14, 'Review the experiment set and decide whether to scale, revise, or retire the pattern.', 'Keep the decision evidence-based.']
  ];
  return rows.map((row) => `| ${row.map(md).join(' | ')} |`).join('\n');
}

function buildReport(records, options) {
  const validDates = records.map((record) => record.dateObj).filter(Boolean).sort((a, b) => a - b);
  const dateRange = validDates.length ? `${localDateStamp(validDates[0])} to ${localDateStamp(validDates.at(-1))}` : 'unknown';
  const groupsByType = groupBy(records, 'contentType');
  const groupsByTopic = groupBy(records, 'topic');
  const groupsByWeekday = groupBy(records, 'weekday');
  const groupsByHour = groupBy(records.filter((record) => record.hour !== null), 'hour');
  const totalEngagement = sum(records, 'engagement');
  const totalReach = sum(records, 'reach');
  const totalImpressions = sum(records, 'impressions');
  const avgErReach = mean(records.map((record) => record.erReach));
  const avgSaveRate = mean(records.map((record) => record.saveRate));
  const avgShareRate = mean(records.map((record) => record.shareRate));
  const quality = dataQuality(records);
  const { insights, risks } = buildInsights(records, groupsByType, groupsByTopic);
  const missingNotes = quality
    .filter((item) => item.missing > 0)
    .map((item) => `- ${item.field}: ${item.present}/${records.length} rows present`);

  return `# Instagram Growth Analysis

## Metadata

- Profile: ${md(options.profile || 'not specified')}
- Project: ${md(options.project)}
- Input file: \`${options.inputRel}\`
- Analysis date: ${today}
- Boundary: No external posting or account access was performed.
- Data preservation: Source rows were preserved as local input, normalized for analysis, and not modified or removed.

## Executive Summary

- Fact: ${records.length} post(s) were analyzed across ${dateRange}; total engagement was ${formatNumber(totalEngagement)} from ${formatNumber(totalReach)} reach and ${formatNumber(totalImpressions)} impressions where available.
- Interpretation: The strongest visible signals are ${groupsByType[0]?.name || 'unknown format'} by format and ${groupsByTopic[0]?.name || 'unknown topic'} by topic, based on weighted engagement quality.
- Recommendation: Run a short experiment cycle around the strongest topic and format, while explicitly measuring saves, shares, profile visits, and reach so the next decision is not driven by likes alone.

## Data Coverage

- Posts analyzed: ${records.length}
- Date range: ${dateRange}
- Confidence level: ${confidence(records)}
- Metrics present: ${quality.filter((item) => item.missing === 0).map((item) => item.field).join(', ') || 'none complete'}
- Missing or weak fields: ${quality.filter((item) => item.missing > 0).map((item) => item.field).join(', ') || 'none detected'}

## Performance Snapshot

| Metric | Value | Note |
|---|---:|---|
| Posts | ${formatNumber(records.length)} | One row per post |
| Reach | ${formatNumber(totalReach)} | Sum of rows with reach |
| Impressions | ${formatNumber(totalImpressions)} | Sum of rows with impressions |
| Engagements | ${formatNumber(totalEngagement)} | Likes + comments + shares + saves |
| Avg engagement rate by reach | ${formatPercent(avgErReach)} | Engagements / reach |
| Avg save rate by reach | ${formatPercent(avgSaveRate)} | Saves / reach |
| Avg share rate by reach | ${formatPercent(avgShareRate)} | Shares / reach |

## What Is Working

${sentenceList(insights)}

## Friction And Risks

${sentenceList(risks)}

## Pattern Tables

### By Content Type

| Content type | Posts | Avg reach | Avg ER by reach | Avg saves/reach | Avg shares/reach |
|---|---:|---:|---:|---:|---:|
${groupRows(groupsByType)}

### By Topic

| Topic | Posts | Avg reach | Avg ER by reach | Avg saves/reach | Avg shares/reach |
|---|---:|---:|---:|---:|---:|
${groupRows(groupsByTopic)}

### By Weekday

| Weekday | Posts | Avg reach | Avg ER by reach | Avg saves/reach | Avg shares/reach |
|---|---:|---:|---:|---:|---:|
${groupRows(groupsByWeekday)}

### By Hour

| Hour | Posts | Avg reach | Avg ER by reach | Avg saves/reach | Avg shares/reach |
|---|---:|---:|---:|---:|---:|
${groupRows(groupsByHour)}

## Top Posts

| Rank | Date | Type | Topic | Caption | Reach | Engagements | ER by reach |
|---:|---|---|---|---|---:|---:|---:|
${topPostRows(records)}

## Recommended Experiments

| Experiment | Hypothesis | Action | Success metric | Review window |
|---|---|---|---|---|
${experimentRows(groupsByType, groupsByTopic, records)}

## 14-Day Action Plan

| Day | Action | Owner note |
|---:|---|---|
${actionPlanRows(groupsByType, groupsByTopic)}

## Data Quality Notes

${missingNotes.length ? missingNotes.join('\n') : '- All expected fields were present in every row.'}

## Assumptions

- Weighted score prioritizes saves and shares more than likes because those signals usually indicate deeper content value.
- Recommendations are based only on the supplied local data.
- Platform-level benchmark claims were not used.

## Files

- Report: \`${options.outRel}\`
- Input: \`${options.inputRel}\`
`;
}

async function writeReport(report, outputPath) {
  await fs.mkdir(dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, report, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.input) throw new Error(`Missing --input.\n\n${usage()}`);

  const inputPath = assertInsideWorkspace(resolve(process.cwd(), args.input), 'Input path');
  const project = safeSlug(args.project || 'instagram-growth-analysis');
  const defaultOut = resolve(workspaceRoot, 'projects', project, 'reports', `instagram-growth-analysis-${today}.md`);
  const outputPath = assertInsideWorkspace(args.out ? resolve(process.cwd(), args.out) : defaultOut, 'Output path');
  const rows = await readInput(inputPath);
  if (!rows.length) throw new Error('Input file contains no rows.');

  const records = normalizeRecords(rows, { followers: args.followers });
  const report = buildReport(records, {
    project,
    profile: args.profile,
    inputRel: inputPath.slice(workspaceRoot.length + 1),
    outRel: outputPath.slice(workspaceRoot.length + 1)
  });

  await writeReport(report, outputPath);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
