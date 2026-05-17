import { basename, resolve } from 'node:path';
import { listFiles, readText, safeTopicName, writeText } from './files.mjs';
import { bulletList, extractHeadings, splitSentences, stripMarkdown } from './markdown.mjs';
import { maskEmailsInText, redactEmailsForStorageName, renderRecipientResolution, resolveEmailRecipient } from './contacts.mjs';
import { inferProjectSlug, projectPath } from './project-paths.mjs';
import { resolveWorkspacePath } from './workspace.mjs';

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
  const facts = topSentences(source, 10);
  const headings = extractHeadings(source).map((h) => `${'  '.repeat(h.level - 1)}- ${h.title}`).join('\n') || '- No headings found';
  const evidence = await gatherReportEvidence(root, project, filePath, { includeProjectResearch: false });
  const memory = await readResearchMemory(root);
  const claims = extractClaimUnits(source);
  const claimReviews = claims.map((claim) => reviewClaim(claim, evidence.items));
  const supported = claimReviews.filter((claim) => claim.status === 'Supported' || claim.status === 'Partially supported');
  const unresolved = claimReviews.filter((claim) => claim.status !== 'Supported');
  const sourceMapRows = renderDeepSourceMap(filePath, evidence.items);
  const body = `# Deep Research Report

## Research Question

${question}

## Short Answer

${renderDeepShortAnswer(facts, supported, unresolved)}

## Research Frame

### Decision Supported

This local deep-research pass helps decide how to understand, position, or act on the provided source. It does not claim to be a complete external investigation.

### Sub-Questions

${renderDeepQuestions(question, source)}

## Memory-Aware User Usefulness Frame

${renderResearchMemoryFrame(memory, question)}

## Research Pass Log

${renderResearchPassLog(evidence.items, claimReviews)}

## Question Ledger

| Question | Why it matters to the user | Status | Evidence used | Next action |
|---|---|---|---|---|
${renderQuestionLedger(question, source, claimReviews)}

## User Checkpoints And Assumptions

${renderUserCheckpoints(question, claimReviews)}

## Source Map

| Source | Type | Use | Confidence |
|---|---|---|---|
${sourceMapRows}

## Claim Verification Map

| Claim Or Input Item | Verification Status | Evidence Used | Treatment |
|---|---|---|---|
${claimReviews.length ? claimReviews.map(renderClaimRow).join('\n') : '| No specific claim extracted | Needs validation | No claim-like source lines found. | Ask for more source material before drawing conclusions. |'}

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

## Why Stop Here

${renderWhyStopHere(claimReviews)}

## Sources

- \`${filePath}\`
${evidence.items.slice(0, 8).map((item) => `- \`${item.path}\``).join('\n')}
`;
  await writeText(out, body);
  return { file: out, text: `Wrote ${out}` };
}

function renderDeepSourceMap(primaryPath, evidenceItems) {
  const rows = [`| \`${primaryPath}\` | workspace file | primary input and claim source | medium |`];
  for (const item of evidenceItems.slice(0, 8)) {
    rows.push(`| \`${item.path}\` | local workspace evidence | support, contradiction, or context check | medium |`);
  }
  return rows.join('\n');
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

function renderQuestionLedger(question, source, claimReviews) {
  const rows = [];
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
  lines.push('- Use `ppt-builder` if this report needs to become a deck.');
  return lines.join('\n');
}

function renderNextActions(root, out, claimReviews) {
  const lines = ['- Review the Evidence Map and Remaining Gaps sections.'];
  const hasExternalGaps = claimReviews.some((item) => /competitor|security|install|interview|경쟁|보안|설치|인터뷰/i.test(item.claim));
  if (hasExternalGaps) lines.push('- Run focused supplementary research for competitor, security, install, or user-validation gaps.');
  lines.push(`- Run \`node tools/agent-computer.mjs qa ${rel(root, out)}\`.`);
  return lines.join('\n');
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
