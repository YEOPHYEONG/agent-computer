# Deep Research Report

## Short Answer


## Research Question


## Depth Standard

- Final Markdown standard: market-intelligence / corporate research report
- Downstream web/deck/email requested: yes / no
- If yes, downstream agent: `web-builder` / `ppt-builder` / `image-deck-maker` / `visual-asset-maker` / `email-operator`
- Research report stands alone before downstream artifact: yes / no


## Research Contract

| Field | Value |
|---|---|
| Objective |  |
| User decision or next action |  |
| Audience |  |
| Output artifact |  |
| Scope |  |
| Exclusions |  |
| Freshness requirement |  |
| Source priority |  |
| Private/local source permissions |  |
| Depth or coverage budget |  |
| Uncertainty threshold |  |
| Confirmation gates |  |
| Stop condition |  |
| Downstream handoff |  |


## Research Mode

- Mode: Deep / Wide / Hybrid
- Why this mode:
- What would make the mode change:


## Research Architecture

- Architecture: Strategic Decision Research / Product / GTM Strategy Research / Growth Case Reconstruction / Market / Competitive Landscape / Technical / Implementation Research / Source-Heavy Evidence Review / Wide Benchmark To Deep Synthesis
- Why this architecture:
- Rejected architectures:
- What would make the architecture change:


## Architecture-Specific Workplan

- Required questions:
- Required evidence:
- Required artifacts:
- Final synthesis structure:
- QA criteria:


## Hypothesis Map

| Hypothesis | Evidence for | Evidence against | Confidence | What would change it |
|---|---|---|---|---|
|  |  |  | High / Medium / Low |  |


## Red-Team Critique

| Risk | Why it could be wrong | How to test or caveat it | Status |
|---|---|---|---|
|  |  |  | Open / Mitigated / Deferred |


## Synthesis Plan

- Narrative spine:
- Sections to include:
- Claims safe to use:
- Claims to caveat:
- Evidence to keep in appendix/source map:


## Runtime Subagent Plan

- Runtime target: Codex / Claude Code / fallback worker packets
- Native subagents requested: yes / no
- Materialized runtime files: yes / no
- Research Director rule:
- Fixed roster rule: use canonical `ac-*` roles only; no ad-hoc personality subagents.
- Codex native custom-agent definitions: `.codex/agents/ac-*.toml`
- Native subagent approval gate:
  - Ask user before spawning native subagents for serious research.
  - If approved, spawn matching `.codex/agents/ac-*.toml` custom agents.
  - If unavailable or not approved, use worker packets and record fallback.
- Wave policy:
  - Wave 0: preflight
  - Wave 1: evidence and analysis
  - Wave 2: verification and critique
  - Wave 3: synthesis architecture
  - Wave 4: research quality control
  - Wave 5: report composition
  - Respect Codex's default six-thread cap; split large waves and wait between waves.
  - Never run `ac-report-composer` before `ac-research-quality-controller` exists.
- Preflight roles:
  - `ac-intent-analyst`
  - `ac-research-architect`
- Specialist roles selected:
  - `ac-source-scout`
  - `ac-evidence-verifier`
  - `ac-mechanism-analyst`
  - `ac-red-team-critic`
  - `ac-synthesis-architect`
  - `ac-research-quality-controller`
  - `ac-report-composer`
- Worker packet fallback path: `workspace/projects/<project-slug>/research/worker-packets/ac-*.md`
- Native subagent result path when actually executed: `workspace/projects/<project-slug>/research/subagent-results/ac-*.md`
- Orchestration contract: `workspace/projects/<project-slug>/research/subagent-orchestration.md`
- Result schema: `workspace/projects/<project-slug>/research/subagent-results/_template.md`
- Codex boundary: spawn native subagents only when the user explicitly asks for subagents, delegation, or parallel agent work, or answers yes to the native-subagent approval gate.
- Claude Code boundary: materialize `.claude/agents/ac-*.md` only after explicit user approval.
- Truthfulness rule: do not claim native subagents ran unless actual findings are written or summarized in `subagent-results/ac-*.md`.


## Source Policy

| Tier | Source type | How it is used |
|---|---|---|
| Tier 1 | Official or primary sources |  |
| Tier 2 | Trusted secondary sources |  |
| Tier 3 | Forums, social, community, weaker signals |  |
| User-provided | Local files, PDFs, notes, internal documents |  |
| Private connectors | Email, Drive, Slack, CRM, etc. |  |


## Research Frame


## Memory-Aware User Usefulness Frame

- Relevant user/workspace memory:
- User's likely job-to-be-done:
- What would be most useful to answer:
- Working assumptions:


## Research Pass Log

| Pass | Focus | Sources or evidence checked | What changed | Next question generated |
|---|---|---|---|---|
| Scout |  |  |  |  |


## Socratic Question Engine

| Question Type | Lane | Question | Why it matters | Research action or user checkpoint |
|---|---|---|---|---|
| Intent | Ask User Now / Assume And Proceed |  |  |  |
| Evidence | Research Next |  |  |  |
| Mechanism | Research Next |  |  |  |
| Counterfactual | Research Next |  |  |  |
| Transfer | Assume And Proceed / Validate Later |  |  |  |
| Handoff | Assume And Proceed |  |  |  |


## Question Routing Lanes

| Lane | Questions | Required behavior |
|---|---|---|
| Ask User Now |  | Ask, then stop and wait. |
| Research Next |  | Convert into research actions. |
| Assume And Proceed |  | State assumptions clearly. |
| Validate Later |  | Use only when real-world behavior must prove the claim. |

### Selected Next-Best Question

- Question:
- Why this question now:
- Answer through research or ask user:
- If research: next sources/actions:
- If ask user: exact question and why the agent must wait:


## Question Ledger

| Question | Why it matters to the user | Status | Evidence used | Next action |
|---|---|---|---|---|
|  |  | New / Answered / Unresolved / Ask user |  |  |


## User Checkpoints And Assumptions

- Questions asked to the user:
- Assumptions made when continuing without waiting:
- Direction chosen and why:


## Questions That Changed The Recommendation

| Question | Effect on recommendation | Evidence or assumption used |
|---|---|---|
|  |  |  |


## Research Quality Control Trace

- Quality controller result: `workspace/projects/<project-slug>/research/subagent-results/ac-research-quality-controller.md`
- Quality gate: Pass / Repair before report-composer / Ask user / Targeted new research
- If Fail, do not deliver the final report yet; repair the research package or ask the user.
- Missing why-questions found:
- Underused existing materials:
- Can improve without more research: yes / no / partial
- Repair packets created:
- Controller instructions carried into report-composer:


## Report Composition Trace

- Report composer result: `workspace/projects/<project-slug>/research/subagent-results/ac-report-composer.md`
- Composer gate: Pass / Fail
- If Fail, do not deliver the final report yet; create `ac-report-composer.md` first.
- Selected native role result completeness: Pass / Fail
- Missing selected role files:
  - `workspace/projects/<project-slug>/research/subagent-results/ac-<role>.md`
- Non-canonical role artifacts repaired:
  - If a role output was saved elsewhere, summarize it into the canonical `ac-*` file before final synthesis.
- Research artifacts read:
- Subagent results read:
- Quality-controller result read:
- Sections carried into the final report:
- Caveats preserved:
- Director review note:


## Assumptions Being Carried

-


## Evidence Confidence / Claim-Evidence-Confidence-Caveat Matrix

| Claim | Evidence | Confidence | Caveat |
|---|---|---|---|
|  |  | High / Medium / Low |  |


## Source Map


## Evidence Store

| Evidence ID | Claim or fact | Source | Tier | Confidence | Notes |
|---|---|---|---|---|---|
| E1 |  |  |  | High / Medium / Low |  |


## Claim Verification Map


## Targeted Retry Log

| Item or claim | Why it is weak | Retry action | Status |
|---|---|---|---|
|  |  |  | Not started / Retried / Resolved / Deferred |


## Wide Or Hybrid Worker Packets

Use this section only for Wide or Hybrid Mode.

| Job ID | Item | Rubric | Sources expected | Status |
|---|---|---|---|---|
|  |  |  |  |  |


## DIKI Synthesis

### Data


### Information


### Knowledge


### Insight


## Key Findings


## Evidence And Source Trust


## Mechanism Analysis


## Implications


## Open Questions


## Next Research Pass

- Highest-value next question:
- Why it would help:
- What sources or actions to check next:
- Whether user direction is needed:


## Downstream Handoff

- Recommended next agent:
- Artifacts to hand off:
- Claims safe to use:
- Claims to avoid or caveat:
- Suggested narrative angle:
- Source/reference layer:


## Why Stop Here

- Stop condition reached:
- Confidence level:
- Remaining risk:


## Limitations


## Sources
