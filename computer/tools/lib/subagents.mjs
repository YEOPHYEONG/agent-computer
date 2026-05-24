import { basename, resolve } from 'node:path';
import { exists, listFiles, readText, safeTopicName, writeText } from './files.mjs';
import { projectPath } from './project-paths.mjs';
import { computerPath } from './workspace.mjs';

const PREFLIGHT_ROLES = ['intent-analyst', 'research-architect'];

const ARCHITECTURE_ROLES = {
  'strategic-decision': ['source-scout', 'evidence-verifier', 'mechanism-analyst', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
  'product-gtm': ['source-scout', 'market-mapper', 'gtm-strategist', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
  'growth-case': ['source-scout', 'case-benchmark-worker', 'mechanism-analyst', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
  'market-landscape': ['source-scout', 'market-mapper', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
  'technical-implementation': ['technical-docs-reader', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
  'source-heavy': ['source-scout', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
  'wide-benchmark-synthesis': ['source-scout', 'case-benchmark-worker', 'evidence-verifier', 'mechanism-analyst', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer']
};

export async function prepareResearchSubagentRuntime(root, project, architecture, mode, question, options = {}) {
  const runtime = normalizeRuntime(options.runtime || 'auto', root);
  const nativeRequested = Boolean(options.nativeSubagents);
  const materialize = Boolean(options.materializeSubagents);
  const { preflightRoles, investigationRoles, roles } = await rolesForArchitecture(root, architecture, mode);
  const planFile = projectPath(root, project, 'research', 'runtime-subagent-plan.md');
  const orchestrationFile = projectPath(root, project, 'research', 'subagent-orchestration.md');
  const resultsReadmeFile = projectPath(root, project, 'research', 'subagent-results', 'README.md');
  const resultTemplateFile = projectPath(root, project, 'research', 'subagent-results', '_template.md');
  const resultFileByRole = new Map(roles.map((role) => [
    role.key,
    projectPath(root, project, 'research', 'subagent-results', `ac-${role.key}.md`)
  ]));
  const planMarkdown = renderRuntimeSubagentPlan({ runtime, nativeRequested, materialize, roles, preflightRoles, investigationRoles, architecture, mode, question, resultFileByRole });
  const orchestrationMarkdown = renderSubagentOrchestration({ runtime, nativeRequested, materialize, roles, preflightRoles, investigationRoles, architecture, mode, question, resultFileByRole });
  const files = [planFile, orchestrationFile, resultsReadmeFile, resultTemplateFile];

  await writeText(planFile, planMarkdown);
  await writeText(orchestrationFile, orchestrationMarkdown);
  await writeText(resultsReadmeFile, renderSubagentResultsReadme({ roles, preflightRoles, investigationRoles, runtime, nativeRequested, resultFileByRole }));
  await writeText(resultTemplateFile, renderSubagentResultTemplate());

  for (const role of roles) {
    const workerFile = projectPath(root, project, 'research', 'worker-packets', `ac-${role.key}.md`);
    await writeText(workerFile, renderWorkerPacket(role, { architecture, mode, question, resultFile: resultFileByRole.get(role.key) }));
    files.push(workerFile);
  }

  if (runtime === 'claude-code' && nativeRequested && materialize) {
    for (const role of roles) {
      const agentFile = resolve(root, '.claude', 'agents', `ac-${role.key}.md`);
      await writeText(agentFile, renderClaudeSubagent(role));
      files.push(agentFile);
    }
  }

  return {
    runtime,
    nativeRequested,
    materialize,
    roles,
    preflightRoles,
    investigationRoles,
    planFile,
    orchestrationFile,
    resultsReadmeFile,
    resultTemplateFile,
    planMarkdown,
    orchestrationMarkdown,
    files
  };
}

export async function listResearchSubagentRoles(root) {
  return loadRoleSpecs(root);
}

async function loadRoleSpecs(root) {
  const dir = computerPath(root, 'agents/work/deep-dive-researcher/subagents');
  const files = await listFiles(dir, { maxDepth: 1 });
  const specs = [];
  for (const file of files.filter((item) => item.ext === '.md' && !/^README$/i.test(basename(item.path, '.md')))) {
    const text = await readText(file.path, '');
    specs.push(parseRoleSpec(basename(file.path, '.md'), text, file.path));
  }
  specs.sort((a, b) => a.key.localeCompare(b.key));
  return specs;
}

function parseRoleSpec(fallbackKey, text, path) {
  const frontmatter = parseFrontmatter(text);
  const body = stripFrontmatter(text).trim();
  const title = (body.match(/^#\s+(.+)$/m)?.[1] || titleFromKey(fallbackKey)).trim();
  const key = safeTopicName(frontmatter.name || fallbackKey);
  const description = frontmatter.description || firstParagraph(extractSection(body, 'When To Use')) || `Specialist role: ${title}.`;
  const responsibility = firstParagraph(extractSection(body, 'Role')) || firstBullet(extractSection(body, 'Responsibilities')) || description;
  const responsibilities = extractBullets(extractSection(body, 'Responsibilities'));
  const outputSchema = extractSection(body, 'Output Schema').trim();

  return {
    key,
    title,
    description: oneLine(description),
    responsibility: oneLine(responsibility),
    responsibilities,
    outputSchema,
    body,
    path
  };
}

function normalizeRuntime(runtime, root) {
  const value = String(runtime || 'auto').toLowerCase();
  if (['codex', 'claude-code', 'fallback', 'worker-packets'].includes(value)) return value === 'worker-packets' ? 'fallback' : value;
  if (exists(resolve(root, '.claude', 'agents'))) return 'claude-code';
  return 'fallback';
}

async function rolesForArchitecture(root, architecture, mode) {
  const specs = await loadRoleSpecs(root);
  const byKey = new Map(specs.map((spec) => [spec.key, spec]));
  const base = ARCHITECTURE_ROLES[architecture.slug] || ARCHITECTURE_ROLES['strategic-decision'];
  const investigationKeys = mode.mode === 'Wide' || mode.mode === 'Hybrid'
    ? withRoleBeforeQualityGate(base, 'case-benchmark-worker')
    : base;
  const keys = [...new Set([...PREFLIGHT_ROLES, ...investigationKeys])];
  const roles = keys.map((key) => byKey.get(key)).filter(Boolean);
  return {
    preflightRoles: PREFLIGHT_ROLES.map((key) => byKey.get(key)).filter(Boolean),
    investigationRoles: investigationKeys.map((key) => byKey.get(key)).filter(Boolean),
    roles
  };
}

function withRoleBeforeQualityGate(base, roleKey) {
  if (base.includes(roleKey)) return base;
  const gateIndex = base.findIndex((key) => key === 'research-quality-controller' || key === 'report-composer');
  if (gateIndex === -1) return [...base, roleKey];
  return [...base.slice(0, gateIndex), roleKey, ...base.slice(gateIndex)];
}

function renderRuntimeSubagentPlan({ runtime, nativeRequested, materialize, roles, preflightRoles, investigationRoles, architecture, mode, question, resultFileByRole }) {
  const phases = subagentPhases(preflightRoles, investigationRoles);
  const runtimeStatus = runtime === 'codex'
    ? 'Codex native subagents can be used only when the user explicitly asks for subagents, delegation, or parallel agent work. The local CLI writes this plan and worker packets; the Codex host must spawn native agents.'
    : runtime === 'claude-code'
      ? 'Claude Code can use project subagents from `.claude/agents/`. Materialization is explicit so the workspace is not changed silently.'
      : 'Native subagents are not selected. Use worker packets with the same role specs.';

  const executionMode = nativeRequested
    ? runtime === 'codex'
      ? 'native-subagent plan for Codex host orchestration'
      : runtime === 'claude-code'
        ? materialize ? 'materialized Claude Code project subagents' : 'Claude Code subagent plan, not materialized'
        : 'fallback worker packets'
    : 'worker-packet fallback, with native subagents only as a proposal';

  return `# Runtime Subagent Plan

## Request

${question}

## Selected Research Shape

- Research mode: ${mode.mode}
- Research architecture: ${architecture.name}
- Execution mode: ${executionMode}
- Runtime target: ${runtime}
- Native subagents requested: ${nativeRequested ? 'yes' : 'no'}
- Materialize runtime subagent files: ${materialize ? 'yes' : 'no'}

## Runtime Boundary

${runtimeStatus}

## Research Director Rule

The deep-dive researcher remains the Research Director. Subagents or worker packets gather evidence, test claims, analyze mechanisms, red-team assumptions, and propose synthesis. The Director owns the final synthesis and must preserve the research contract, architecture decision, evidence confidence, assumptions, and unresolved questions.

## Fixed Roster Rule

Use canonical role names only. Do not invent one-off subagent identities such as Tesla, Copernicus, or personality-based agents. If native subagents are used, map work to the fixed \`ac-*\` roster below.

## Preflight Roles

Preflight roles clarify the work before source gathering. They should run first as native subagents when explicit subagent execution is approved, or as worker packets otherwise.

| Role | Responsibility | Native runtime use | Fallback |
|---|---|---|---|
${preflightRoles.map((role) => `| ac-${role.key} | ${escapeTable(role.responsibility)} | ${nativeRuntimeUse(runtime, nativeRequested, role)} | Use \`worker-packets/ac-${role.key}.md\`. |`).join('\n')}

## Wave-Based Specialist Roles

Codex defaults to six concurrent open agent threads. Do not try to run every role at once. Use phased waves so the Research Director can read outputs, repair weak material, and pass clean instructions to the next phase.

### Wave 1: Evidence And Analysis

Run these after preflight is resolved. If the wave has more than five roles, split it into smaller batches and wait for each batch.

| Role | Responsibility | Native runtime use | Fallback |
|---|---|---|---|
${renderRoleTable(phases.evidenceAndAnalysis, runtime, nativeRequested)}

### Wave 2: Verification And Critique

Run only after Wave 1 findings are saved or summarized.

| Role | Responsibility | Native runtime use | Fallback |
|---|---|---|---|
${renderRoleTable(phases.verificationAndCritique, runtime, nativeRequested)}

### Wave 3: Synthesis Architecture

Run only after evidence, analysis, verification, and critique findings exist.

| Role | Responsibility | Native runtime use | Fallback |
|---|---|---|---|
${renderRoleTable(phases.synthesis, runtime, nativeRequested)}

### Wave 4: Research Quality Control

Run this as a single gate. Do not run it in parallel with report composition.

| Role | Responsibility | Native runtime use | Fallback |
|---|---|---|---|
${renderRoleTable(phases.qualityControl, runtime, nativeRequested)}

### Wave 5: Report Composition

Run this only after the quality-controller result exists. The output must be a full report draft, not a short proceed note.

| Role | Responsibility | Native runtime use | Fallback |
|---|---|---|---|
${renderRoleTable(phases.composition, runtime, nativeRequested)}

## Codex Invocation Plan

Use only if the current Codex session has been explicitly asked to use subagents, delegation, or parallel agent work.

### Wave 0: Preflight

${preflightRoles.map((role, index) => `${index + 1}. Spawn \`ac-${role.key}\` with this task: ${escapeTable(role.responsibility)}`).join('\n')}

After preflight, ask the user and wait if the preflight outputs reveal an outcome-changing question.

### Wave 1: Evidence And Analysis

${phases.evidenceAndAnalysis.map((role, index) => `${index + 1}. Spawn \`ac-${role.key}\` with this task: ${escapeTable(role.responsibility)}`).join('\n') || '- No evidence/analysis roles selected.'}

Wait for this wave and save or summarize each result under \`subagent-results/ac-*.md\`.

### Wave 2: Verification And Critique

${phases.verificationAndCritique.map((role, index) => `${index + 1}. Spawn \`ac-${role.key}\` with this task: ${escapeTable(role.responsibility)}`).join('\n') || '- No verification/critique roles selected.'}

Wait for this wave and patch weak claims, caveats, or source gaps before synthesis.

### Wave 3: Synthesis Architecture

${phases.synthesis.map((role, index) => `${index + 1}. Spawn \`ac-${role.key}\` with this task: ${escapeTable(role.responsibility)}`).join('\n') || '- No synthesis role selected.'}

Wait for this wave and make sure the synthesis preserves evidence boundaries.

### Wave 4: Research Quality Control

${phases.qualityControl.map((role, index) => `${index + 1}. Spawn \`ac-${role.key}\` with this task: ${escapeTable(role.responsibility)}`).join('\n') || '- No quality-control role selected.'}

Run this after all prior waves. The quality controller checks missing why-questions, material utilization, and repair needs. If repairs are required, apply them before composition.

### Wave 5: Report Composition

${phases.composition.map((role, index) => `${index + 1}. Spawn \`ac-${role.key}\` with this task: ${escapeTable(role.responsibility)}`).join('\n') || '- No report-composer role selected.'}

\`ac-report-composer\` drafts the human-readable report from the full research package and controller instructions. The Research Director reviews and accepts the final synthesis.

Blocking rule: if the final deliverable is a report, strategy memo, market analysis, launch plan, or web-report source document, do not write the final report until \`subagent-results/ac-research-quality-controller.md\` and \`subagent-results/ac-report-composer.md\` exist. Do not label the final report as authored or composed by \`ac-report-composer\` unless that file exists and uses the quality-controller instructions.

## Subagent Result Paths

When native subagents actually run, save or summarize their outputs under:

\`workspace/projects/<project-slug>/research/subagent-results/ac-*.md\`

This run's concrete result paths are:

${roles.map((role) => `- \`ac-${role.key}\`: \`${resultFileByRole.get(role.key)}\``).join('\n')}

See \`subagent-orchestration.md\` for the execution sequence and truthfulness rules. See \`subagent-results/_template.md\` for the required result shape.

## Claude Code Materialization Plan

${runtime === 'claude-code' && nativeRequested && materialize
    ? 'Project subagent files were written under `.claude/agents/` for the selected roles.'
    : 'To materialize project subagents, rerun with `--runtime claude-code --native-subagents --materialize-subagents` after the user explicitly approves that project-level runtime files should be created.'}

## Worker-Packet Fallback

Worker packets are always generated under \`workspace/projects/<project-slug>/research/worker-packets/\`. If native subagents are unavailable or not authorized, execute those packets sequentially or use them as prompts for the current runtime. The artifact schema should remain the same.
`;
}

function renderSubagentOrchestration({ runtime, nativeRequested, materialize, roles, preflightRoles, investigationRoles, architecture, mode, question, resultFileByRole }) {
  const phases = subagentPhases(preflightRoles, investigationRoles);
  return `# Subagent Orchestration

## Request

${question}

## Selected Research Shape

- Research mode: ${mode.mode}
- Research architecture: ${architecture.name}
- Runtime target: ${runtime}
- Native subagents requested: ${nativeRequested ? 'yes' : 'no'}
- Materialize runtime subagent files: ${materialize ? 'yes' : 'no'}

## Purpose

This file is the execution contract for native or fallback subagent work. It exists so the runtime agent can prove what it delegated, what came back, and how the deep-dive researcher used those findings.

## Truthfulness Rules

- Do not claim native subagents ran unless the runtime actually spawned them.
- Do not create one-off personality workers. Use only the fixed \`ac-*\` roster.
- If native subagents did not run, mark the run as worker-packet fallback.
- Do not create final synthesis inside subagent result files. The deep-dive researcher remains the Research Director.
- If a preflight role surfaces an outcome-changing question, ask the user and wait before investigation roles continue.
- Save or summarize actual subagent findings into \`subagent-results/ac-*.md\`.

## Execution Sequence

### 1. Preflight

Run these before source gathering or analysis:

${preflightRoles.map((role, index) => `${index + 1}. \`ac-${role.key}\` -> write result to \`${resultFileByRole.get(role.key)}\``).join('\n')}

Preflight output must identify:

- the user's likely real goal
- audience and artifact use
- assumptions that would materially change the answer
- whether native subagents should continue or fallback packets are enough

### 2. User Stop Gate

Stop and ask the user if preflight finds a question that changes:

- research scope
- audience
- recommendation direction
- output artifact
- evidence standard
- whether existing project artifacts may be reused

### 3. Wave 1: Evidence And Analysis

Run these after preflight is clear:

${phases.evidenceAndAnalysis.map((role, index) => `${index + 1}. \`ac-${role.key}\` -> write result to \`${resultFileByRole.get(role.key)}\``).join('\n') || '- No evidence/analysis roles selected.'}

Wait for this wave. If there are more than five evidence/analysis roles, split the wave into smaller batches. Do not let evidence or analysis roles write the final report.

### 4. Wave 2: Verification And Critique

Run only after Wave 1 findings exist:

${phases.verificationAndCritique.map((role, index) => `${index + 1}. \`ac-${role.key}\` -> write result to \`${resultFileByRole.get(role.key)}\``).join('\n') || '- No verification/critique roles selected.'}

Wait for this wave. Repair weak source clusters or caveat consequential claims before synthesis.

### 5. Wave 3: Synthesis Architecture

Run only after verification and critique:

${phases.synthesis.map((role, index) => `${index + 1}. \`ac-${role.key}\` -> write result to \`${resultFileByRole.get(role.key)}\``).join('\n') || '- No synthesis role selected.'}

The synthesis architect does not write the final report. It designs the narrative and handoff.

### 6. Wave 4: Research Quality Control

When a durable report, strategy memo, market analysis, launch plan, or web-report source document is required, \`ac-research-quality-controller\` must evaluate the research package before report composition. It should read all same-project research artifacts and all available \`subagent-results/ac-*.md\` files, then write:

\`subagent-results/ac-research-quality-controller.md\`

The controller must identify missing why-questions, underused evidence, weak claims, repair packets, and whether improvement should come from existing materials, targeted new research, asking the user, or caveating.

If repair is needed and existing materials are enough, repair the synthesis or report-composer instructions before doing more research. If new evidence is required, run only the smallest targeted research pass.

### 7. Wave 5: Report Composition

When a report, strategy memo, market analysis, or web-report source document is required, \`ac-report-composer\` must create or summarize a draft under \`subagent-results/ac-report-composer.md\`. The draft must include Questions That Changed The Recommendation, a Claim-Evidence-Confidence-Caveat matrix, assumptions, validation-later items, and downstream handoff notes.

This is a hard gate. If \`ac-report-composer.md\` is missing, the run is still in research/synthesis preparation, not final delivery. The Research Director may write a fallback composer summary, but it must be saved to \`subagent-results/ac-report-composer.md\` and clearly mark whether native subagents actually ran.

### 8. Director Synthesis

The deep-dive researcher must read the subagent results or fallback packet outputs, review \`ac-research-quality-controller\`, review the \`ac-report-composer\` draft when present, and then produce the final report. The final report should cite the subagent result files when they materially changed the conclusion.

## Result Checklist

| Role | Phase | Expected result file | Status |
|---|---|---|---|
${roles.map((role) => `| ac-${role.key} | ${rolePhase(role, preflightRoles)} | \`${resultFileByRole.get(role.key)}\` | Pending until runtime execution writes findings. |`).join('\n')}

Before final delivery, every role marked as used must have an actual result file. For durable report outputs, \`ac-research-quality-controller\` and \`ac-report-composer\` are mandatory.

## Codex Runtime Notes

Codex native subagents require explicit user permission for subagents, delegation, or parallel work. If that permission exists, spawn bounded workers from the fixed roster, wait for their findings, and write the summarized results to the paths above.

## Claude Code Runtime Notes

Claude Code project subagents may be materialized under \`.claude/agents/ac-*.md\` only when the user approves project-level runtime files. If materialized files are not present, use worker packets.

## Fallback Notes

If the current runtime cannot spawn native subagents, run the worker packets sequentially. Preserve the same result schema by filling \`subagent-results/ac-*.md\` summaries or by citing the worker packet outputs directly.
`;
}

function renderSubagentResultsReadme({ roles, preflightRoles, investigationRoles, runtime, nativeRequested, resultFileByRole }) {
  const phases = subagentPhases(preflightRoles, investigationRoles);
  return `# Subagent Results

This directory stores findings from fixed deep-research specialist roles.

## Runtime Status

- Runtime target: ${runtime}
- Native subagents requested: ${nativeRequested ? 'yes' : 'no'}
- If native subagents did not actually run, result files must say "worker-packet fallback" instead of implying native execution.

## Preflight Results

${preflightRoles.map((role) => `- \`ac-${role.key}\`: \`${resultFileByRole.get(role.key)}\``).join('\n')}

## Wave 1: Evidence And Analysis Results

${phases.evidenceAndAnalysis.map((role) => `- \`ac-${role.key}\`: \`${resultFileByRole.get(role.key)}\``).join('\n') || '- None selected.'}

## Wave 2: Verification And Critique Results

${phases.verificationAndCritique.map((role) => `- \`ac-${role.key}\`: \`${resultFileByRole.get(role.key)}\``).join('\n') || '- None selected.'}

## Wave 3: Synthesis Result

${phases.synthesis.map((role) => `- \`ac-${role.key}\`: \`${resultFileByRole.get(role.key)}\``).join('\n') || '- None selected.'}

## Wave 4: Quality Control Result

${phases.qualityControl.map((role) => `- \`ac-${role.key}\`: \`${resultFileByRole.get(role.key)}\``).join('\n') || '- None selected.'}

## Wave 5: Report Composition Result

${phases.composition.map((role) => `- \`ac-${role.key}\`: \`${resultFileByRole.get(role.key)}\``).join('\n') || '- None selected.'}

## Required Schema

Use \`_template.md\` for each \`ac-*.md\` result file.

## Director Rule

The deep-dive researcher owns final synthesis. These files are evidence, critique, architecture, mechanism, quality-control, synthesis, or report-composition inputs. \`ac-research-quality-controller\` may demand repairs, and \`ac-report-composer\` may draft a report, but the Research Director owns final acceptance.

For any durable report output, \`ac-research-quality-controller.md\` and \`ac-report-composer.md\` are mandatory. If either is absent, the final report should fail QA even if the report itself reads well.

## Fixed Roster

${roles.map((role) => `- \`ac-${role.key}\`: ${role.title}`).join('\n')}
`;
}

function renderSubagentResultTemplate() {
  return `# Subagent Result: ac-<role>

## Execution Status

- Native subagent actually spawned: yes/no
- Fallback used instead: yes/no
- Runtime: Codex / Claude Code / fallback
- Date:

## Assigned Task

Describe the bounded task this role received.

## What I Checked

- 

## Findings

| Finding | Evidence or source note | Confidence | Implication |
|---|---|---|---|
|  |  |  |  |

## Assumptions

- 

## Risks And Caveats

- 

## Questions Generated

| Question | Why it matters | Ask user now / research next / assume and proceed |
|---|---|---|
|  |  |  |

## What Should Change In Final Synthesis

- 

## Research Quality Controller Trace

Use this section only for \`ac-research-quality-controller.md\`; delete or leave empty for other roles.

- Research artifacts evaluated:
- Subagent results evaluated:
- Missing why-questions:
- Material utilization verdict:
- Can improve without more research: yes/no/partial
- Repair packets issued:
- Existing-material repair instructions:
- Targeted new-research instructions:
- Report-composer instructions:
- Final report gate:

## Report Composer Trace

Use this section only for \`ac-report-composer.md\`; delete or leave empty for other roles.

- Research artifacts read:
- Subagent results read:
- Quality-controller instructions read:
- Questions That Changed The Recommendation:
- Claim-Evidence-Confidence-Caveat Matrix included: yes/no
- Quality-Control Repairs Applied section included: yes/no
- Material Utilization Notes included: yes/no
- Assumptions preserved:
- Validate Later items preserved:
- Red-team caveats preserved:
- Downstream handoff notes:
`;
}

function renderWorkerPacket(role, context) {
  const qualityControllerAddendum = role.key === 'research-quality-controller' ? `
## Research Quality Controller Hard Gate

This worker must be executed after evidence, analysis, critique, and synthesis-planning roles, and before \`ac-report-composer\`.

Before report composition, save the filled result to:

\`${context.resultFile}\`

The result must include:

- A complete quality-control artifact, not a short proceed memo
- Per-role quality evaluation
- Missing why-questions
- Material utilization review
- A decision on whether the next improvement comes from existing materials, targeted new research, asking the user, or caveating
- Repair packets for weak roles, weak claims, or underused evidence
- Existing-material repair instructions when the collected material is enough
- Targeted new-research instructions only when existing materials are insufficient
- Explicit instructions for \`ac-report-composer\`

Minimum completeness:

- Evaluate every available \`subagent-results/ac-*.md\` file.
- Include at least five meaningful why-questions for strategy, market, product, GTM, or growth work.
- Review source map, evidence store, claim map, question ledger, red-team critique, synthesis plan, and subagent results.
- If the verdict is "Pass", justify why no repair packet is needed for each major material category.

Do not write the final report. Do not request broad new research when existing materials can repair the synthesis. A short "looks good, proceed" note fails the quality gate.
` : '';

  const reportComposerAddendum = role.key === 'report-composer' ? `
## Report Composer Hard Gate

This worker must be executed after all evidence, critique, synthesis-planning, and \`ac-research-quality-controller\` results that are available for this run.

Before the Research Director writes the final report, save the filled result to:

\`${context.resultFile}\`

The result must include:

- A full report draft, not a composition brief
- Questions That Changed The Recommendation
- Claim-Evidence-Confidence-Caveat Matrix
- How \`ac-research-quality-controller\` repair instructions were used
- Material Utilization Notes
- Assumptions Being Carried
- Validate Later Items
- Red-Team Caveats
- Downstream Handoff

Minimum completeness:

- For serious research reports, write the report at MI/corporate research depth.
- Pull evidence into the main body instead of leaving it only in \`source-map.md\`, \`evidence-store.md\`, or \`claim-verification-map.md\`.
- Include concrete mechanisms, alternatives, why/why-not reasoning, caveats, and decision criteria.

Do not claim native subagents ran unless their actual results are available under \`subagent-results/ac-*.md\`.
` : '';

  return `# Worker Packet: ac-${role.key}

## Assigned Role

${role.body}

## Current Research Context

- Research question: ${context.question}
- Research mode: ${context.mode.mode}
- Research architecture: ${context.architecture.name}

## Result File

When this worker packet is executed, save or summarize the result here:

\`${context.resultFile}\`

## Execution Rules

- Return findings for the Research Director, not the final report.
- Separate facts, interpretations, assumptions, and unresolved questions.
- Include source notes or evidence references when available.
- Mark weak or missing evidence plainly.
${qualityControllerAddendum}
${reportComposerAddendum}
`;
}

function rolePhase(role, preflightRoles) {
  if (preflightRoles.some((item) => item.key === role.key)) return 'Preflight';
  if (['source-scout', 'market-mapper', 'case-benchmark-worker', 'mechanism-analyst', 'gtm-strategist', 'technical-docs-reader'].includes(role.key)) return 'Evidence And Analysis';
  if (['evidence-verifier', 'red-team-critic'].includes(role.key)) return 'Verification And Critique';
  if (role.key === 'synthesis-architect') return 'Synthesis';
  if (role.key === 'research-quality-controller') return 'Quality Control';
  if (role.key === 'report-composer') return 'Composition';
  return 'Investigation';
}

function subagentPhases(preflightRoles, selectedRoles) {
  return {
    preflight: preflightRoles,
    evidenceAndAnalysis: selectedRoles.filter((role) => ['source-scout', 'market-mapper', 'case-benchmark-worker', 'mechanism-analyst', 'gtm-strategist', 'technical-docs-reader'].includes(role.key)),
    verificationAndCritique: selectedRoles.filter((role) => ['evidence-verifier', 'red-team-critic'].includes(role.key)),
    synthesis: selectedRoles.filter((role) => role.key === 'synthesis-architect'),
    qualityControl: selectedRoles.filter((role) => role.key === 'research-quality-controller'),
    composition: selectedRoles.filter((role) => role.key === 'report-composer')
  };
}

function renderRoleTable(roles, runtime, nativeRequested) {
  return roles.length
    ? roles.map((role) => `| ac-${role.key} | ${escapeTable(role.responsibility)} | ${nativeRuntimeUse(runtime, nativeRequested, role)} | Use \`worker-packets/ac-${role.key}.md\`. |`).join('\n')
    : '| None selected | Not applicable | Not applicable | Not applicable |';
}

function nativeRuntimeUse(runtime, nativeRequested, role) {
  if (!nativeRequested) return 'Not enabled for this run.';
  if (runtime === 'codex') return `Explicitly spawn a Codex worker for ${role.title}.`;
  if (runtime === 'claude-code') return `Use project subagent \`ac-${role.key}\` when available.`;
  return 'Not available; use fallback.';
}

function renderClaudeSubagent(role) {
  return `---
name: ac-${role.key}
description: ${role.description}
model: inherit
---

# ${role.title}

${role.body.replace(/^#\s+.+$/m, '').trim()}

## Output Requirements

- Return concise findings for the Research Director.
- Separate facts, interpretations, assumptions, and unresolved questions.
- Include source notes or evidence references when available.
- Do not produce the final report unless explicitly asked by the Research Director.
`;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split('\n')) {
    const row = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (row) data[row[1].trim()] = row[2].trim();
  }
  return data;
}

function stripFrontmatter(text) {
  return String(text || '').replace(/^---\n[\s\S]*?\n---\n?/, '');
}

function extractSection(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(new RegExp(`(?:^|\\n)##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i'));
  return match?.[1] || '';
}

function extractBullets(section) {
  return section.split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim());
}

function firstBullet(section) {
  return extractBullets(section)[0] || '';
}

function firstParagraph(section) {
  return section.split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('|') && !part.startsWith('- ')) || '';
}

function titleFromKey(key) {
  return key.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeTable(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
}
