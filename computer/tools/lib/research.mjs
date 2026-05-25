import { basename, resolve } from 'node:path';
import { listFiles, readText, safeTopicName, writeText } from './files.mjs';
import { bulletList, extractHeadings, splitSentences, stripMarkdown } from './markdown.mjs';
import { maskEmailsInText, redactEmailsForStorageName, renderRecipientResolution, resolveEmailRecipient } from './contacts.mjs';
import { inferProjectSlug, projectPath } from './project-paths.mjs';
import { resolveWorkspacePath } from './workspace.mjs';
import { prepareResearchSubagentRuntime } from './subagents.mjs';

export async function quickResearch(root, filePath, options = {}) {
  const source = await readText(filePath, undefined);
  const question = options.question || `What matters in ${basename(filePath)}?`;
  const facts = topSentences(source, 6);
  const topic = safeTopicName(question);
  const project = inferProjectSlug(root, filePath, topic);
  const out = projectPath(root, project, 'research', `${topic}_quick-research.md`);
  const headings = extractHeadings(source).slice(0, 8).map((h) => h.title);
  const body = `# Quick Research Brief

## Question

${question}

## Sub-Questions Checked

- What is the source mainly about?
- What facts or claims appear repeatedly?
- What is immediately useful for the user's likely decision?

## Short Answer

${facts[0] || 'The source needs more context before a confident answer can be produced.'}

## Key Facts

${bulletList(facts)}

## Source Agreement And Disagreement

- Workspace source reviewed: \`${filePath}\`
- External browsing was not run by this local CLI. Use the runtime agent to browse when current external evidence is required.

## Interpretation

${interpret(source)}

## What Is Uncertain

- External validation may be needed if the question depends on current facts.

## Sources

- \`${filePath}\`

## Deep Dive Needed?

${headings.length > 5 ? 'Yes, the source has enough structure for a deeper analysis.' : 'Only if the user needs causality, strategy, or external validation.'}
`;
  await writeText(out, body);
  return { file: out, text: `Wrote ${out}` };
}

export async function deepResearch(root, filePath, options = {}) {
  const source = await readText(filePath, undefined);
  const question = options.question || `Deeply analyze ${basename(filePath)}.`;
  const topic = safeTopicName(question);
  const project = inferProjectSlug(root, filePath, topic);
  const out = projectPath(root, project, 'research', `${topic}_deep-research.md`);
  const contractFile = projectPath(root, project, 'research', 'research-contract.md');
  const architectureDecisionFile = projectPath(root, project, 'research', 'architecture-decision.md');
  const sourceMapFile = projectPath(root, project, 'research', 'source-map.md');
  const evidenceStoreFile = projectPath(root, project, 'research', 'evidence-store.md');
  const questionLedgerFile = projectPath(root, project, 'research', 'question-ledger.md');
  const claimMapFile = projectPath(root, project, 'research', 'claim-verification-map.md');
  const hypothesisMapFile = projectPath(root, project, 'research', 'hypothesis-map.md');
  const redTeamCritiqueFile = projectPath(root, project, 'research', 'red-team-critique.md');
  const synthesisPlanFile = projectPath(root, project, 'research', 'synthesis-plan.md');
  const qualityControlPlanFile = projectPath(root, project, 'research', 'research-quality-control-plan.md');
  const evaluationTemplateFile = projectPath(root, project, 'research', 'evaluations', '_template.md');
  const repairPacketTemplateFile = projectPath(root, project, 'research', 'repair-packets', '_template.md');
  const retryLogFile = projectPath(root, project, 'research', 'retry-log.md');
  const researchQaFile = projectPath(root, project, 'research', `${topic}_research-qa.md`);
  const workerPacketFile = projectPath(root, project, 'research', 'worker-packets', 'worker-packet-template.md');
  const facts = topSentences(source, 10);
  const headings = extractHeadings(source).map((h) => `${'  '.repeat(h.level - 1)}- ${h.title}`).join('\n') || '- No headings found';
  const evidence = await gatherReportEvidence(root, project, filePath, { includeProjectResearch: false });
  const memory = await readResearchMemory(root);
  const claims = extractClaimUnits(source);
  const claimReviews = claims.map((claim) => reviewClaim(claim, evidence.items));
  const supported = claimReviews.filter((claim) => claim.status === 'Supported' || claim.status === 'Partially supported');
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported');
  const mode = inferResearchMode(question, source, claims);
  const architecture = inferResearchArchitecture(question, source, mode, claims, filePath);
  const architectureDecision = renderResearchArchitectureDecision(architecture, mode, question, filePath);
  const architectureWorkplan = renderArchitectureWorkplan(architecture, question, mode);
  const hypothesisMapRows = renderHypothesisMap(architecture, question, claimReviews);
  const redTeamCritiqueRows = renderRedTeamCritique(architecture, question, claimReviews);
  const synthesisPlan = renderSynthesisPlan(architecture, question, mode, claimReviews);
  const qualityControlPlan = renderResearchQualityControlPlan(question, architecture, mode);
  const evaluationTemplate = renderResearchEvaluationTemplate();
  const repairPacketTemplate = renderResearchRepairPacketTemplate();
  const subagentRuntime = await prepareResearchSubagentRuntime(root, project, architecture, mode, question, {
    runtime: options.runtime || 'auto',
    nativeSubagents: options.nativeSubagents,
    materializeSubagents: options.materializeSubagents
  });
  const sourceMapRows = renderDeepSourceMap(filePath, evidence.items);
  const evidenceStoreRows = renderEvidenceStoreRows(filePath, facts, evidence.items, claimReviews);
  const questionSet = buildSocraticQuestionSet(question, source, claimReviews, mode);
  const questionEngineRows = renderSocraticQuestionEngine(questionSet);
  const questionLaneRows = renderQuestionRoutingLanes(questionSet, source, question);
  const selectedQuestion = renderSelectedNextBestQuestion(questionSet, claimReviews);
  const recommendationQuestionRows = renderQuestionsThatChangedRecommendation(questionSet, claimReviews, mode);
  const carriedAssumptions = renderAssumptionsBeingCarried(question, source, claimReviews);
  const evidenceConfidenceRows = renderEvidenceConfidence(filePath, evidence.items, claimReviews);
  const validationLaterItems = renderValidationLaterItems(source, question, claimReviews);
  const questionLedgerRows = renderQuestionLedger(question, source, claimReviews, questionSet);
  const claimMapRows = claimReviews.length
    ? claimReviews.map(renderClaimRow).join('\n')
    : '| No specific claim extracted | Needs validation | No claim-like source lines found. | Ask for more source material before drawing conclusions. |';
  const retryLog = renderTargetedRetryLog(mode, claimReviews);
  const researchContract = renderResearchContract(project, question, filePath, mode);
  const sourcePolicy = renderResearchSourcePolicy(mode);
  const workerPacket = renderWorkerPacketTemplate(mode, question);
  const researchQa = renderResearchQa(question, mode, architecture, evidence.items, claimReviews);
  const body = `# Deep Research Report

## Research Question

${question}

## Short Answer

${renderDeepShortAnswer(facts, supported, unresolved)}

## Research Contract

${researchContract}

## Depth Standard

${renderDepthStandard(question)}

## Research Mode

${renderResearchModeDecision(mode)}

## Research Architecture

${architectureDecision}

## Architecture-Specific Workplan

${architectureWorkplan}

## Hypothesis Map

| Hypothesis | Evidence for | Evidence against | Confidence | What would change it |
|---|---|---|---|---|
${hypothesisMapRows}

## Red-Team Critique

| Risk | Why it could be wrong | How to test or caveat it | Status |
|---|---|---|---|
${redTeamCritiqueRows}

## Synthesis Plan

${synthesisPlan}

## Research Quality Control Plan

${qualityControlPlan}

## Runtime Subagent Plan

${subagentRuntime.planMarkdown}

## Native Subagent Orchestration

- Execution contract: \`${subagentRuntime.orchestrationFile}\`
- Result directory: \`${subagentRuntime.resultsReadmeFile}\`
- Result template: \`${subagentRuntime.resultTemplateFile}\`
- Truthfulness rule: do not claim native subagents actually ran unless their findings are written or summarized in \`subagent-results/ac-*.md\`.

## Source Policy

${sourcePolicy}

## Research Frame

### Decision Supported

This local deep-research pass helps decide how to understand, position, or act on the provided source. It does not claim to be a complete external investigation.

### Sub-Questions

${renderDeepQuestions(question, source)}

## Memory-Aware User Usefulness Frame

${renderResearchMemoryFrame(memory, question)}

## Research Pass Log

${renderResearchPassLog(evidence.items, claimReviews)}

## Socratic Question Engine

| Question Type | Lane | Question | Why it matters | Research action or user checkpoint |
|---|---|---|---|---|
${questionEngineRows}

## Question Routing Lanes

| Lane | Questions | Required behavior |
|---|---|---|
${questionLaneRows}

### Selected Next-Best Question

${selectedQuestion}

## Question Ledger

| Question | Why it matters to the user | Status | Evidence used | Next action |
|---|---|---|---|---|
${questionLedgerRows}

## User Checkpoints And Assumptions

${renderUserCheckpoints(question, claimReviews)}

## Questions That Changed The Recommendation

| Question | Effect on recommendation | Evidence or assumption used |
|---|---|---|
${recommendationQuestionRows}

## Assumptions Being Carried

${carriedAssumptions}

## Evidence Confidence / Claim-Evidence-Confidence-Caveat Matrix

| Claim | Evidence | Confidence | Caveat |
|---|---|---|---|
${evidenceConfidenceRows}

## Validate Later Items

${validationLaterItems}

## Source Map

| Source | Tier | Type | Use | Confidence |
|---|---|---|---|---|
${sourceMapRows}

## Evidence Store

| Evidence ID | Claim or fact | Source | Tier | Confidence | Notes |
|---|---|---|---|---|---|
${evidenceStoreRows}

## Claim Verification Map

| Claim Or Input Item | Verification Status | Evidence Used | Treatment |
|---|---|---|---|
${claimMapRows}

## Targeted Retry Log

${retryLog}

## Wide Or Hybrid Worker Packets

${mode.mode === 'Wide' || mode.mode === 'Hybrid' ? workerPacket : '- Not required for the selected Deep Mode unless the research expands into a case/table comparison.'}

## DIKI Synthesis

### Data

${renderDeepData(facts, headings)}

### Information

${renderDeepInformation(claimReviews)}

### Knowledge

${renderDeepKnowledge(source, claimReviews)}

### Insight

${renderDeepInsight(question, claimReviews)}

## Findings

${renderDeepFindings(claimReviews, facts)}

## Mechanism Analysis

${renderMechanismAnalysis(source, claimReviews)}

## Structure Observed

${headings}

## Evidence Notes

- Facts above come from the provided workspace source.
- External browsing was not run by this local CLI. Use the runtime agent for current web validation, source triangulation, and quote-level verification.
${evidence.items.map((item) => `- Local evidence checked: \`${item.path}\``).join('\n')}

## Implications

${renderDeepImplications(project, claimReviews)}

## Open Questions

${renderDeepOpenQuestions(claimReviews)}

## Next Research Pass

${renderNextResearchPass(question, claimReviews)}

## Downstream Handoff

${renderDownstreamHandoff(mode, architecture, topic, claimReviews)}

## Why Stop Here

${renderWhyStopHere(claimReviews)}

## Sources

- \`${filePath}\`
${evidence.items.slice(0, 8).map((item) => `- \`${item.path}\``).join('\n')}
`;
  await writeText(contractFile, `# Research Contract\n\n${researchContract}\n`);
  await writeText(architectureDecisionFile, `# Architecture Decision\n\n${architectureDecision}\n\n## Architecture-Specific Workplan\n\n${architectureWorkplan}\n`);
  await writeText(sourceMapFile, `# Source Map\n\n| Source | Tier | Type | Use | Confidence |\n|---|---|---|---|---|\n${sourceMapRows}\n`);
  await writeText(evidenceStoreFile, `# Evidence Store\n\n| Evidence ID | Claim or fact | Source | Tier | Confidence | Notes |\n|---|---|---|---|---|---|\n${evidenceStoreRows}\n`);
  await writeText(questionLedgerFile, `# Question Ledger\n\n## Socratic Question Engine\n\n| Question Type | Lane | Question | Why it matters | Research action or user checkpoint |\n|---|---|---|---|---|\n${questionEngineRows}\n\n## Question Routing Lanes\n\n| Lane | Questions | Required behavior |\n|---|---|---|\n${questionLaneRows}\n\n## Selected Next-Best Question\n\n${selectedQuestion}\n\n## Questions That Changed The Recommendation\n\n| Question | Effect on recommendation | Evidence or assumption used |\n|---|---|---|\n${recommendationQuestionRows}\n\n## Ledger\n\n| Question | Why it matters to the user | Status | Evidence used | Next action |\n|---|---|---|---|---|\n${questionLedgerRows}\n`);
  await writeText(claimMapFile, `# Claim Verification Map\n\n| Claim Or Input Item | Verification Status | Evidence Used | Treatment |\n|---|---|---|---|\n${claimMapRows}\n`);
  await writeText(hypothesisMapFile, `# Hypothesis Map\n\n| Hypothesis | Evidence for | Evidence against | Confidence | What would change it |\n|---|---|---|---|---|\n${hypothesisMapRows}\n`);
  await writeText(redTeamCritiqueFile, `# Red-Team Critique\n\n| Risk | Why it could be wrong | How to test or caveat it | Status |\n|---|---|---|---|\n${redTeamCritiqueRows}\n`);
  await writeText(synthesisPlanFile, `# Synthesis Plan\n\n${synthesisPlan}\n`);
  await writeText(qualityControlPlanFile, `# Research Quality Control Plan\n\n${qualityControlPlan}\n`);
  await writeText(evaluationTemplateFile, evaluationTemplate);
  await writeText(repairPacketTemplateFile, repairPacketTemplate);
  await writeText(retryLogFile, `# Targeted Retry Log\n\n${retryLog}\n`);
  await writeText(researchQaFile, researchQa);
  if (mode.mode === 'Wide' || mode.mode === 'Hybrid') await writeText(workerPacketFile, `# Worker Packet Template\n\n${workerPacket}\n`);
  await writeText(out, body);
  const files = [contractFile, architectureDecisionFile, sourceMapFile, evidenceStoreFile, questionLedgerFile, claimMapFile, hypothesisMapFile, redTeamCritiqueFile, synthesisPlanFile, qualityControlPlanFile, evaluationTemplateFile, repairPacketTemplateFile, subagentRuntime.planFile, retryLogFile, researchQaFile, ...subagentRuntime.files.filter((file) => file !== subagentRuntime.planFile)];
  if (mode.mode === 'Wide' || mode.mode === 'Hybrid') files.push(workerPacketFile);
  return { file: out, files, text: `Wrote ${out}` };
}

function renderDeepSourceMap(primaryPath, evidenceItems) {
  const rows = [`| \`${primaryPath}\` | User-provided | workspace file | primary input and claim source | medium |`];
  for (const item of evidenceItems.slice(0, 8)) {
    rows.push(`| \`${item.path}\` | User-provided | local workspace evidence | support, contradiction, or context check | medium |`);
  }
  return rows.join('\n');
}

function inferResearchMode(question, source, claims) {
  const text = String(question || '').toLowerCase();
  const sourceText = String(source || '').toLowerCase();
  const itemCountSignals = [
    ...text.matchAll(/\b(\d{2,})\b/g)
  ].map((match) => Number(match[1])).filter((value) => value >= 10);
  const hasManyItems = itemCountSignals.length > 0 || /(many|list|compare|comparison|matrix|dataset|table|profiles?|examples?|cases?|benchmarks?|여러|목록|비교|표|데이터셋|사례|예시|케이스|벤치마크|도구들|회사들|브랜드들)/i.test(text);
  const wantsFormula = /(formula|framework|pattern|principle|strategy|recommend|positioning|공식|프레임|패턴|전략|추천|포지셔닝|시사점|성공\s*공식)/i.test(text);
  const hasConflictOrDecision = /(which|decide|judge|tradeoff|vs\.?|versus|conflict|contradiction|어떤|뭐가|판단|결정|비교|상충|모순|트레이드오프)/i.test(text);
  const sourceHasListSignals = /(table|dataset|comparison|matrix|목록|비교표|데이터셋)/i.test(sourceText);

  if (hasManyItems && wantsFormula) {
    return {
      mode: 'Hybrid',
      reason: 'The request appears to need broad coverage under a shared rubric followed by deep synthesis into a formula, strategy, or recommendation.',
      trigger: 'many-items-plus-synthesis',
      itemEstimate: itemCountSignals[0] || Math.max(10, Math.min(50, claims.length || 10))
    };
  }
  if ((hasManyItems || (sourceHasListSignals && /compare|비교|table|표|dataset|데이터셋/i.test(text))) && !hasConflictOrDecision) {
    return {
      mode: 'Wide',
      reason: 'The request appears to involve many independent items that can be researched with a shared rubric.',
      trigger: 'many-independent-items',
      itemEstimate: itemCountSignals[0] || Math.max(10, Math.min(50, claims.length || 10))
    };
  }
  return {
    mode: 'Deep',
    reason: hasConflictOrDecision
      ? 'The request appears to require judgment, tradeoff analysis, or conflict resolution around one main question.'
      : 'The request appears to center on one main question where mechanisms, evidence, and implications matter more than item coverage.',
    trigger: hasConflictOrDecision ? 'judgment-or-conflict' : 'single-hard-question',
    itemEstimate: 1
  };
}

function renderResearchModeDecision(mode) {
  return [
    `- Mode: ${mode.mode}`,
    `- Why this mode: ${mode.reason}`,
    `- Trigger: ${mode.trigger}`,
    `- Estimated item count: ${mode.itemEstimate}`,
    `- What would make the mode change: switch to Wide if the task becomes a large comparison table; switch to Hybrid if broad coverage must feed a strategic formula or recommendation.`
  ].join('\n');
}

function inferResearchArchitecture(question, source, mode, claims, filePath = '') {
  const questionText = String(question || '').toLowerCase();
  const sourceText = String(source || '').toLowerCase();
  const fileText = String(filePath || '').toLowerCase();
  const text = `${questionText}\n${sourceText}\n${fileText}`;
  const claimText = claims.join('\n').toLowerCase();

  if (mode.mode === 'Hybrid' || /(cases?|examples?|benchmarks?|compare|comparison|matrix|formula|framework|pattern|success formula|사례|성공사례|예시|케이스|벤치마크|비교|공식|프레임워크|패턴)/i.test(questionText)) {
    return architectureDefinition('Wide Benchmark To Deep Synthesis', 'benchmark-to-synthesis signal');
  }
  if (/(how .*grew|growth journey|growth history|milestones?|viral|community|brand growth|newsletter growth|creator growth|성장\s*과정|성장\s*여정|전환점|마일스톤|바이럴|커뮤니티|브랜드\s*성장)/i.test(questionText)) {
    return architectureDefinition('Growth Case Reconstruction', 'growth reconstruction signal');
  }
  if (/(product|gtm|go[-\s]?to[-\s]?market|launch|pricing|channel|positioning|business model|retention|onboarding|monetization|sales|activation|제품|시장\s*전략|출시|가격|채널|포지셔닝|비즈니스\s*모델|리텐션|온보딩|수익|세일즈|활성화)/i.test(questionText)) {
    return architectureDefinition('Product / GTM Strategy Research', 'product or GTM signal');
  }
  if (/(market|competitor|competitive|landscape|category|alternatives?|whitespace|segment|tam|sam|시장|경쟁|경쟁사|카테고리|대안|화이트스페이스|세그먼트)/i.test(questionText + claimText)) {
    return architectureDefinition('Market / Competitive Landscape', 'market or competitive landscape signal');
  }
  if (/(api|sdk|implementation|implement|integrat|debug|configure|architecture|official docs?|install|error|code|technical|기술|구현|연동|통합|설치|디버그|공식\s*문서|아키텍처)/i.test(questionText)) {
    return architectureDefinition('Technical / Implementation Research', 'technical signal');
  }
  if (/(pdf|pptx|deck|slides?|paper|report|transcript|document|source file|based on this|based on the source|자료|문서|보고서|논문|덱|원본|첨부|파일)/i.test(questionText + fileText)) {
    return architectureDefinition('Source-Heavy Evidence Review', 'source-heavy input signal');
  }
  if (/(api|sdk|implementation|implement|integrat|debug|configure|architecture|official docs?|install|error|code|technical|기술|구현|연동|통합|설치|디버그|공식\s*문서|아키텍처)/i.test(text)) {
    return architectureDefinition('Technical / Implementation Research', 'technical signal');
  }
  return architectureDefinition('Strategic Decision Research', 'default strategic decision signal');
}

function architectureDefinition(name, trigger) {
  const catalog = {
    'Strategic Decision Research': {
      slug: 'strategic-decision',
      requiredQuestions: ['What decision is being made?', 'What options are available?', 'What criteria matter?', 'What would make the recommended option wrong?'],
      requiredEvidence: ['option evidence', 'decision criteria', 'constraints', 'counterargument'],
      finalStructure: ['decision context', 'options', 'criteria', 'evidence by option', 'tradeoffs', 'recommendation', 'next action'],
      qaCriteria: ['options visible', 'criteria explicit', 'recommendation tied to evidence', 'counterargument included'],
      switchSignals: ['large comparable item set', 'source-only extraction', 'implementation detail dominates']
    },
    'Product / GTM Strategy Research': {
      slug: 'product-gtm',
      requiredQuestions: ['Who is the sharpest first user or buyer?', 'What job makes the offer urgent?', 'Which channel can repeatedly reach them?', 'What activation or retention loop proves value?', 'Which metric decides whether the strategy works?'],
      requiredEvidence: ['target evidence', 'problem/job evidence', 'channel evidence', 'conversion or retention logic', 'experiment and metric plan'],
      finalStructure: ['target segment', 'problem/job-to-be-done', 'offer and positioning', 'channel strategy', 'acquisition/conversion/retention loop', 'experiments and metrics', 'risks and assumptions'],
      qaCriteria: ['target present', 'offer present', 'channel present', 'loop present', 'experiment present', 'metrics present'],
      switchSignals: ['pure category map', 'historical growth case only', 'technical implementation dominates']
    },
    'Growth Case Reconstruction': {
      slug: 'growth-case',
      requiredQuestions: ['What was the starting wedge?', 'What changed at each inflection point?', 'Which channel or message drove the transition?', 'What was manual or founder-led?', 'What can and cannot be copied?'],
      requiredEvidence: ['timeline', 'milestones', 'tactics', 'channel/message/offer evidence', 'transferability limits'],
      finalStructure: ['growth overview', 'timeline', 'milestone tactics', 'mechanisms', 'evidence strength', 'transferable playbook', 'non-transferable context'],
      qaCriteria: ['timeline explicit', 'milestones explicit', 'mechanism per milestone', 'transferability separated'],
      switchSignals: ['many independent cases', 'current GTM recommendation dominates', 'market map dominates']
    },
    'Market / Competitive Landscape': {
      slug: 'market-landscape',
      requiredQuestions: ['What category boundary is being used?', 'Which segments matter?', 'Who are direct, indirect, and substitute competitors?', 'What dimensions explain differentiation?', 'Where is the whitespace?'],
      requiredEvidence: ['category definition', 'segmentation evidence', 'competitor/alternative map', 'comparison dimensions', 'market dynamics'],
      finalStructure: ['category definition', 'segments', 'competitor map', 'comparison dimensions', 'market dynamics', 'whitespace', 'positioning implications'],
      qaCriteria: ['category boundary explicit', 'competitors mapped by dimension', 'whitespace caveated', 'positioning implications included'],
      switchSignals: ['single strategic decision', 'product launch plan dominates', 'technical docs dominate']
    },
    'Technical / Implementation Research': {
      slug: 'technical-implementation',
      requiredQuestions: ['What technical outcome is needed?', 'What environment and constraints apply?', 'Which official docs define behavior?', 'What is the minimal implementation path?', 'How will it be verified?'],
      requiredEvidence: ['official docs', 'version/environment assumptions', 'implementation steps', 'edge cases', 'verification plan'],
      finalStructure: ['goal and environment', 'official source summary', 'architecture or integration approach', 'implementation steps', 'edge cases and security', 'verification plan'],
      qaCriteria: ['official docs prioritized', 'version assumptions stated', 'verification concrete', 'no invented APIs or flags'],
      switchSignals: ['non-technical market strategy', 'source-only summarization', 'benchmark synthesis']
    },
    'Source-Heavy Evidence Review': {
      slug: 'source-heavy',
      requiredQuestions: ['What does the source actually claim?', 'Which claims are data, interpretation, recommendation, or rhetoric?', 'What visual/table context matters?', 'Which claims need external verification?', 'What must downstream agents preserve?'],
      requiredEvidence: ['source claim map', 'source scope', 'visual/table notes when relevant', 'external verification needs', 'preservation guidance'],
      finalStructure: ['source scope', 'source claim map', 'evidence and context notes', 'interpretation', 'verification needs', 'downstream preservation guidance'],
      qaCriteria: ['source content preserved', 'document claims separated from verified facts', 'visual/table context preserved when relevant'],
      switchSignals: ['user asks for independent market research', 'implementation problem dominates', 'many-case benchmark dominates']
    },
    'Wide Benchmark To Deep Synthesis': {
      slug: 'wide-benchmark-synthesis',
      requiredQuestions: ['What item set should be included?', 'What shared rubric makes cases comparable?', 'Which cases are strong, weak, outliers, or non-transferable?', 'What pattern appears across cases?', 'What exceptions disprove the simple formula?'],
      requiredEvidence: ['inclusion criteria', 'shared rubric', 'case matrix', 'patterns', 'exceptions/outliers', 'transfer rules'],
      finalStructure: ['inclusion criteria', 'shared rubric', 'case matrix', 'patterns', 'exceptions', 'derived formula/framework', 'application to user context'],
      qaCriteria: ['inclusion criteria explicit', 'rubric explicit', 'patterns derived from cases', 'exceptions included', 'formula bounded'],
      switchSignals: ['single case only', 'technical implementation dominates', 'source preservation only']
    }
  };
  return { name, trigger, ...catalog[name] };
}

function renderResearchArchitectureDecision(architecture, mode, question, filePath) {
  const rejected = Object.keys(architectureCatalogNames())
    .filter((name) => name !== architecture.name)
    .slice(0, 3)
    .join(', ');
  return [
    `- Architecture: ${architecture.name}`,
    `- Why this architecture: the request "${question}" and source \`${filePath}\` matched ${architecture.trigger}; this reasoning shape should govern the final synthesis.`,
    `- Relationship to mode: ${mode.mode} Mode controls breadth; ${architecture.name} controls what questions, evidence, and report structure matter.`,
    `- Rejected architectures: ${rejected || 'none'}.`,
    `- What would make the architecture change: ${architecture.switchSignals.join('; ')}.`,
    `- User confirmation rule: ask and wait if switching architecture would change audience, scope, narrative, output artifact, or recommendation.`
  ].join('\n');
}

function architectureCatalogNames() {
  return {
    'Strategic Decision Research': true,
    'Product / GTM Strategy Research': true,
    'Growth Case Reconstruction': true,
    'Market / Competitive Landscape': true,
    'Technical / Implementation Research': true,
    'Source-Heavy Evidence Review': true,
    'Wide Benchmark To Deep Synthesis': true
  };
}

function renderArchitectureWorkplan(architecture, question, mode) {
  return `| Workplan Field | Requirement |
|---|---|
| Selected architecture | ${architecture.name} |
| Research mode | ${mode.mode} |
| Required questions | ${escapeTable(architecture.requiredQuestions.join(' / '))} |
| Required evidence | ${escapeTable(architecture.requiredEvidence.join(' / '))} |
| Required artifacts | research-contract.md, architecture-decision.md, runtime-subagent-plan.md, subagent-orchestration.md, subagent-results/README.md, subagent-results/_template.md, worker-packets/ac-intent-analyst.md, worker-packets/ac-research-architect.md, worker-packets/ac-*.md, source-map.md, evidence-store.md, question-ledger.md, hypothesis-map.md, red-team-critique.md, synthesis-plan.md, research-quality-control-plan.md |
| Final synthesis structure | ${escapeTable(architecture.finalStructure.join(' -> '))} |
| QA criteria | ${escapeTable(architecture.qaCriteria.join(' / '))} |
| Current task framing | ${escapeTable(question)} |`;
}

function renderResearchQualityControlPlan(question, architecture, mode) {
  return `## Purpose

Before report composition, evaluate whether the research package is strong enough to become a market-intelligence / corporate research standard Markdown report.

## Required Quality-Control Role

- Role: \`ac-research-quality-controller\`
- Expected result: \`research/subagent-results/ac-research-quality-controller.md\`
- Run after evidence, analysis, critique, and synthesis-planning roles.
- Run before \`ac-report-composer\`.
- This result must be a complete quality-control artifact, not a short approval note.

## Minimum Completeness

- Evaluate every available canonical role result.
- Include at least five meaningful why-questions for strategy, market, product, GTM, growth, or positioning work.
- Include material-utilization review for source map, evidence store, claim verification map, question ledger, red-team critique, synthesis plan, and subagent results.
- State whether the final report can be improved from existing materials before requesting new research.
- If no repair is needed, explain why no repair is needed for each major material category.
- Provide explicit instructions for \`ac-report-composer\`.

## Evaluation Order

1. Check the user intent and research contract for outcome-changing assumptions.
2. Read \`source-map.md\`, \`evidence-store.md\`, \`claim-verification-map.md\`, \`question-ledger.md\`, \`red-team-critique.md\`, \`synthesis-plan.md\`, and all available \`subagent-results/ac-*.md\`.
3. Evaluate each role for intent fit, evidence quality, specificity, mechanism depth, counterargument strength, and handoff usefulness.
4. Identify missing "why" questions: why this audience, why this mechanism, why now, why not alternatives, why this recommendation changes action.
5. Decide whether the next improvement comes from existing materials, targeted new research, asking the user, or caveating.
6. Create repair packets before report composition when the synthesis is thin or underuses collected material.

## Repair Decision Tree

| Condition | Action |
|---|---|
| Existing artifacts contain unused evidence or sharper mechanisms | Repair from existing material before more research. |
| A claim is important but unsupported by current material | Run a narrow targeted research pass. |
| The answer depends on user-known intent, audience, or artifact use | Ask the user and wait. |
| The gap cannot be closed by desk research | Mark as Validate Later with caveat. |

## Current Run Frame

- Question: ${escapeTable(question)}
- Architecture: ${architecture.name}
- Mode: ${mode.mode}
- Quality-control goal: prevent plausible but shallow synthesis; force why-depth and material utilization before final report.`;
}

function renderResearchEvaluationTemplate() {
  return `# Research Role Evaluation: ac-<role>

## Verdict

- Pass / Repair / Targeted research / Ask user

## Evaluation

| Dimension | Score | Notes |
|---|---|---|
| Intent fit |  |  |
| Evidence quality |  |  |
| Specificity |  |  |
| Why-depth |  |  |
| Counterargument |  |  |
| Handoff usefulness |  |  |

## Missing Why Questions

| Question | Why it matters | Action |
|---|---|---|
|  |  |  |

## Underused Materials

-

## Repair Instruction

-

## Existing-Material Repair Check

- Can this be improved without new research: yes/no/partial
- Existing material to promote:
- Exact report section to strengthen:
`;
}

function renderResearchRepairPacketTemplate() {
  return `# Research Repair Packet: ac-<role-or-composer>

## Repair Target

- Role or artifact:

## Problem

-

## Existing Materials To Use First

-

## Targeted New Research Only If Needed

-

## Required Improvement

-

## Stop Condition

-
`;
}

function renderHypothesisMap(architecture, question, claimReviews) {
  const weakClaim = claimReviews.find((claim) => claim.status !== 'Supported')?.claim || 'the current interpretation';
  const supportedClaim = claimReviews.find((claim) => claim.status === 'Supported' || claim.status === 'Partially supported')?.claim || 'the source material';
  const rows = [
    `| The right synthesis should follow ${escapeTable(architecture.name)}. | Request wording and selected mode. | Another architecture may fit if user intent differs. | Medium | User confirms a different decision, audience, or deliverable. |`,
    `| ${escapeTable(supportedClaim)} can anchor the current answer. | Local evidence scan and source structure. | External browsing and counterevidence were not run by this CLI. | Medium | Stronger external or opposing evidence contradicts it. |`,
    `| ${escapeTable(weakClaim)} needs caution before becoming a recommendation. | Claim verification map. | It may be validated by stronger primary sources. | Low | Primary or high-trust sources verify it. |`
  ];
  if (architecture.slug === 'product-gtm') {
    rows.push('| The best answer depends on a sharp target, offer, channel, loop, experiment, and metric. | Product/GTM architecture requirements. | If the task is only descriptive, this may be too action-oriented. | Medium | User says they need a source summary rather than a GTM decision. |');
  }
  if (architecture.slug === 'growth-case') {
    rows.push('| Growth can be explained through inflection points and mechanisms rather than chronology alone. | Growth reconstruction architecture. | Public evidence may not reveal early manual tactics. | Medium | Founder interviews, archives, or primary data show different drivers. |');
  }
  if (architecture.slug === 'wide-benchmark-synthesis') {
    rows.push('| A useful formula must be derived from comparable cases and exceptions. | Benchmark synthesis architecture. | Case selection may be biased or incomplete. | Medium | New cases break the pattern or change the rubric. |');
  }
  return rows.join('\n');
}

function renderRedTeamCritique(architecture, question, claimReviews) {
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported').slice(0, 3);
  const rows = [
    `| Architecture mismatch | ${escapeTable(architecture.name)} may not match the user's hidden intent. | Ask and wait if the architecture changes the output direction. | Open |`,
    '| Local-only evidence | This CLI scaffold does not browse or verify current external facts. | Treat public, market, competitor, legal, security, and user-demand claims as gaps until checked. | Open |',
    '| First plausible story bias | The first coherent mechanism may crowd out counterevidence. | Run a counterfactual pass before public or high-stakes delivery. | Open |'
  ];
  for (const item of unresolved) {
    rows.push(`| Weak claim: ${escapeTable(item.claim)} | ${escapeTable(item.evidence)} | ${escapeTable(item.treatment)} | Open |`);
  }
  if (architecture.slug === 'product-gtm') {
    rows.push('| Premature GTM certainty | Desk research cannot prove willingness to pay, retention, or conversion. | Mark these as Validate Later unless user data or experiments exist. | Open |');
  }
  if (architecture.slug === 'wide-benchmark-synthesis') {
    rows.push('| Pattern overfitting | The formula may describe selected winners rather than a general rule. | Include exceptions/outliers and transfer limits. | Open |');
  }
  return rows.join('\n');
}

function renderSynthesisPlan(architecture, question, mode, claimReviews) {
  const safe = claimReviews.filter((claim) => claim.status === 'Supported' || claim.status === 'Partially supported').slice(0, 3).map((claim) => claim.claim);
  const caveat = claimReviews.filter((claim) => claim.status !== 'Supported').slice(0, 3).map((claim) => claim.claim);
  return [
    `- Narrative spine: answer "${question}" through ${architecture.name}, while preserving evidence boundaries.`,
    `- Mode-specific execution: ${mode.mode} Mode determines whether the work stays deep, goes wide, or combines broad coverage with deep synthesis.`,
    `- Sections to include: ${architecture.finalStructure.join(' -> ')}.`,
    `- Claims safer to use: ${safe.length ? safe.join(' / ') : 'none yet; keep the answer cautious.'}`,
    `- Claims to caveat: ${caveat.length ? caveat.join(' / ') : 'no major weak claim detected locally, but external counterevidence remains unchecked.'}`,
    `- Evidence to keep in appendix/source map: source map, evidence store, claim verification map, question ledger, hypothesis map, red-team critique.`,
    `- Downstream preservation rule: report-writer, web-builder, and ppt-builder should preserve the selected architecture instead of flattening the research into generic bullets or presentation copy.`
  ].join('\n');
}

function renderDepthStandard(question) {
  return `| Standard | Requirement |
|---|---|
| Report depth | Treat this as a market-intelligence / corporate research report, not a short web page, slide outline, or chat answer. |
| Standalone value | The Markdown report must be useful on its own before any PPT, HTML, email, or summary artifact is created. |
| Required depth dimensions | audience and decision context; methodology and source policy; market/category map; customer or segment hypotheses; competitor/substitute logic; mechanism analysis; benchmarks; evidence confidence; caveats; risks; execution implications; source map; downstream handoff. |
| No compression rule | Do not shrink the research merely because a downstream artifact was requested. A web page or deck is a separate translation layer. |
| Current request framing | ${escapeTable(question)} |`;
}

function renderResearchContract(project, question, filePath, mode) {
  return `| Field | Value |
|---|---|
| Objective | Answer the research question with evidence, mechanism analysis, uncertainty, and practical implications. |
| User decision or next action | Help the user decide how to understand, use, present, or act on the source material. |
| Audience | Not specified; assume the user and downstream Agent Computer agents. |
| Output artifact | Deep research report plus reusable research artifacts under \`workspace/projects/${project}/research/\`. |
| Scope | Provided source, local workspace context, claim extraction, and local evidence scan. |
| Exclusions | Current web browsing, private connectors, interviews, and external account data are not performed by this local CLI. |
| Freshness requirement | External freshness is unknown until the runtime agent browses or checks current sources. |
| Source priority | User-provided source first; local workspace evidence second; runtime agent should use Tier 1 external sources for consequential claims. |
| Private/local source permissions | Local workspace files only. Private connectors require explicit user approval. |
| Depth or coverage budget | ${mode.mode} Mode scaffold; runtime agent should continue N-pass research until the stop condition is reached. |
| Uncertainty threshold | Claims without direct local or external support must be marked as gaps, hypotheses, or validation needs. |
| Confirmation gates | Ask and wait before changing the core research direction, audience, output artifact, or evidence strategy. |
| Stop condition | Stop after creating the local research scaffold; continue in runtime when external evidence or user direction is needed. |
| Downstream handoff | Report, PPT, email, or strategy agents should use the source map, evidence store, claim map, and question ledger. |

Research question: ${question}

Primary source: \`${filePath}\``;
}

function renderResearchSourcePolicy(mode) {
  return `| Tier | Source type | How it is used |
|---|---|---|
| Tier 1 | Official/company docs, filings, primary data, original interviews, product docs, academic papers, legal docs | Required for consequential factual claims when available. |
| Tier 2 | Trusted media, respected industry analysis, reputable expert writing | Used for context, interpretation, and cross-checking. |
| Tier 3 | Personal blogs, forums, social posts, community discussions | Used only as weak signals or leads. |
| User-provided | Local files, PDFs, notes, internal documents | Preserved as source material; claims remain document claims until externally verified. |
| Private connectors | Email, calendar, Drive, Slack, CRM, account data | Not used unless the user explicitly grants permission and scope. |

- Selected mode implication: ${mode.mode} Mode should ${mode.mode === 'Wide' ? 'apply the same source policy to every item.' : mode.mode === 'Hybrid' ? 'validate broad case evidence before deriving the synthesis.' : 'prioritize claim depth, contradiction checks, and source trust over broad coverage.'}
- Local CLI boundary: external browsing was not run.`;
}

function renderEvidenceStoreRows(primaryPath, facts, evidenceItems, claimReviews) {
  const rows = [];
  const factList = facts.slice(0, 6);
  factList.forEach((fact, index) => {
    rows.push(`| E${index + 1} | ${escapeTable(fact)} | \`${primaryPath}\` | User-provided | Medium | Extracted from the primary workspace source; externally unverified. |`);
  });
  const offset = rows.length;
  evidenceItems.slice(0, 6).forEach((item, index) => {
    rows.push(`| E${offset + index + 1} | ${escapeTable(item.excerpt || 'Local supporting context')} | \`${item.path}\` | User-provided | Medium | Local workspace evidence checked for support, contradiction, or context. |`);
  });
  if (!rows.length && claimReviews.length) {
    rows.push(`| E1 | ${escapeTable(claimReviews[0].claim)} | primary source | User-provided | Low | Claim extracted but evidence remains weak. |`);
  }
  return rows.length ? rows.join('\n') : '| E1 | No atomic evidence extracted | primary source | User-provided | Low | Ask for more source material or run external research. |';
}

function renderTargetedRetryLog(mode, claimReviews) {
  const weak = claimReviews.filter((claim) => claim.status !== 'Supported').slice(0, 8);
  if (!weak.length) {
    return '| Item or claim | Why it is weak | Retry action | Status |\n|---|---|---|---|\n| Counterevidence search | No weak local claim detected, but external counterevidence was not checked. | Runtime agent should search for disconfirming sources if the answer will be public or high-impact. | Deferred |';
  }
  const rows = weak.map((claim) => {
    const action = mode.mode === 'Wide'
      ? 'Re-run the item with a stricter source policy and fill missing schema fields.'
      : mode.mode === 'Hybrid'
        ? 'Check primary sources, then decide whether this changes the pattern synthesis.'
        : 'Run a focused next pass with primary sources, opposing evidence, or expert context.';
    return `| ${escapeTable(claim.claim)} | ${escapeTable(claim.evidence)} | ${action} | Not started |`;
  });
  return ['| Item or claim | Why it is weak | Retry action | Status |', '|---|---|---|---|', ...rows].join('\n');
}

function renderWorkerPacketTemplate(mode, question) {
  const itemLabel = mode.mode === 'Hybrid' ? 'Case or example' : 'Item';
  return `## Worker Packet Template

| Field | Value |
|---|---|
| Job ID | item-001 |
| ${itemLabel} |  |
| Task | Research this item under the shared rubric for: ${escapeTable(question)} |
| Source policy | Tier 1 first, Tier 2 for context, Tier 3 only as weak signals. |
| Max sources | 3-5 per item unless the user sets another budget. |
| Output schema | summary, facts, sources, confidence, unknowns, transferable lesson. |

## Rubric

- Audience or target user
- Initial wedge or problem
- Distribution/discovery mechanism
- Evidence-backed metric or signal
- Monetization or operating model when relevant
- Risks, counterevidence, or uncertainty
- Transferable lesson

## Required Output

| Field | Value |
|---|---|
| Summary |  |
| Facts |  |
| Sources |  |
| Confidence | High / Medium / Low |
| Unknowns |  |
| Transferable lesson |  |`;
}

function renderResearchQa(question, mode, architecture, evidenceItems, claimReviews) {
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported');
  const hasExternalBoundary = true;
  return `# Research QA

## Question

${question}

## Mode

- Selected mode: ${mode.mode}
- Mode reason: ${mode.reason}

## Architecture

- Selected architecture: ${architecture.name}
- Architecture trigger: ${architecture.trigger}
- Required QA criteria: ${architecture.qaCriteria.join(' / ')}

## Checks

| Check | Result | Notes |
|---|---:|---|
| Research contract present | PASS | Written as \`research-contract.md\`. |
| Architecture decision present | PASS | Written as \`architecture-decision.md\`. |
| Source policy present | PASS | Included in report and contract. |
| Question ledger present | PASS | Written as \`question-ledger.md\`. |
| Hypothesis map present | PASS | Written as \`hypothesis-map.md\`. |
| Red-team critique present | PASS | Written as \`red-team-critique.md\`. |
| Synthesis plan present | PASS | Written as \`synthesis-plan.md\`. |
| Question-to-synthesis trace present | PASS | Final report includes question routing lanes, questions that changed the recommendation, assumptions, and evidence confidence. |
| Evidence store present | PASS | Written as \`evidence-store.md\`. |
| Claim verification map present | PASS | Written as \`claim-verification-map.md\`. |
| Local evidence checked | PASS | ${evidenceItems.length + 1} local source(s), including the primary input. |
| External browsing boundary stated | ${hasExternalBoundary ? 'PASS' : 'FAIL'} | Local CLI does not perform web research. |
| Unresolved claims visible | ${unresolved.length ? 'PASS' : 'PASS'} | ${unresolved.length} claim(s) need validation, retry, or counterevidence checks. |

## Verdict

Passes local deep-research scaffold QA. Runtime deep research should continue with external sources when current facts, public claims, market evidence, competitor evidence, security, legal, or user-demand claims matter.
`;
}

function renderDownstreamHandoff(mode, architecture, topic, claimReviews) {
  const safe = claimReviews.filter((claim) => claim.status === 'Supported' || claim.status === 'Partially supported').slice(0, 4);
  const risky = claimReviews.filter((claim) => claim.status !== 'Supported').slice(0, 4);
  return [
    `- Recommended next agent: report-writer for a decision-ready report; web-builder only after the full report exists if the user asks for HTML/web output; ppt-builder if the user asks for an editable deck; image-deck-maker if the user asks for a full-slide generated image deck; visual-asset-maker if the user asks for campaign/social/thumbnail assets; email-operator only after claim-safety review.`,
    `- Research mode to preserve: ${mode.mode}.`,
    `- Research architecture to preserve: ${architecture.name}.`,
    `- Artifacts to hand off: \`research-contract.md\`, \`architecture-decision.md\`, \`source-map.md\`, \`evidence-store.md\`, \`claim-verification-map.md\`, \`question-ledger.md\`, \`hypothesis-map.md\`, \`red-team-critique.md\`, \`synthesis-plan.md\`, and \`${topic}_deep-research.md\`.`,
    `- Claims safer to use: ${safe.length ? safe.map((claim) => claim.claim).join(' / ') : 'none yet; use the source material cautiously.'}`,
    `- Claims to avoid or caveat: ${risky.length ? risky.map((claim) => claim.claim).join(' / ') : 'no major weak claims detected locally, but external counterevidence remains unchecked.'}`,
    `- Suggested narrative angle: emphasize mechanisms, evidence boundaries, and what the user can do next.`,
    `- Source/reference layer: preserve source IDs and claim statuses in report appendices, web source sections, speaker notes, or PPT reference slides.`
  ].join('\n');
}

function renderDeepShortAnswer(facts, supported, unresolved) {
  const lead = supported[0]?.claim || facts[0] || 'The source does not yet support a confident deep answer.';
  const evidenceBoundary = unresolved.length
    ? `${unresolved.length} claim(s) remain hypotheses, gaps, or validation needs.`
    : 'No major unresolved claim was detected by the local scan.';
  return `${lead} ${evidenceBoundary} Treat this as a durable local deep-research pass: it maps the source, separates evidence from interpretation, and identifies exactly where runtime external research should continue.`;
}

function renderDeepQuestions(question, source) {
  const questions = [
    `What is the precise decision or understanding behind: "${question}"?`,
    'Which source claims are directly supported by local evidence?',
    'Which claims are hypotheses, gaps, or external facts needing validation?',
    'What mechanism explains why the observed pattern would matter?',
    'What should be done next before turning this into a public report, deck, or launch decision?'
  ];
  if (/growth|marketing|brand|go[-\s]?to[-\s]?market|launch|성장|마케팅|브랜드|출시/i.test(source + question)) {
    questions.push('What growth, positioning, distribution, trust, or adoption mechanism appears to be operating?');
  }
  if (/agent|workspace|computer|codex|claude|AI|워크스페이스|에이전트/i.test(source + question)) {
    questions.push('How does the agent-workspace model change workflow reliability, memory, output traceability, and user trust?');
  }
  return questions.map((item) => `- ${item}`).join('\n');
}

async function readResearchMemory(root) {
  const files = [
    'memory/user-preferences.md',
    'memory/pattern-library.md',
    'memory/context.md'
  ];
  const entries = [];
  for (const rel of files) {
    const text = await readText(resolveWorkspacePath(root, rel), '');
    const lines = text.split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[-*]\s+/.test(line))
      .slice(0, 5);
    if (lines.length) entries.push({ rel, lines });
  }
  return entries;
}

function renderResearchMemoryFrame(memory, question) {
  const memoryLines = memory.length
    ? memory.flatMap((entry) => entry.lines.map((line) => `- \`${entry.rel}\`: ${line.replace(/^[-*]\s+/, '')}`)).join('\n')
    : '- No reusable workspace memory was found for this local pass.';
  return `${memoryLines}

- User's likely job-to-be-done: make a better decision or produce a stronger downstream report/deck from "${question}".
- What would be most useful to answer: the claims, mechanisms, caveats, and next questions that change what the user should do next.
- Working assumption: continue researching under the user's stated question, but ask for direction if the next branch would change the deliverable.`;
}

function renderResearchPassLog(evidenceItems, claimReviews) {
  const unresolvedCount = claimReviews.filter((claim) => claim.status !== 'Supported').length;
  const evidenceCount = Math.max(1, evidenceItems.length + 1);
  return `| Pass | Focus | Sources or evidence checked | What changed | Next question generated |
|---|---|---|---|---|
| Scout | Source structure, claims, and baseline evidence | ${evidenceCount} workspace source(s) | Extracted initial facts, claims, and evidence boundaries | Which unresolved claim would most change the user's next action? |
| Pass 2 candidate | Highest-usefulness unresolved questions | ${unresolvedCount} unresolved or partial claim(s) | Not run by the local CLI; runtime agent should continue if needed | What external source, interview, benchmark, or artifact would verify the key gap? |`;
}

function buildSocraticQuestionSet(question, source, claimReviews, mode) {
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported');
  const firstWeak = unresolved[0]?.claim || 'the strongest current interpretation';
  const text = `${question}\n${source}`;
  const topicMechanism = /growth|marketing|brand|go[-\s]?to[-\s]?market|launch|성장|마케팅|브랜드|출시/i.test(text)
    ? 'growth, positioning, distribution, trust, community, PR, pricing, or founder credibility'
    : /product|제품|서비스|ux|user|사용자/i.test(text)
      ? 'activation, retention, user motivation, product loop, and switching cost'
      : 'mechanism, constraint, incentive, timing, and proof';
  const questions = [
    {
      type: 'Intent',
      lane: 'Ask User Now',
      question: `What decision, action, or change should "${question}" ultimately support?`,
      why: 'Without this, the research can become broad but not useful.',
      action: 'Ask the user if multiple decision contexts are plausible; otherwise state the working assumption.'
    },
    {
      type: 'Intent',
      lane: 'Ask User Now',
      question: 'What would make the user say this research was practically useful rather than merely interesting?',
      why: 'Usefulness should control depth, examples, and final synthesis.',
      action: 'Convert the answer into success criteria for the next research pass.'
    },
    {
      type: 'Evidence',
      lane: 'Research Next',
      question: `What source would verify or falsify "${firstWeak}"?`,
      why: 'The weakest consequential claim should drive the next pass.',
      action: 'Search for primary, official, recent, or opposing evidence before using the claim strongly.'
    },
    {
      type: 'Evidence',
      lane: 'Research Next',
      question: 'Which numbers, dates, benchmarks, or product claims are being repeated without strong source support?',
      why: 'Unsupported specifics create false confidence in reports, decks, and emails.',
      action: 'Move unsupported specifics into the retry log or cite source-backed evidence.'
    },
    {
      type: 'Mechanism',
      lane: 'Research Next',
      question: `Which mechanism actually explains the pattern: ${topicMechanism}?`,
      why: 'Mechanism choice changes what should be benchmarked and what the user can copy.',
      action: 'Compare evidence for each plausible mechanism and name the strongest one.'
    },
    {
      type: 'Mechanism',
      lane: 'Research Next',
      question: 'For whom does this mechanism work, and under what constraints would it fail?',
      why: 'A good strategic answer needs boundary conditions, not only a positive case.',
      action: 'Look for segment, timing, channel, capability, and adoption constraints.'
    },
    {
      type: 'Counterfactual',
      lane: 'Research Next',
      question: 'What evidence would make the current interpretation wrong or too narrow?',
      why: 'Counterevidence prevents the first plausible story from becoming the final story.',
      action: 'Run a disconfirming-source pass before final recommendation.'
    },
    {
      type: 'Counterfactual',
      lane: 'Assume And Proceed',
      question: `If ${mode.mode} Mode is wrong, what mode should replace it and why?`,
      why: 'Research mode affects coverage, source strategy, and output shape.',
      action: 'Switch mode only after confirming the new contract or explaining the assumption.'
    },
    {
      type: 'Transfer',
      lane: 'Assume And Proceed',
      question: 'What should the user do differently next week if this research is true?',
      why: 'Deep research should change action, messaging, product, or validation priorities.',
      action: 'Translate findings into tests, decisions, roadmap moves, or narrative choices.'
    },
    {
      type: 'Transfer',
      lane: requiresBehaviorValidation(text) ? 'Validate Later' : 'Assume And Proceed',
      question: 'Which finding belongs in the main narrative, which belongs in an appendix, and which belongs in a caution box?',
      why: 'This prevents downstream report or PPT agents from flattening nuance.',
      action: 'Tag findings by main claim, support, appendix, limitation, or open question.'
    },
    {
      type: 'Handoff',
      lane: 'Assume And Proceed',
      question: 'What must the next agent preserve so it does not overclaim or over-compress the research?',
      why: 'Report, PPT, and email agents need evidence boundaries and narrative intent.',
      action: 'Hand off source map, evidence store, claim map, and narrative caution notes.'
    },
    {
      type: 'Handoff',
      lane: 'Ask User Now',
      question: 'What exact user-facing question should be asked before downstream work continues?',
      why: 'Some choices are strategic and should not be silently decided by the agent.',
      action: 'Ask and wait if the answer changes audience, scope, output, or claim strength.'
    }
  ];
  return questions;
}

function renderSocraticQuestionEngine(questionSet) {
  return questionSet.map((item) => `| ${item.type} | ${item.lane || classifyQuestionLane(item)} | ${escapeTable(item.question)} | ${escapeTable(item.why)} | ${escapeTable(item.action)} |`).join('\n');
}

function renderQuestionRoutingLanes(questionSet, source, question) {
  const lanes = ['Ask User Now', 'Research Next', 'Assume And Proceed', 'Validate Later'];
  const rows = [];
  for (const lane of lanes) {
    const items = questionSet.filter((item) => (item.lane || classifyQuestionLane(item)) === lane);
    const required = lane === 'Ask User Now'
      ? 'Ask clearly, then stop and wait if the answer would change the work.'
      : lane === 'Research Next'
        ? 'Turn into the next source, local-file, counterevidence, or retry action.'
        : lane === 'Assume And Proceed'
          ? 'State the assumption in the final output and avoid presenting it as fact.'
          : requiresBehaviorValidation(`${source}\n${question}`)
            ? 'Keep as future validation for behavior, conversion, retention, sales, pricing, or implementation.'
            : 'Not required for this task unless real-world behavior must prove the claim.';
    rows.push(`| ${lane} | ${escapeTable(items.map((item) => item.question).join(' / ') || 'None for this pass.')} | ${escapeTable(required)} |`);
  }
  return rows.join('\n');
}

function renderSelectedNextBestQuestion(questionSet, claimReviews) {
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported');
  const selected = unresolved.length
    ? questionSet.find((item) => item.type === 'Evidence')
    : questionSet.find((item) => item.type === 'Counterfactual');
  return `- Question: ${selected.question}
- Why this question now: ${selected.why}
- Answer through research or ask user: answer through research unless this changes the user's research contract.
- Next sources/actions: ${selected.action}
- If asking user becomes necessary: ask one concise direction-setting question and wait.`;
}

function renderQuestionsThatChangedRecommendation(questionSet, claimReviews, mode) {
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported');
  const rows = [];
  const evidenceQ = questionSet.find((item) => item.type === 'Evidence');
  const mechanismQ = questionSet.find((item) => item.type === 'Mechanism');
  const counterQ = questionSet.find((item) => item.type === 'Counterfactual');
  const transferQ = questionSet.find((item) => item.type === 'Transfer');
  if (evidenceQ) {
    rows.push(`| ${escapeTable(evidenceQ.question)} | Weak or unverified claims are kept out of the strongest recommendation and moved into evidence gaps, retry, or caveats. | ${escapeTable(unresolved[0]?.evidence || 'Local evidence scan and claim verification map.')} |`);
  }
  if (mechanismQ) {
    rows.push(`| ${escapeTable(mechanismQ.question)} | The synthesis prioritizes mechanism and boundary conditions instead of producing a flat summary. | ${escapeTable(`${mode.mode} Mode, source structure, and extracted claims.`)} |`);
  }
  if (counterQ) {
    rows.push(`| ${escapeTable(counterQ.question)} | The recommendation is framed with counterevidence risk and avoids overclaiming when disconfirming sources were not checked. | ${escapeTable('Counterfactual question lane and targeted retry log.')} |`);
  }
  if (transferQ) {
    rows.push(`| ${escapeTable(transferQ.question)} | Findings are translated into next actions, downstream handoff rules, or validation-later items instead of remaining descriptive. | ${escapeTable('User-usefulness loop and downstream handoff.')} |`);
  }
  return rows.length ? rows.join('\n') : '| No recommendation-changing question detected | The output remains a first-pass scaffold. | Ask for more context or run another research pass. |';
}

function renderAssumptionsBeingCarried(question, source, claimReviews, evidenceItems = []) {
  const explicit = findArtifactSection([source, ...evidenceItems.map((item) => item.text)], 'Assumptions Being Carried')
    || findArtifactSection([source, ...evidenceItems.map((item) => item.text)], 'Key Assumptions');
  const unresolvedCount = claimReviews.filter((claim) => claim.status !== 'Supported').length;
  const assumptions = [
    `The output should optimize for the user's stated question: "${question}".`,
    'Local workspace evidence can support a first-pass synthesis, but external browsing is not performed by this CLI command.',
    `${unresolvedCount} claim(s) remain unsupported, partial, or hypothetical until checked with stronger sources.`
  ];
  if (requiresBehaviorValidation(`${source}\n${question}`)) {
    assumptions.push('User behavior, willingness to pay, retention, conversion, or implementation claims require future validation rather than desk-research certainty.');
  }
  const generated = assumptions.map((item) => `- ${item}`).join('\n');
  return explicit ? `${explicit}\n\n${generated}` : generated;
}

function renderEvidenceConfidence(primaryPath, evidenceItems, claimReviews) {
  const artifactRows = renderEvidenceConfidenceFromArtifacts(evidenceItems);
  if (artifactRows) return artifactRows;
  const rows = [];
  const sampled = claimReviews.slice(0, 6);
  for (const item of sampled) {
    const confidence = item.status === 'Supported' ? 'High'
      : item.status === 'Partially supported' ? 'Medium'
        : item.status === 'Hypothesis' ? 'Low'
          : 'Low';
    rows.push(`| ${escapeTable(item.claim)} | ${escapeTable(item.evidence || primaryPath)} | ${confidence} | ${escapeTable(item.treatment)} |`);
  }
  if (!rows.length) {
    rows.push(`| Primary source material | \`${escapeTable(primaryPath)}\` | Medium | Treat as user-provided source material unless externally verified. |`);
  }
  if (evidenceItems.length) {
    rows.push(`| Local supporting files | ${escapeTable(evidenceItems.slice(0, 3).map((item) => item.path).join(' / '))} | Medium | Local evidence improves traceability but may not verify current external facts. |`);
  }
  return rows.join('\n');
}

function renderValidationLaterItems(source, question, claimReviews) {
  if (!requiresBehaviorValidation(`${source}\n${question}`)) {
    return '- Not required by default for this task. Add validation-later items only if a claim depends on real-world behavior or implementation.';
  }
  const likely = claimReviews.filter((item) => /user|사용자|market|시장|price|가격|retention|conversion|paid|subscription|launch|go[-\s]?to[-\s]?market|growth|sales|implementation|구독|전환|출시|성장/i.test(item.claim)).slice(0, 5);
  const rows = ['| Item | Why desk research is not enough | Later validation signal |', '|---|---|---|'];
  if (likely.length) {
    for (const item of likely) {
      rows.push(`| ${escapeTable(item.claim)} | ${escapeTable(item.treatment)} | User behavior, interviews, beta usage, pricing response, retention, conversion, sales, or implementation evidence. |`);
    }
  } else {
    rows.push('| User response or implementation claim | Desk research can suggest the direction but cannot prove behavior. | Pilot usage, retention, conversion, pricing response, sales feedback, or implementation result. |');
  }
  return rows.join('\n');
}

function classifyQuestionLane(item) {
  if (item.type === 'Evidence' || item.type === 'Mechanism' || item.type === 'Counterfactual') return 'Research Next';
  if (item.type === 'Intent') return 'Ask User Now';
  if (item.type === 'Transfer') return 'Assume And Proceed';
  return 'Assume And Proceed';
}

function requiresBehaviorValidation(text) {
  return /product|market|positioning|go[-\s]?to[-\s]?market|gtm|launch|pricing|retention|conversion|monetization|sales|user|customer|onboarding|growth|strategy|business model|제품|시장|포지셔닝|출시|가격|리텐션|전환|수익|사용자|고객|온보딩|성장|전략|비즈니스 모델/i.test(String(text || ''));
}

function renderQuestionLedger(question, source, claimReviews, questionSet = []) {
  const rows = [];
  for (const item of questionSet) {
    const status = item.type === 'Evidence' || item.type === 'Counterfactual' ? 'Unresolved' : 'New';
    const evidence = item.type === 'Intent' ? 'User request and working contract' : item.type === 'Handoff' ? 'Downstream artifact needs' : 'Question engine';
    rows.push(`| ${escapeTable(item.question)} | ${escapeTable(item.why)} | ${status} | ${escapeTable(evidence)} | ${escapeTable(item.action)} |`);
  }
  rows.push(`| What is the real decision behind "${escapeTable(question)}"? | Keeps the research useful instead of merely comprehensive. | New | User request and source frame | Ask the user if multiple decision paths are plausible; otherwise state the working assumption. |`);
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported').slice(0, 4);
  for (const claim of unresolved) {
    rows.push(`| What would verify or falsify "${escapeTable(claim.claim)}"? | This may change confidence, recommendation strength, or deck/report wording. | Unresolved | Local evidence scan | Run another pass with external sources or approved project artifacts. |`);
  }
  if (/growth|marketing|brand|go[-\s]?to[-\s]?market|launch|성장|마케팅|브랜드|출시/i.test(source + question)) {
    rows.push('| Which mechanism matters most: product, timing, distribution, trust, community, PR, pricing, or founder credibility? | Mechanism choice changes what can be benchmarked. | New | Topic signal | Prioritize the mechanism with the strongest evidence and practical transfer value. |');
  }
  if (!unresolved.length) {
    rows.push('| What counterevidence would weaken the current answer? | Prevents overconfidence when local evidence looks clean. | New | No unresolved local claims detected | Search for disconfirming sources in the next runtime pass. |');
  }
  return rows.join('\n');
}

function renderUserCheckpoints(question, claimReviews) {
  const unresolvedCount = claimReviews.filter((claim) => claim.status !== 'Supported').length;
  const ask = unresolvedCount
    ? 'The next useful user question is which unresolved claim or mechanism matters most for the intended deliverable.'
    : 'The next useful user question is whether to search for counterevidence or proceed to synthesis.';
  return `- Questions asked to the user in this local CLI pass: none.
- Assumptions made when continuing: the report should prioritize usefulness for "${question}" and clearly mark evidence gaps.
- Direction chosen and why: create a reusable research scaffold first, then let the runtime agent continue the N-pass loop with external evidence.
- Next user checkpoint: ${ask}`;
}

function renderNextResearchPass(question, claimReviews) {
  const unresolved = claimReviews.find((claim) => claim.status !== 'Supported');
  if (unresolved) {
    return `- Highest-value next question: What evidence would verify or falsify "${unresolved.claim}"?
- Why it would help: it would change confidence, wording, and the user's next action.
- What sources or actions to check next: primary sources, recent external evidence, opposing accounts, interviews, benchmarks, or approved prior project artifacts.
- Whether user direction is needed: ask if several unresolved questions compete for attention; otherwise continue with the highest-risk claim.`;
  }
  return `- Highest-value next question: What counterevidence or missing perspective could weaken the current answer?
- Why it would help: it prevents a clean local source scan from becoming overconfident.
- What sources or actions to check next: external sources, competitor examples, user interviews, implementation evidence, or critical reviews.
- Whether user direction is needed: only if the user has a specific benchmark, audience, or decision context in mind.`;
}

function renderWhyStopHere(claimReviews) {
  const unresolvedCount = claimReviews.filter((claim) => claim.status !== 'Supported').length;
  return `- Stop condition reached: local CLI pass completed its source/evidence scaffold.
- Confidence level: ${unresolvedCount ? 'medium-low until unresolved claims are checked externally' : 'medium for local-source analysis, still limited without external counterevidence'}.
- Remaining risk: runtime external research may change the mechanism analysis, confidence levels, or recommendations.`;
}

function renderDeepData(facts, headings) {
  const lines = [];
  if (facts.length) lines.push(...facts.slice(0, 8).map((fact) => `- ${fact}`));
  lines.push('- Source structure observed:');
  lines.push(...headings.split('\n').slice(0, 12));
  return lines.join('\n');
}

function renderDeepInformation(claimReviews) {
  if (!claimReviews.length) return '- No claim-level information could be extracted from the source.';
  return claimReviews.slice(0, 10).map((item) => `- ${item.status}: ${item.claim}`).join('\n');
}

function renderDeepKnowledge(source, claimReviews) {
  const supported = claimReviews.filter((item) => item.status === 'Supported' || item.status === 'Partially supported');
  const gaps = claimReviews.filter((item) => item.status === 'Confirmed gap' || item.status === 'Needs validation' || item.status === 'Hypothesis');
  const lines = [
    `- External/local knowledge boundary: this CLI pass uses workspace evidence only; it does not browse the web.`,
    `- Supported or partially supported claims can form the current narrative spine: ${supported.length}.`,
    `- Gaps, hypotheses, or validation needs should become follow-up research tasks: ${gaps.length}.`,
    `- Mechanism hypothesis: ${interpret(source)}`
  ];
  return lines.join('\n');
}

function renderDeepInsight(question, claimReviews) {
  const gaps = claimReviews.filter((item) => item.status === 'Confirmed gap' || item.status === 'Needs validation' || item.status === 'Hypothesis');
  const supported = claimReviews.filter((item) => item.status === 'Supported' || item.status === 'Partially supported');
  if (gaps.length && supported.length) {
    return `The strongest path is to use the supported claims as the answer to "${question}" while explicitly moving ${gaps.length} weaker claim(s) into a validation queue. This prevents the research from sounding more certain than the evidence allows.`;
  }
  if (supported.length) {
    return `The source has enough supported material for a first recommendation, but runtime external research should still test whether the same pattern holds outside the workspace.`;
  }
  return `The source is not yet strong enough for a confident answer. The useful output is a research agenda, not a conclusion.`;
}

function renderDeepFindings(claimReviews, facts) {
  if (!claimReviews.length) return bulletList(facts.slice(0, 8));
  const rows = claimReviews.slice(0, 8).map((item) => `- ${item.status}: ${item.claim}`);
  if (claimReviews.length > rows.length) rows.push(`- ${claimReviews.length - rows.length} additional claim(s) are preserved in the verification map above.`);
  return rows.join('\n');
}

function renderMechanismAnalysis(source, claimReviews) {
  const base = interpret(source);
  const supportedCount = claimReviews.filter((item) => item.status === 'Supported' || item.status === 'Partially supported').length;
  const gapCount = claimReviews.length - supportedCount;
  const mechanism = `${base} The likely mechanism is: source material creates a reusable artifact; local evidence anchors what can be claimed; unresolved claims are routed into explicit research or QA tasks; and downstream agents can then build reports, decks, or next actions without losing provenance.`;
  return `${mechanism} In this pass, ${supportedCount} claim(s) are usable with evidence or caveats, while ${gapCount} claim(s) need validation before confident delivery.`;
}

function renderDeepImplications(project, claimReviews) {
  const lines = [
    `- Store follow-up research under \`projects/${project}/research/\` so later agents can reuse it.`,
    '- Use supported claims for the main story; keep weak claims visibly labeled.',
    '- Convert unresolved claims into quick-researcher or deep-dive-researcher tasks before public release.'
  ];
  if (claimReviews.some((item) => /security|privacy|보안|개인정보|install|설치/i.test(item.claim))) {
    lines.push('- Treat security, privacy, and installation claims as release blockers until separately verified.');
  }
  return lines.join('\n');
}

function renderDeepOpenQuestions(claimReviews) {
  const gaps = claimReviews.filter((item) => item.status === 'Confirmed gap' || item.status === 'Needs validation' || item.status === 'Hypothesis');
  if (!gaps.length) {
    return [
      '- Which claims need current external validation before sharing?',
      '- Which audience will use this research, and what decision should it support?',
      '- Should the result become a report, deck, launch plan, or implementation task?'
    ].join('\n');
  }
  return gaps.slice(0, 8).map((item) => `- ${item.claim} -> ${neededEvidence(item.claim)}`).join('\n');
}

export async function writeReport(root, filePath, options = {}) {
  const source = await readText(filePath, undefined);
  const topic = safeTopicName(basename(filePath).replace(/\.[^.]+$/, ''));
  const project = inferProjectSlug(root, filePath, topic);
  const out = projectPath(root, project, 'reports', `${topic}_report.md`);
  const facts = topSentences(source, 8);
  const evidence = await gatherReportEvidence(root, project, filePath);
  const claims = extractClaimUnits(source);
  const claimReviews = claims.map((claim) => reviewClaim(claim, evidence.items));
  const supported = claimReviews.filter((claim) => claim.status === 'Supported' || claim.status === 'Partially supported');
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported');
  const gapRows = claimReviews.filter((claim) => claim.status === 'Confirmed gap' || claim.status === 'Needs validation' || claim.status === 'Hypothesis');
  const reportQuestionTrace = renderReportQuestionTrace(source, claimReviews, evidence.items);
  const reportAssumptions = renderAssumptionsBeingCarried(options.question || topic, source, claimReviews, evidence.items);
  const reportEvidenceConfidence = renderEvidenceConfidence(filePath, evidence.items, claimReviews);
  const body = `# Report

## Audience

${options.audience || 'General reader'}

## Executive Summary

${renderExecutiveSummary(facts, supported, unresolved)}

## Key Message

${keyMessageFromClaims(supported, facts)}

## Context

This report was generated from a source file and a lightweight local evidence scan. It does not perform external browsing. When external facts, market claims, user demand, security, legal, or competitive positioning matter, treat those items as validation gaps unless a cited local source already supports them.

## Evidence Map

| Claim Or Input Item | Evidence Status | Local Evidence Found | Report Treatment |
|---|---|---|---|
${claimReviews.length ? claimReviews.map(renderClaimRow).join('\n') : '| No specific claim extracted | Needs validation | No claim-like lines found in the source. | Preserve source and request more context. |'}

## Claim-Evidence-Confidence-Caveat Matrix

| Claim | Evidence | Confidence | Caveat | Decision Use |
|---|---|---|---|---|
${renderClaimEvidenceConfidenceCaveatMatrix(claimReviews)}

## Evidence Gaps Checked

- Source length: ${source.length} characters
- Has explicit source/evidence language: ${/source|evidence|출처|근거/i.test(source) ? 'yes' : 'no'}
- Has structured headings: ${extractHeadings(source).length ? 'yes' : 'no'}
- Claim-like source items extracted: ${claims.length}
- Local evidence files checked: ${evidence.items.length}
- Supported or partially supported items: ${supported.length}
- Unresolved, hypothetical, or gap items: ${unresolved.length}

## Gaps Filled

${renderGapsFilled(evidence.items, supported)}

## Remaining Gaps

${renderRemainingGaps(gapRows)}

## Questions That Changed The Recommendation

${reportQuestionTrace}

## Assumptions Being Carried

${reportAssumptions}

## Evidence Confidence / Claim-Evidence-Confidence-Caveat Matrix

| Claim | Evidence | Confidence | Caveat |
|---|---|---|---|
${reportEvidenceConfidence}

## Findings

${renderFindings(claimReviews, facts)}

## Analysis

${renderReportAnalysis(source, claimReviews)}

## Risk Register

${renderRiskRegister(claimReviews)}

## Recommendations

${renderReportRecommendations(project, claimReviews)}

## Next Actions

${renderNextActions(root, out, claimReviews)}

## Evidence Notes

- Source: \`${filePath}\`
${evidence.items.map((item) => `- Local evidence checked: \`${item.path}\``).join('\n')}
- External browsing: not performed by this local CLI report command.

## Source-Preserved Appendix

The source material is preserved below so the report-writing step does not silently remove content. Edit, condense, or delete this appendix only when the user explicitly asks for a shorter deliverable.

${source}
`;
  await writeText(out, body);
  return { file: out, text: `Wrote ${out}` };
}

export async function writeEmailPackage(root, options) {
  const topic = safeTopicName(redactEmailsForStorageName(options.purpose));
  const out = projectPath(root, topic, 'reports', `${topic}_email-package.md`);
  const recipientResolution = await resolveEmailRecipient(root, options.recipient || 'Recipient');
  const recipient = recipientResolution.greetingName || 'there';
  const recipientLabel = recipientResolution.reportLabel || 'Recipient';
  const tone = options.tone || 'clear and professional';
  const purpose = options.purpose || 'follow up';
  const cta = inferEmailCta(purpose);
  const contextBullets = inferEmailContext(purpose);
  const relationship = inferRelationship(recipient, purpose);
  const subjectOptions = subjectOptionsFor(purpose);
  const attachmentPlan = inferAttachmentPlan(purpose);
  const topicLabel = emailTopicLabel(purpose);
  const connector = emailConnectorStatus(options);
  const followUpDelay = /pilot|beta|preview|demo|meeting|call|미팅|데모|파일럿/i.test(purpose) ? '3-5 business days' : '5-7 business days';
  const body = `# Email Package

## Draft Status

- Status: Draft only. No email was sent.
- Send boundary: actual sending requires explicit user approval and a connected email tool.
- Approval needed before send: recipient, subject, body, attachments, timing, and sender identity.

## Email Connector Status

- Mode: ${connector.mode}
- Connector availability: ${connector.availability}
- What this means: ${connector.meaning}
- Connection guidance: ${connector.guidance}

## Purpose

${maskEmailsInText(purpose)}

## Recipient

${recipientLabel}

## Recipient Resolution

${renderRecipientResolution(recipientResolution)}

## Relationship

${relationship}

## Tone

${tone}

## Desired Next Action

${cta}

## Context To Preserve

${contextBullets.map((item) => `- ${item}`).join('\n')}

## Assumptions And Unknowns

- Recipient details may be incomplete; personalize before sending.
- ${recipientResolution.note}
- ${connector.assumption}
- If claims depend on external facts, verify them before sending.
- ${attachmentPlan}

## Subject Options

${subjectOptions.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Recommended Draft

Hi ${recipient},

${openingForPurpose(purpose)}

${valueParagraphForPurpose(purpose)}

${ctaQuestion(cta)}

Best,

[Your name]

## Short Version

Hi ${recipient}, quick note on ${topicLabel}. ${shortCta(cta)}

## Follow-Up

Send only if the first email has actually been sent with approval and there has been no reply after ${followUpDelay}.

Hi ${recipient},

Just following up in case this is still useful.

The reason I thought of you is that this may be easier to evaluate through a small, concrete next step rather than a long explanation.

${shortCta(cta)}

Best,

[Your name]

## Risk And Safety Notes

- Do not imply prior relationship, consent, or urgency unless the user confirms it.
- Do not claim the email was sent.
- If the user wants inbox reading, thread analysis, sending, or scheduled follow-up, ask them to connect Gmail or Outlook first.
- ${attachmentPlan}
- Do not include private data, secrets, or unsupported factual claims.

## Send Checklist

- [ ] Recipient confirmed
- [ ] Sender identity confirmed
- [ ] Subject confirmed
- [ ] Body reviewed
- [ ] Claims verified
- [ ] Attachments confirmed or explicitly omitted
- [ ] Timing confirmed
- [ ] Gmail/Outlook connector connected if inbox access or sending is requested
- [ ] User approved actual send
`;
  await writeText(out, body);
  return { file: out, text: `Wrote ${out}` };
}

function inferRelationship(recipient, purpose) {
  if (/investor|vc|fund|투자/i.test(recipient + purpose)) return 'Investor or funding contact; keep the email crisp and evidence-aware.';
  if (/customer|lead|prospect|pilot|user|사용자|고객|파일럿/i.test(recipient + purpose)) return 'Potential customer or pilot user; emphasize relevance, low-friction evaluation, and optionality.';
  if (/partner|partnership|협업|파트너/i.test(recipient + purpose)) return 'Potential partner; emphasize mutual fit and a concrete next step.';
  if (/reply|답장|follow/i.test(purpose)) return 'Existing thread or follow-up context; avoid repeating the full pitch.';
  return 'Relationship unspecified; use a neutral, respectful opening.';
}

function inferEmailCta(purpose) {
  if (/pilot|beta|preview|test|테스트|파일럿/i.test(purpose)) return 'Ask whether they are open to a small pilot or preview.';
  if (/meeting|call|demo|미팅|콜|데모/i.test(purpose)) return 'Ask whether a short call or demo would be useful.';
  if (/feedback|review|피드백|검토/i.test(purpose)) return 'Ask for focused feedback on the specific artifact or idea.';
  if (/intro|소개/i.test(purpose)) return 'Ask for an introduction or permission to share a short context note.';
  return 'Ask whether they want a short summary or next-step options.';
}

function inferEmailContext(purpose) {
  const items = [];
  if (/agent computer|agent workspace|에이전트|워크스페이스/i.test(purpose)) {
    items.push('Agent Computer turns AI-agent work into durable project artifacts instead of leaving it trapped in chat.');
    items.push('The strongest proof should be a small workflow, not a broad claim.');
  }
  if (/pilot|beta|preview|파일럿/i.test(purpose)) items.push('The ask should feel lightweight: small pilot, preview, or short feedback loop.');
  if (/open[-\s]?source|oss|오픈소스/i.test(purpose)) items.push('Open-source context means clarity, trust, setup friction, and contribution path matter.');
  if (!items.length) items.push('Keep the message specific, useful, and easy to decline.');
  return items;
}

function subjectOptionsFor(purpose) {
  if (/pilot|preview|beta|파일럿/i.test(purpose)) {
    return [
      'Small pilot idea',
      'Would this be useful to test?',
      'Quick preview request'
    ];
  }
  if (/demo|meeting|call|데모|미팅/i.test(purpose)) {
    return [
      'Short demo?',
      'Worth a quick look?',
      'A practical next step'
    ];
  }
  return [
    `Quick note on ${compactEmailPhrase(purpose)}`,
    'A practical next step',
    'Thought this might be useful'
  ];
}

function openingForPurpose(purpose) {
  if (/agent computer|agent workspace|에이전트|워크스페이스/i.test(purpose)) {
    return 'I am working on Agent Computer, a file-based workspace for running AI agents through inspectable project artifacts rather than one-off chat threads.';
  }
  return `I wanted to reach out about ${purpose}.`;
}

function valueParagraphForPurpose(purpose) {
  if (/pilot|preview|beta|파일럿/i.test(purpose)) {
    return 'The goal is not to ask for a big commitment. I am looking for a small, concrete read on whether the workflow feels useful, confusing, or worth improving.';
  }
  if (/agent computer|agent workspace|에이전트|워크스페이스/i.test(purpose)) {
    return 'The useful part is the artifact trail: source material, research, reports, decks, QA notes, and memory can live in a project folder where both people and agents can inspect them later.';
  }
  return 'The short version: I think there may be a useful next step here, and I would like to make it easy to evaluate.';
}

function ctaQuestion(cta) {
  if (/pilot|preview/i.test(cta)) return 'Would you be open to trying a small preview and telling me where it breaks or feels useful?';
  if (/call|demo/i.test(cta)) return 'Would a short demo or call be useful?';
  if (/feedback/i.test(cta)) return 'Would you be willing to share focused feedback?';
  if (/introduction/i.test(cta)) return 'Would you be open to making an introduction, or should I send a shorter context note first?';
  return 'Would it be helpful if I sent over a short summary or a few possible options?';
}

function shortCta(cta) {
  if (/pilot|preview/i.test(cta)) return 'Would you be open to a small preview?';
  if (/call|demo/i.test(cta)) return 'Would a short call or demo be useful?';
  if (/feedback/i.test(cta)) return 'Would focused feedback be useful here?';
  if (/introduction/i.test(cta)) return 'Would an introduction make sense?';
  return 'Would a short summary or next-step option be useful?';
}

function inferAttachmentPlan(purpose) {
  if (/attach|attachment|첨부|deck|ppt|pdf/i.test(purpose)) {
    return 'Attachment requested or implied, but no file is attached by this draft command; confirm the exact file before sending.';
  }
  return 'No attachment is included unless the user explicitly confirms one before send.';
}

function emailConnectorStatus(options = {}) {
  if (options.connector === 'gmail' || options.connector === 'outlook') {
    return {
      mode: `${options.connector} connector available`,
      availability: 'Connected email access was provided to this runtime.',
      meaning: 'Inbox/thread analysis may be possible, but sending still requires explicit user approval.',
      guidance: 'Confirm recipient, thread, draft, attachments, and send approval before taking any external action.',
      assumption: `${options.connector} connector may be available, but this local draft command did not send anything.`
    };
  }
  return {
    mode: 'Draft-only mode',
    availability: 'No Gmail or Outlook connector is connected to this local CLI command.',
    meaning: 'The operator can write drafts, replies, follow-ups, and checklists, but cannot read inboxes, inspect threads, send email, schedule email, or attach files.',
    guidance: 'To read or send real email, connect Gmail or Outlook Email in Codex/ChatGPT connectors, then rerun the request. Even after connection, actual sending requires explicit approval.',
    assumption: 'No email account or sending connector was used by this local command.'
  };
}

function emailTopicLabel(purpose) {
  const cleaned = String(purpose || 'this')
    .replace(/^(send|write|draft|invite|ask)\s+(an?\s+)?/i, '')
    .replace(/^outreach email asking someone to\s+/i, '')
    .replace(/\s+and attach.+$/i, '')
    .trim();
  return compactEmailPhrase(cleaned);
}

function compactEmailPhrase(value) {
  const text = oneLine(value);
  return text.length <= 56 ? text : `${text.slice(0, 53).trim()}...`;
}

export async function writeReflection(root, text) {
  const out = projectPath(root, 'personal-reflections', 'reports', `${safeTopicName(text.slice(0, 50))}_reflection.md`);
  const concern = oneLine(text);
  const isProjectStress = /project|release|launch|open[-\s]?source|agent computer|오픈소스|릴리스|프로젝트|공개|기준|불안|지치/i.test(concern);
  const body = `# Reflection

## What I Hear

${concern}

## Facts

- You are naming both an emotional state and a practical concern.
- The reflection preserves the user's wording as the source of truth; it does not diagnose or treat.
${isProjectStress ? '- The concern appears connected to a project, release, or quality threshold.' : '- The exact situation may need more context before giving specific advice.'}

## Interpretation

${isProjectStress
  ? 'It may help to separate the quality bar for the work from the emotional pressure around the work. The goal is not to erase the feeling, but to make it easier to act without letting the worry become an unlimited judge.'
  : 'There may be more than one layer here: what happened, what it means to you, and what choice is actually in front of you.'}

## Assumptions To Check

- What part is a concrete decision?
- What part is a fear, expectation, or standard that may need a boundary?
- What would be enough for the next step, rather than enough forever?

## What Might Be Going On

There may be both a practical question and an emotional load inside this. It is worth separating what needs a decision from what needs care, and what needs action from what simply needs to be acknowledged.

## Options

- Write down the concrete decision or standard.
- Name what feels heavy without arguing with it.
- Convert one worry into a task, one worry into a question, and one worry into a parking-lot item.
- Choose one small next action that can be completed today.

## A Small Next Step

Create a short "next enough" list: one must-do, one should-do, and one later item. Then do only the must-do first.

## Safety Note

This is supportive reflection, not medical or clinical care. If there is immediate risk or crisis, contact trusted people or emergency services.
`;
  await writeText(out, body);
  return { file: out, text: `Wrote ${out}` };
}

async function gatherReportEvidence(root, project, sourcePath, options = {}) {
  const preferred = [
    'README.md',
    'AGENTS.md',
    'package.json',
    'system/organization-policy.md',
    'agents/work/report-writer/agent.md',
    'agents/work/report-writer/workflow.md',
    'agents/system/qa-verifier/agent.md',
    'agents/system/qa-verifier/workflow.md',
    'projects/quick-researcher-smoke-20260516/research/agent-computer-open-source-positioning_quick-research.md'
  ];
  const files = await listFiles(root, { maxDepth: 8 });
  const projectResearch = options.includeProjectResearch === false
    ? []
    : files
      .filter((file) => (file.rel.startsWith(`projects/${project}/research/`) || file.rel.startsWith(`workspace/projects/${project}/research/`)) && file.ext === '.md')
      .map((file) => file.rel)
      .slice(0, 6);
  const candidates = [...new Set([...preferred, ...projectResearch])].filter((relPath) => rel(root, sourcePath) !== relPath);
  const items = [];

  for (const relPath of candidates) {
    const text = await readText(resolveWorkspacePath(root, relPath), '');
    if (!text.trim()) continue;
    items.push({
      path: relPath,
      text,
      clean: stripMarkdown(text).toLowerCase(),
      excerpt: firstUsefulExcerpt(text)
    });
  }

  return { items };
}

function extractClaimUnits(text) {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^#{1,6}\s*/, '').replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 12 && !/^```/.test(line) && !/^rough input\b/i.test(line) && !isStructuralClaimLine(line));
  const units = rawLines.length ? rawLines : splitSentences(text);
  return [...new Set(units.flatMap(expandCompoundGap).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean))].slice(0, 14);
}

function expandCompoundGap(line) {
  if (!isGapClaim(line)) return [line];
  const gaps = [];
  if (/경쟁|competitor/i.test(line)) gaps.push('경쟁 프로젝트는 아직 확인하지 못했다.');
  if (/보안|security|privacy/i.test(line)) gaps.push('보안 리스크는 아직 확인하지 못했다.');
  if (/설치|install|checkout/i.test(line)) gaps.push('설치 경험은 아직 확인하지 못했다.');
  if (/인터뷰|interview|사용자/i.test(line)) gaps.push('사용자 인터뷰는 아직 확인하지 못했다.');
  return gaps.length ? gaps : [line];
}

function reviewClaim(claim, evidenceItems) {
  const topics = detectClaimTopics(claim);
  const isGap = isGapClaim(claim);
  const isHypothesis = isHypothesisClaim(claim);
  const matches = findEvidenceMatches(claim, topics, evidenceItems);
  const best = matches[0];

  if (isGap) {
    return {
      claim,
      status: 'Confirmed gap',
      evidence: best ? evidenceText(best) : 'The source itself says this has not been checked.',
      treatment: 'Keep as an explicit validation gap; do not turn it into a launch claim.'
    };
  }

  if (best && best.score >= 4) {
    return {
      claim,
      status: isHypothesis ? 'Partially supported' : 'Supported',
      evidence: evidenceText(best),
      treatment: isHypothesis ? 'Use as a working hypothesis and keep uncertainty visible.' : 'Use as a supported report point.'
    };
  }

  if (best && best.score >= 2) {
    return {
      claim,
      status: 'Partially supported',
      evidence: evidenceText(best),
      treatment: 'Use carefully; mark what still needs validation.'
    };
  }

  if (isHypothesis) {
    return {
      claim,
      status: 'Hypothesis',
      evidence: 'No strong local evidence found by the CLI scan.',
      treatment: 'Frame as a hypothesis for pilot testing or supplementary research.'
    };
  }

  return {
    claim,
    status: 'Needs validation',
    evidence: 'No strong local evidence found by the CLI scan.',
    treatment: 'Do not present as fact without supplementary evidence.'
  };
}

function detectClaimTopics(claim) {
  const text = claim.toLowerCase();
  const topics = [];
  if (/오픈소스|open[-\s]?source|release|공개|license|mit/.test(text)) topics.push('open-source', 'release', 'license', 'mit');
  if (/coding agent|codex|claude|power user|초기 사용자|사용자/.test(text)) topics.push('coding-agent', 'codex', 'claude', 'user', 'designed');
  if (/채팅|chat|파일|file|durable|inspect|사라지|workspace|워크스페이스/.test(text)) topics.push('chat', 'file', 'durable', 'workspace', 'inspectable');
  if (/readme|demo|qa|folder|폴더|structure|구조|quick start/.test(text)) topics.push('readme', 'demo', 'qa', 'folder', 'project-first');
  if (/경쟁|competitor|framework|mcp/.test(text)) topics.push('competitor', 'framework', 'mcp');
  if (/보안|security|privacy|secret|risk|리스크/.test(text)) topics.push('security', 'privacy', 'secret', 'risk');
  if (/설치|install|checkout|setup|npm/.test(text)) topics.push('install', 'checkout', 'npm', 'quick start');
  if (/인터뷰|interview|pilot|validation|검증/.test(text)) topics.push('interview', 'pilot', 'validation', 'user');
  return topics;
}

function findEvidenceMatches(claim, topics, evidenceItems) {
  const keywords = [...new Set([...extractKeywords(claim), ...topics])];
  return evidenceItems
    .map((item) => {
      let score = 0;
      const matched = [];
      for (const keyword of keywords) {
        if (item.clean.includes(keyword.toLowerCase())) {
          matched.push(keyword);
          score += keyword.length > 5 ? 2 : 1;
        }
      }
      return { ...item, score, matched };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function extractKeywords(text) {
  const stop = new Set([
    'this', 'that', 'with', 'from', 'into', 'there', 'their', 'about', 'should', 'would',
    'agent', 'computer', '것이다', '있다', '한다', '대한', '아직', '하지만', '좋은'
  ]);
  return [...text.toLowerCase().matchAll(/[a-z0-9가-힣]{3,}/gi)]
    .map((match) => match[0])
    .filter((word) => !stop.has(word))
    .slice(0, 10);
}

function isGapClaim(text) {
  return /not (?:yet )?(?:fully )?(?:checked|verified|performed|confirmed)|not checked|not verified|not performed|not confirmed|unknown|확인하지 못|확인 못|아직.*못|근거 부족|미확인/.test(text.toLowerCase());
}

function isHypothesisClaim(text) {
  return /것 같다|likely|seems|probably|may|might|hypothesis|가설|추정|예상|plausible|일 것/.test(text.toLowerCase());
}

function isStructuralClaimLine(text) {
  return /^(decision|rough claims|desired deep research behavior|deep[-\s]?dive researcher smoke test brief|research question|sources?|evidence notes?)$/i.test(text.trim());
}

function evidenceText(match) {
  const keyword = match.matched?.[0] || '';
  return `\`${match.path}\` (${contextExcerpt(match.text, keyword) || match.excerpt})`;
}

function firstUsefulExcerpt(text) {
  const sentence = splitSentences(stripMarkdown(text)).find((item) => item.length > 35) || stripMarkdown(text).slice(0, 140);
  return oneLine(sentence).slice(0, 180);
}

function contextExcerpt(text, keyword) {
  const clean = oneLine(stripMarkdown(text));
  if (!keyword) return clean.slice(0, 180);
  const index = clean.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return clean.slice(0, 180);
  const start = Math.max(0, index - 70);
  const end = Math.min(clean.length, index + keyword.length + 110);
  return clean.slice(start, end);
}

function renderExecutiveSummary(facts, supported, unresolved) {
  const lead = supported[0]?.claim || facts[0] || 'The source needs more evidence before a confident report can be written.';
  const gapText = unresolved.length
    ? ` ${unresolved.length} item(s) remain hypotheses, gaps, or validation needs and should not be overclaimed.`
    : ' No major evidence gaps were detected by the local scan.';
  return `${lead}${gapText} This report preserves the source, separates evidence from assumptions, and turns unresolved items into next actions.`;
}

function keyMessageFromClaims(supported, facts) {
  const claim = supported.find((item) => /chat|file|workspace|채팅|파일|워크스페이스|durable/i.test(item.claim)) || supported[0];
  return claim?.claim || facts[0] || 'Use the source as a starting point, but validate important claims before sharing.';
}

function renderClaimRow(item) {
  return `| ${escapeTable(item.claim)} | ${item.status} | ${escapeTable(item.evidence)} | ${escapeTable(item.treatment)} |`;
}

function renderClaimEvidenceConfidenceCaveatMatrix(claimReviews) {
  if (!claimReviews.length) {
    return '| No specific claim extracted | No evidence mapped | Low | Need more source material. | Do not use as a decision point yet. |';
  }
  return claimReviews.slice(0, 12).map((item) => {
    const confidence = confidenceForClaimReview(item);
    const caveat = caveatForClaimReview(item);
    const decisionUse = decisionUseForClaimReview(item);
    return `| ${escapeTable(item.claim)} | ${escapeTable(item.evidence)} | ${confidence} | ${escapeTable(caveat)} | ${escapeTable(decisionUse)} |`;
  }).join('\n');
}

function confidenceForClaimReview(item) {
  if (item.status === 'Supported') return 'High';
  if (item.status === 'Partially supported') return 'Medium';
  if (item.status === 'Hypothesis') return 'Low';
  if (item.status === 'Confirmed gap') return 'Low';
  return 'Low';
}

function caveatForClaimReview(item) {
  if (item.status === 'Supported') return 'Use normally, but keep source context visible.';
  if (item.status === 'Partially supported') return 'Use with qualification; supporting evidence is directional or incomplete.';
  if (item.status === 'Hypothesis') return 'Treat as a working hypothesis until validated.';
  if (item.status === 'Confirmed gap') return 'Keep as a gap; do not convert into a claim.';
  return 'Needs stronger evidence before high-confidence use.';
}

function decisionUseForClaimReview(item) {
  if (item.status === 'Supported') return 'Can support the main narrative.';
  if (item.status === 'Partially supported') return 'Can shape the recommendation if caveated.';
  if (item.status === 'Hypothesis') return 'Use for experiment design or next research.';
  if (item.status === 'Confirmed gap') return 'Use as a risk or validation item.';
  return 'Keep out of the core conclusion.';
}

function renderGapsFilled(evidenceItems, supported) {
  const lines = ['- Local report structure added.', '- Source content preserved in the appendix.'];
  if (supported.length) lines.push(`- ${supported.length} source item(s) connected to local evidence.`);
  for (const item of evidenceItems.slice(0, 6)) lines.push(`- Checked local evidence: \`${item.path}\`.`);
  return lines.join('\n');
}

function renderRemainingGaps(items) {
  if (!items.length) return '- None detected by the local CLI scan. Still review current or external claims manually before public use.';
  const rows = [
    '| Gap Or Hypothesis | Why It Matters | Recommended Evidence |',
    '|---|---|---|'
  ];
  for (const item of items) {
    rows.push(`| ${escapeTable(item.claim)} | ${gapReason(item)} | ${neededEvidence(item.claim)} |`);
  }
  return rows.join('\n');
}

function renderReportQuestionTrace(source, claimReviews, evidenceItems = []) {
  const fromArtifacts = findArtifactSection([source, ...evidenceItems.map((item) => item.text)], 'Questions That Changed The Recommendation');
  if (fromArtifacts) return fromArtifacts;
  if (/Socratic Question Engine|Question Ledger/i.test(source)) {
    const unresolved = claimReviews.find((item) => item.status !== 'Supported');
    const rows = [
      '| Question | Effect on report | Evidence or assumption used |',
      '|---|---|---|',
      `| Which claim is weakest or most outcome-changing? | The report keeps unsupported items in gaps, risk, or next actions instead of the main conclusion. | ${escapeTable(unresolved?.evidence || 'Local evidence scan and claim map.')} |`,
      '| Which finding should become the main narrative instead of appendix detail? | The report prioritizes supported claims and preserves detailed source material in the appendix. | Source structure, evidence map, and user-facing purpose. |',
      '| What must a downstream agent preserve? | The report keeps evidence boundaries, assumptions, and caveats visible for PPT/email/handoff use. | Question ledger and source-preservation rule. |'
    ];
    return rows.join('\n');
  }
  return '- No explicit question ledger was detected in the source. The report still turns weak or unresolved claims into gaps, risks, and next actions.';
}

function gapReason(item) {
  if (item.status === 'Confirmed gap') return 'The source explicitly says this is not checked.';
  if (item.status === 'Hypothesis') return 'The source frames this as likely or assumed, not proven.';
  return 'The local CLI scan did not find strong supporting evidence.';
}

function neededEvidence(claim) {
  const lower = claim.toLowerCase();
  if (/경쟁|competitor/.test(lower)) return 'Competitor scan with comparable projects and positioning matrix.';
  if (/보안|security|privacy/.test(lower)) return 'Security/public-safety note, threat model, and secret-handling policy.';
  if (/설치|install|checkout/.test(lower)) return 'Clean checkout/install smoke test with exact commands and output paths.';
  if (/인터뷰|interview|사용자|user/.test(lower)) return 'Pilot notes or user interviews with the target audience.';
  if (/오픈소스|open/.test(lower)) return 'Repository URL, license, release tag, and contribution docs.';
  return 'Supplementary local evidence, current external sources, or user validation.';
}

function renderFindings(claimReviews, facts) {
  if (!claimReviews.length) return bulletList(facts);
  return claimReviews.slice(0, 8).map((item) => `- ${item.status}: ${item.claim}`).join('\n');
}

function renderReportAnalysis(source, claimReviews) {
  const supportedCount = claimReviews.filter((item) => item.status === 'Supported' || item.status === 'Partially supported').length;
  const gapCount = claimReviews.length - supportedCount;
  return `${interpret(source)} The local evidence scan found ${supportedCount} supported or partially supported item(s) and ${gapCount} item(s) that still need validation or careful framing. The report should therefore use supported claims as the main narrative, while moving hypotheses and unverified areas into risks, next actions, or research tasks.`;
}

function renderRiskRegister(claimReviews) {
  const risky = claimReviews.filter((item) => item.status === 'Confirmed gap' || item.status === 'Needs validation' || item.status === 'Hypothesis');
  if (!risky.length) return '- No major report risks detected by the local CLI scan.';
  const rows = ['| Risk | Severity | Mitigation |', '|---|---:|---|'];
  for (const item of risky.slice(0, 8)) {
    rows.push(`| ${escapeTable(item.claim)} | ${riskSeverity(item.claim)} | ${escapeTable(item.treatment)} |`);
  }
  return rows.join('\n');
}

function riskSeverity(claim) {
  if (/보안|security|privacy|설치|install|release|공개|오픈소스/i.test(claim)) return 'High';
  if (/경쟁|competitor|사용자|user|interview|인터뷰/i.test(claim)) return 'Medium';
  return 'Low';
}

function renderReportRecommendations(project, claimReviews) {
  const lines = [
    `- Preserve this report under \`projects/${project}/reports/\`.`,
    '- Use supported claims as the report spine; keep hypotheses and unverified claims visibly labeled.',
    '- Run QA before sharing.'
  ];
  if (claimReviews.some((item) => item.status === 'Confirmed gap' || item.status === 'Needs validation')) {
    lines.push('- Convert remaining gaps into quick-researcher or deep-dive-researcher tasks before making public or high-confidence claims.');
  }
  lines.push('- Use `web-builder` if this report needs to become a local HTML page or interactive web report.');
  lines.push('- Use `ppt-builder` if this report needs to become a deck.');
  lines.push('- Use `image-deck-maker` if this report needs to become a full-slide generated image deck.');
  lines.push('- Use `visual-asset-maker` if this report needs to become campaign, social, thumbnail, launch, or showcase visual assets.');
  return lines.join('\n');
}

function renderNextActions(root, out, claimReviews) {
  const lines = ['- Review the Evidence Map and Remaining Gaps sections.'];
  const hasExternalGaps = claimReviews.some((item) => /competitor|security|install|interview|경쟁|보안|설치|인터뷰/i.test(item.claim));
  if (hasExternalGaps) lines.push('- Run focused supplementary research for competitor, security, install, or user-validation gaps.');
  lines.push(`- Run \`node tools/agent-computer.mjs qa ${rel(root, out)}\`.`);
  return lines.join('\n');
}

function extractSection(text, heading) {
  const pattern = new RegExp(`(^##\\s+${escapeRegExp(heading)}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s+|$)`, 'im');
  const match = String(text || '').match(pattern);
  return match ? match[2].trim() : '';
}

function findArtifactSection(texts, heading) {
  for (const text of texts) {
    const section = extractSection(text, heading);
    if (section) return section;
  }
  return '';
}

function renderEvidenceConfidenceFromArtifacts(evidenceItems = []) {
  const explicit = findArtifactSection(evidenceItems.map((item) => item.text), 'Evidence Confidence');
  if (explicit && explicit.includes('|')) return stripMarkdownTableHeaderIfPresent(explicit);
  const claimMap = evidenceItems.find((item) => /claim-verification-map\.md$/i.test(item.path));
  if (!claimMap) return '';
  const rows = parseMarkdownTableRows(claimMap.text)
    .filter((row) => row.length >= 3)
    .slice(0, 8)
    .map((row) => {
      const [claim, status, evidence, note] = row;
      return `| ${escapeTable(claim)} | ${escapeTable(evidence)} | ${confidenceFromStatus(status)} | ${escapeTable(note || status)} |`;
    });
  return rows.join('\n');
}

function stripMarkdownTableHeaderIfPresent(text) {
  const lines = String(text || '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length >= 2 && /^\s*\|/.test(lines[0]) && /^\s*\|?\s*:?-{2,}:?\s*\|/.test(lines[1])) {
    return lines.slice(2).join('\n');
  }
  return text.trim();
}

function parseMarkdownTableRows(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\|.*\|$/.test(line));
  const body = lines.filter((line) => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line));
  if (body.length > 1) body.shift();
  return body.map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim().replace(/\\\|/g, '|')));
}

function confidenceFromStatus(status) {
  const text = String(status || '').toLowerCase();
  if (/confirmed|supported|verified|확인|검증|high/.test(text) && !/partially|directionally|부분|low/.test(text)) return 'High';
  if (/directionally|partial|reasoned|medium|전략|추론|부분/.test(text)) return 'Medium';
  return 'Low';
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeTable(value) {
  return oneLine(value).replace(/\|/g, '\\|');
}

function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function topSentences(text, count) {
  return splitSentences(text).filter((s) => s.length > 30).slice(0, count);
}

function interpret(text) {
  const clean = stripMarkdown(text);
  if (!clean) return 'No interpretable text was available.';
  if (/agent|workspace|computer/i.test(clean)) {
    return 'The material describes a durable workspace pattern where agents operate through files, tools, memory, and repeatable workflows rather than one-off prompts.';
  }
  return 'The material contains enough source content for a first-pass interpretation, but external validation may be needed for current or factual claims.';
}

function rel(root, path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}
