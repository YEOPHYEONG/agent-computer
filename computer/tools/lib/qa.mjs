import { promises as fs } from 'node:fs';
import { basename, extname } from 'node:path';
import { listFiles, readText, safeTopicName, writeText } from './files.mjs';
import { inferProjectSlug, projectPath } from './project-paths.mjs';

export async function verifyFile(root, filePath, options = {}) {
  const extension = extname(filePath).toLowerCase();
  if (extension === '.pptx') return verifyPptx(root, filePath, options);

  const text = await readText(filePath, undefined);
  const topic = safeTopicName(basename(filePath).replace(/\.[^.]+$/, ''));
  const project = inferProjectSlug(root, filePath, topic);
  const projectResearch = await gatherProjectResearchArtifacts(root, project, filePath);
  const issues = [];

  if (text.length < 400) issues.push(issue('important', 'Output may be too short for durable work.'));
  if (/\b(?:TODO|TBD|placeholder)\b/i.test(text)) issues.push(issue('important', 'Output contains TODO/TBD/placeholder language.'));
  if (!/source|evidence|근거|출처/i.test(text)) issues.push(issue('minor', 'No explicit evidence/source section found.'));
  if (extension === '.html' || extension === '.htm') {
    if (!/<main[\s>]/i.test(text)) issues.push(issue('important', 'HTML output should include a semantic main region.'));
    if (!/<h1[\s>]/i.test(text)) issues.push(issue('important', 'HTML output should include a clear h1.'));
    if (!/stylesheet|styles\.css|<style/i.test(text)) issues.push(issue('important', 'HTML output should include or link styling.'));
    if (!/source|evidence|근거|출처|source of truth/i.test(text)) issues.push(issue('important', 'HTML output should preserve source/evidence boundary visibility.'));
    if (/https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(text)) issues.push(issue('minor', 'HTML output contains external URL dependencies; confirm these are intentional.'));
  }
  if (isDeepResearchOutput(text, filePath)) {
    if (!/research contract/i.test(text)) issues.push(issue('important', 'Deep research output is missing a research contract.'));
    if (!/research mode/i.test(text)) issues.push(issue('important', 'Deep research output is missing Deep/Wide/Hybrid mode selection.'));
    if (!/research architecture/i.test(text)) issues.push(issue('important', 'Deep research output is missing a research architecture selection.'));
    if (!/architecture-specific workplan/i.test(text)) issues.push(issue('important', 'Deep research output is missing an architecture-specific workplan.'));
    if (!/hypothesis map/i.test(text)) issues.push(issue('important', 'Deep research output is missing a hypothesis map.'));
    if (!/red-team critique/i.test(text)) issues.push(issue('important', 'Deep research output is missing a red-team critique.'));
    if (!/synthesis plan/i.test(text)) issues.push(issue('important', 'Deep research output is missing a synthesis plan.'));
    if (!/runtime subagent plan/i.test(text)) issues.push(issue('important', 'Deep research output is missing a runtime subagent plan.'));
    if (!/subagent orchestration/i.test(text) && !/subagent-orchestration/i.test(text)) {
      issues.push(issue('important', 'Deep research output is missing a native/fallback subagent orchestration contract.'));
    }
    if (!/subagent-results/i.test(text)) {
      issues.push(issue('important', 'Deep research output should specify where subagent findings are saved or summarized.'));
    }
    if (!/worker-packets|worker packet/i.test(text)) issues.push(issue('important', 'Deep research output should include worker-packet fallback guidance for specialist research roles.'));
    if (!/intent-analyst/i.test(text) || !/research-architect/i.test(text)) {
      issues.push(issue('important', 'Deep research output should include fixed preflight roles: intent-analyst and research-architect.'));
    }
    if (/tesla|copernicus|테슬라|코페르니쿠스/i.test(text) && !/do not invent|do not create|no ad-hoc|fixed roster|canonical role|만들지|금지|고정/i.test(text)) {
      issues.push(issue('important', 'Deep research output appears to use ad-hoc subagent names instead of the canonical role roster.'));
    }
    if (/(native subagents? (actually )?(ran|executed|spawned)|spawned native|실제.*서브에이전트|서브에이전트.*실행\s*완료|native.*실행\s*완료)/i.test(text) && !/subagent-results\/ac-/i.test(text)) {
      issues.push(issue('important', 'Output claims native subagents ran but does not reference concrete subagent result files.'));
    }
    issues.push(...architectureSpecificIssues(text));
    if (!/source policy/i.test(text)) issues.push(issue('important', 'Deep research output is missing a source policy.'));
    if (!/socratic question engine/i.test(text)) issues.push(issue('important', 'Deep research output is missing the Socratic question engine.'));
    if (!/question routing lanes/i.test(text)) issues.push(issue('important', 'Deep research output is missing question routing lanes.'));
    if (!/ask user now/i.test(text) || !/research next/i.test(text) || !/assume and proceed/i.test(text)) {
      issues.push(issue('important', 'Deep research output should classify questions into Ask User Now, Research Next, and Assume And Proceed lanes.'));
    }
    if (!/question ledger/i.test(text)) issues.push(issue('important', 'Deep research output is missing a question ledger.'));
    if (!/questions that changed the recommendation/i.test(text)) issues.push(issue('important', 'Deep research output must show which questions changed the recommendation, not only list questions.'));
    if (!/assumptions being carried/i.test(text)) issues.push(issue('important', 'Deep research output is missing assumptions being carried into the synthesis.'));
    if (!/evidence confidence/i.test(text)) issues.push(issue('important', 'Deep research output is missing evidence confidence in the main report.'));
    if (!/evidence store/i.test(text)) issues.push(issue('important', 'Deep research output is missing an evidence store.'));
    if (!/claim verification map/i.test(text)) issues.push(issue('important', 'Deep research output is missing a claim verification map.'));
    if (!/intent/i.test(text) || !/evidence/i.test(text) || !/mechanism/i.test(text) || !/counterfactual/i.test(text) || !/transfer/i.test(text) || !/handoff/i.test(text)) {
      issues.push(issue('important', 'Deep research output should include intent, evidence, mechanism, counterfactual, transfer, and handoff questions.'));
    }
    if (countQuestionMarks(text) < 8) issues.push(issue('important', 'Deep research output appears to contain too few explicit questions for a serious research loop.'));
    if (!/targeted retry/i.test(text)) issues.push(issue('minor', 'Deep research output does not show targeted retry handling for weak claims or rows.'));
    if (!/why stop here|why the research stopped|stop condition/i.test(text)) issues.push(issue('minor', 'Deep research output should explain why the research stopped.'));
  }
  if (isResearchHeavyReport(text, filePath, projectResearch)) {
    const hasProjectQuestionLedger = projectResearch.some((item) => /question-ledger\.md$/i.test(item.rel));
    const hasProjectClaimMap = projectResearch.some((item) => /claim-verification-map\.md$/i.test(item.rel));
    const hasProjectEvidenceStore = projectResearch.some((item) => /evidence-store\.md$/i.test(item.rel));
    const hasProjectContract = projectResearch.some((item) => /research-contract\.md$/i.test(item.rel));
    const hasProjectSourceMap = projectResearch.some((item) => /source-map\.md$/i.test(item.rel));
    const hasProjectArchitecture = projectResearch.some((item) => /architecture-decision\.md$/i.test(item.rel));
    if (projectResearch.length >= 3 && isThinResearchReport(text, filePath)) {
      issues.push(issue('important', 'Research-backed report appears too thin to preserve same-project research artifacts; create a fuller report unless the user explicitly asked for a brief.'));
    }
    if ((/question ledger|socratic question engine/i.test(text) || hasProjectQuestionLedger) && !/questions that changed the recommendation/i.test(text)) {
      issues.push(issue('important', 'Research-heavy report has questions but does not show how they changed the recommendation.'));
    }
    if ((/recommendation|strategy|positioning|시장|전략|포지셔닝/i.test(text) || hasProjectContract || hasProjectArchitecture) && !/assumptions being carried|assumptions and unknowns|가정/i.test(text)) {
      issues.push(issue('important', 'Strategy/report output should make carried assumptions visible.'));
    }
    if ((/claim verification|evidence map|source map|근거|출처/i.test(text) || hasProjectClaimMap || hasProjectEvidenceStore) && !/evidence confidence|confidence|신뢰도/i.test(text)) {
      issues.push(issue('important', 'Research-heavy report should summarize evidence confidence in the main report.'));
    }
    if ((hasProjectSourceMap || hasProjectEvidenceStore || hasProjectClaimMap) && !/##\s*(sources|evidence notes|source map|근거|출처)|source:|evidence:/i.test(text)) {
      issues.push(issue('important', 'Research-heavy report is missing an explicit source/evidence section despite same-project research artifacts.'));
    }
    if ((/strategy|positioning|market|go[-\s]?to[-\s]?market|recommendation|전략|포지셔닝|시장|추천/i.test(text) || hasProjectEvidenceStore) && !hasClaimEvidenceConfidenceCaveatMatrix(text)) {
      issues.push(issue('important', 'Research-backed strategy reports should connect major claims to evidence, confidence, and caveats in the main body.'));
    }
  }
  issues.push(...subagentTraceIntegrityIssues(text, projectResearch, filePath));
  if (hasIrrelevantValidationPlan(text)) {
    issues.push(issue('minor', 'Output appears to add user interviews/experiments where the task may not require real-world behavior validation.'));
  }
  if (/summary|요약/i.test(text) && !/preserve|보존|not removed|축약하지/i.test(text)) {
    issues.push(issue('minor', 'Summary language appears without an explicit content-preservation note.'));
  }
  if (/\b(sent|posted|published)\b/i.test(text) && !/approved|approval|승인/i.test(text)) {
    issues.push(issue('critical', 'External action claim may lack approval language.'));
  }

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

function architectureSpecificIssues(text) {
  const issues = [];
  const value = String(text || '');
  const selected = selectedResearchArchitecture(value);

  if (selected === 'Product / GTM Strategy Research') {
    if (!/target segment|first user|buyer|타깃|사용자|고객/i.test(value)) issues.push(issue('important', 'Product/GTM research is missing a target segment or first-user definition.'));
    if (!/offer|positioning|오퍼|제안|포지셔닝/i.test(value)) issues.push(issue('important', 'Product/GTM research is missing offer or positioning logic.'));
    if (!/channel|acquisition|distribution|채널|유입|획득|유통/i.test(value)) issues.push(issue('important', 'Product/GTM research is missing channel or acquisition logic.'));
    if (!/retention|activation|conversion|loop|리텐션|활성화|전환|루프/i.test(value)) issues.push(issue('important', 'Product/GTM research is missing activation, conversion, retention, or loop logic.'));
    if (!/experiment|metric|success metric|실험|지표|측정/i.test(value)) issues.push(issue('important', 'Product/GTM research is missing experiment and metric logic.'));
  }

  if (selected === 'Growth Case Reconstruction') {
    if (!/timeline|milestone|inflection|growth overview|타임라인|마일스톤|전환점|성장 개요/i.test(value)) issues.push(issue('important', 'Growth case reconstruction is missing timeline, milestone, or inflection-point structure.'));
    if (!/tactic|channel|message|offer|manual|founder|전술|채널|메시지|오퍼|수작업|창업자/i.test(value)) issues.push(issue('important', 'Growth case reconstruction is missing concrete tactics, channels, messages, offers, or operating details.'));
    if (!/mechanism|why it worked|작동 원리|왜.*효과|메커니즘/i.test(value)) issues.push(issue('important', 'Growth case reconstruction is missing mechanism or why-it-worked analysis.'));
    if (!/transfer|benchmark|playbook|non-transferable|전이|벤치마크|플레이북|복제/i.test(value)) issues.push(issue('important', 'Growth case reconstruction is missing transferability or non-transferable-context analysis.'));
  }

  if (selected === 'Wide Benchmark To Deep Synthesis') {
    if (!/inclusion criteria|case matrix|item matrix|선정 기준|포함 기준|사례 매트릭스/i.test(value)) issues.push(issue('important', 'Benchmark synthesis is missing inclusion criteria or a case/item matrix.'));
    if (!/rubric|shared rubric|평가 기준|공통 기준/i.test(value)) issues.push(issue('important', 'Benchmark synthesis is missing a shared rubric.'));
    if (!/pattern|formula|framework|패턴|공식|프레임워크/i.test(value)) issues.push(issue('important', 'Benchmark synthesis is missing pattern, formula, or framework synthesis.'));
    if (!/exception|outlier|non-transferable|예외|아웃라이어|복제 불가/i.test(value)) issues.push(issue('important', 'Benchmark synthesis is missing exceptions, outliers, or transfer limits.'));
  }

  if (selected === 'Market / Competitive Landscape') {
    if (!/category|market boundary|segment|카테고리|시장 경계|세그먼트/i.test(value)) issues.push(issue('important', 'Market/competitive research is missing category boundary or segmentation.'));
    if (!/competitor|alternative|substitute|경쟁|대안|대체재/i.test(value)) issues.push(issue('important', 'Market/competitive research is missing competitors, alternatives, or substitutes.'));
    if (!/dimension|whitespace|positioning|비교 축|화이트스페이스|포지셔닝/i.test(value)) issues.push(issue('important', 'Market/competitive research is missing comparison dimensions, whitespace, or positioning implications.'));
  }

  if (selected === 'Technical / Implementation Research') {
    if (!/official|docs|version|environment|공식|문서|버전|환경/i.test(value)) issues.push(issue('important', 'Technical research is missing official-docs, version, or environment assumptions.'));
    if (!/implementation|steps|edge case|security|verification|구현|단계|엣지|보안|검증/i.test(value)) issues.push(issue('important', 'Technical research is missing implementation steps, edge cases, security, or verification plan.'));
  }

  if (selected === 'Source-Heavy Evidence Review') {
    if (!/source scope|source claim|document claim|preserve|external verification|원본|문서 주장|보존|외부 검증/i.test(value)) issues.push(issue('important', 'Source-heavy review is missing source scope, document-claim separation, preservation, or external-verification guidance.'));
  }

  if (selected === 'Strategic Decision Research') {
    if (!/option|criteria|tradeoff|counterargument|recommendation|선택지|기준|트레이드오프|반론|추천/i.test(value)) issues.push(issue('important', 'Strategic decision research is missing options, criteria, tradeoffs, counterargument, or recommendation logic.'));
  }

  return issues;
}

function selectedResearchArchitecture(text) {
  const value = String(text || '');
  const selected = value.match(/^\s*-\s*(?:Selected research architecture|Selected architecture|Architecture):\s*([^\n]+)/im);
  if (!selected) return '';
  return selected[1].trim().replace(/[.;]\s*$/, '');
}

function isDeepResearchOutput(text, filePath) {
  return /_deep-research\.md$/i.test(filePath)
    || /#\s*Deep Research Report/i.test(text)
    || (/Research Contract/i.test(text) && /Question Ledger/i.test(text) && /Claim Verification Map/i.test(text));
}

function isResearchHeavyReport(text, filePath, projectResearch = []) {
  const path = String(filePath || '').replace(/\\/g, '/');
  const isMarkdownReport = /\/reports\/[^/]+\.md$/i.test(path) || /_report\.md$/i.test(path);
  const hasResearchArtifacts = projectResearch.some((item) => /\/research\/(question-ledger|claim-verification-map|evidence-store|research-contract|architecture-decision|hypothesis-map|red-team-critique|synthesis-plan|source-map)\.md$/i.test(item.rel));
  const reportSignals = /question ledger|socratic question engine|claim verification|evidence map|source map|strategy|positioning|market|go[-\s]?to[-\s]?market|business model|launch|recommendation|전략|포지셔닝|시장|비즈니스 모델|출시|추천/i.test(text);
  return isMarkdownReport && (hasResearchArtifacts || reportSignals);
}

function isThinResearchReport(text, filePath) {
  const path = String(filePath || '');
  if (/brief|summary|요약|브리프/i.test(path)) return false;
  if (/brief|short version|executive brief|요약본|간단 요약/i.test(text.slice(0, 600))) return false;
  const lineCount = String(text || '').split(/\r?\n/).filter((line) => line.trim()).length;
  const sectionCount = (String(text || '').match(/^##\s+/gm) || []).length;
  return lineCount < 90 || String(text || '').length < 6500 || sectionCount < 8;
}

function hasClaimEvidenceConfidenceCaveatMatrix(text) {
  const value = String(text || '');
  return /claim[-\s]*evidence[-\s]*confidence[-\s]*caveat/i.test(value)
    || /\|\s*claim\s*\|\s*evidence\s*\|\s*confidence\s*\|\s*caveat/i.test(value)
    || /\|\s*주장\s*\|\s*근거\s*\|\s*신뢰도?\s*\|\s*(한계|주의|caveat)/i.test(value);
}

function subagentTraceIntegrityIssues(text, projectResearch = [], filePath = '') {
  const issues = [];
  const researchTexts = projectResearch
    .filter((item) => /runtime-subagent-plan\.md$|subagent-orchestration\.md$|subagent-results\/README\.md$/i.test(item.rel))
    .map((item) => item.text);
  const combined = [text, ...researchTexts].join('\n');
  const subagentResultFiles = projectResearch.filter((item) => /subagent-results\/.+\.md$/i.test(item.rel)
    && !/subagent-results\/(?:README|_template)\.md$/i.test(item.rel));
  const nonCanonicalResultFiles = subagentResultFiles.filter((item) => !/subagent-results\/ac-[a-z0-9-]+\.md$/i.test(item.rel));
  const resultRoles = new Set();
  for (const item of projectResearch) {
    const match = item.rel.match(/subagent-results\/ac-([a-z0-9-]+)\.md$/i);
    if (match) resultRoles.add(match[1]);
  }

  if (nonCanonicalResultFiles.length) {
    const examples = nonCanonicalResultFiles.slice(0, 5).map((item) => item.rel).join(', ');
    issues.push(issue('important', `Subagent result files must use canonical research/subagent-results/ac-<role>.md names. Non-canonical file(s): ${examples}.`));
  }

  if (subagentResultFiles.length) {
    for (const role of ['intent-analyst', 'research-architect']) {
      if (!resultRoles.has(role)) {
        issues.push(issue('important', `Subagent-backed research should preserve preflight result research/subagent-results/ac-${role}.md before investigation synthesis.`));
      }
    }
  }

  const isReportOutput = /\/reports\/[^/]+\.md$/i.test(String(filePath || '').replace(/\\/g, '/')) || /_report\.md$/i.test(filePath);
  const claimedReportComposerAuthorship = /(?:작성\s*주체|author|authored by|composed by|composer|report\s*composer)[^\n]{0,120}ac-report-composer/i.test(text)
    || /ac-report-composer[^\n]{0,120}(?:작성\s*주체|author|authored|composed|composer)/i.test(text);
  const composerResult = projectResearch.find((item) => /subagent-results\/ac-report-composer\.md$/i.test(item.rel));
  if (isReportOutput && claimedReportComposerAuthorship && !composerResult) {
    issues.push(issue('critical', 'Report claims ac-report-composer authorship/composition, but research/subagent-results/ac-report-composer.md is missing.'));
  }
  if (isReportOutput && subagentResultFiles.length && !resultRoles.has('report-composer')) {
    issues.push(issue('important', 'Subagent-backed reports should include research/subagent-results/ac-report-composer.md so the final report is composed from the full research package.'));
  }
  if (composerResult && !isFilledReportComposerResult(composerResult.text)) {
    issues.push(issue('critical', 'research/subagent-results/ac-report-composer.md exists but does not contain a complete report-composition trace.'));
  }

  const promisedArtifacts = [
    ['question-ledger', /question-ledger\.md/i],
    ['evidence-store', /evidence-store\.md/i]
  ];
  const rels = projectResearch.map((item) => item.rel);
  for (const [name, pattern] of promisedArtifacts) {
    const promised = pattern.test(combined);
    const present = rels.some((rel) => new RegExp(`research/${name}\\.md$`, 'i').test(rel));
    if (isReportOutput && subagentResultFiles.length && promised && !present) {
      const severity = name === 'question-ledger' ? 'critical' : 'important';
      issues.push(issue(severity, `Subagent-backed report orchestration references research/${name}.md, but that artifact is missing.`));
    }
  }

  const completedRoles = new Set([...combined.matchAll(/`?(?:ac-)?([a-z][a-z0-9-]+)`?\s*:\s*completed\b/gi)]
    .map((match) => normalizeRoleKey(match[1]))
    .filter(Boolean));
  for (const role of completedRoles) {
    if (!resultRoles.has(role)) {
      issues.push(issue('important', `Subagent role ac-${role} is marked completed, but research/subagent-results/ac-${role}.md is missing.`));
    }
  }

  const nativeOrchestration = /native codex subagents are authorized|native subagents requested:\s*yes|explicit native-subagent permission:\s*yes|실제.*서브에이전트/i.test(combined);
  if (nativeOrchestration) {
    for (const role of ['intent-analyst', 'research-architect']) {
      if (!resultRoles.has(role)) {
        issues.push(issue('important', `Native subagent orchestration should preserve preflight result research/subagent-results/ac-${role}.md.`));
      }
    }
  }

  if (subagentResultFiles.length && !/subagent-results\/ac-|subagent findings|서브에이전트.*결과/i.test(text)) {
    issues.push(issue('minor', 'Main output has subagent result artifacts in the project, but does not cite or summarize the canonical subagent result files.'));
  }

  if (/outcome-changing questions were detected/i.test(combined)
    && /proceeds? under explicit assumptions|proceed.*assumptions|가정.*진행/i.test(combined)
    && !/user explicitly (approved|authorized|asked)|사용자가.*(가정|승인|질문하지|묻지)/i.test(combined)) {
    issues.push(issue('important', 'Outcome-changing questions were converted into assumptions without clear user authorization.'));
  }

  return issues;
}

function normalizeRoleKey(value) {
  return String(value || '').replace(/^ac-/, '').toLowerCase().trim();
}

function isFilledReportComposerResult(text) {
  const value = String(text || '');
  if (value.length < 1200) return false;
  const required = [
    /Questions That Changed The Recommendation|추천을?\s*바꾼\s*질문|판단을?\s*바꾼\s*질문/i,
    /Claim[-\s]*Evidence[-\s]*Confidence[-\s]*Caveat|주장.*근거.*신뢰.*(한계|주의|caveat)/i,
    /Assumptions Being Carried|Assumptions|가정/i,
    /Validate Later|Validation Later|검증\s*필요|나중에\s*검증/i,
    /Downstream Handoff|Handoff|핸드오프|후속\s*(전달|작업)/i
  ];
  return required.every((pattern) => pattern.test(value));
}

async function gatherProjectResearchArtifacts(root, project, filePath) {
  const files = await listFiles(root, { maxDepth: 8 });
  const matches = files.filter((file) => {
    if (file.path === filePath) return false;
    if (file.ext !== '.md') return false;
    return file.rel.startsWith(`workspace/projects/${project}/research/`)
      || file.rel.startsWith(`projects/${project}/research/`);
  });
  const items = [];
  for (const file of matches) {
    const text = await readText(file.path, '');
    if (!text.trim()) continue;
    items.push({ rel: file.rel, path: file.path, text });
  }
  return items;
}

function hasIrrelevantValidationPlan(text) {
  const hasValidation = /user interview|사용자 인터뷰|beta test|베타|pricing experiment|가격 실험|retention test|리텐션|conversion experiment|전환 실험/i.test(text);
  if (!hasValidation) return false;
  const relevantDomain = /product|market|positioning|go[-\s]?to[-\s]?market|gtm|launch|pricing|retention|conversion|monetization|sales|user|customer|onboarding|growth|strategy|business model|제품|시장|포지셔닝|출시|가격|전환|수익|사용자|고객|온보딩|성장|전략|비즈니스 모델/i.test(text);
  return !relevantDomain;
}

function countQuestionMarks(text) {
  return (String(text || '').match(/\?/g) || []).length;
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
