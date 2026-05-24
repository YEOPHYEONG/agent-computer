# Deep-Dive Researcher Subagents

These are canonical specialist role specs for the `deep-dive-researcher` Agent App.

They are not ad-hoc personalities. Do not create one-off named subagents such as `Tesla` or `Copernicus` as product behavior. If the runtime needs native subagents, map work to this fixed roster.

## Codex Native Custom Agents

For Codex, the native custom-agent definitions live in project-scoped TOML files:

`/.codex/agents/ac-*.toml`

Those TOML files are what Codex can load as custom agents. The markdown files in this directory remain the canonical Agent Computer product specs and fallback worker-packet source.

Codex does not spawn subagents automatically. For high-value deep research, the Research Director should ask the user for explicit approval before using native subagents. If approved, spawn the matching `.codex/agents/ac-*.toml` agents and save or summarize each result under:

`workspace/projects/<project-slug>/research/subagent-results/ac-*.md`

If native subagents are not approved or unavailable, use worker packets and record the fallback. Do not claim native subagents ran.

## Fixed Roster

| Role | Phase | Purpose |
|---|---|---|
| `intent-analyst` | Preflight | Clarify real objective, decision, audience, output use, and outcome-changing assumptions. |
| `research-architect` | Preflight | Select mode, architecture, framework mix, source policy, role plan, and stop condition. |
| `source-scout` | Evidence | Find, classify, and summarize relevant sources. |
| `case-benchmark-worker` | Evidence | Research comparable cases under a shared rubric. |
| `evidence-verifier` | Verification | Check claims, metrics, dates, source trust, and confidence. |
| `mechanism-analyst` | Analysis | Explain causal mechanisms, constraints, transferability, and failure modes. |
| `market-mapper` | Analysis | Map markets, categories, competitors, alternatives, segments, and whitespace. |
| `gtm-strategist` | Analysis | Translate evidence into target, offer, channel, loop, experiments, and metrics. |
| `technical-docs-reader` | Evidence | Extract implementation guidance from official technical docs. |
| `red-team-critic` | Critique | Challenge overclaims, weak logic, missing alternatives, and risks. |
| `synthesis-architect` | Synthesis | Design the final narrative while preserving evidence boundaries. |
| `research-quality-controller` | Quality Control | Evaluate specialist outputs, find missing why-questions, create repair packets, and decide whether existing materials can improve the report before new research is requested. |
| `report-composer` | Composition | Draft the final human-readable report from all research artifacts without losing trace, caveats, or user intent. |

## Runtime Rule

- Ordinary request: use worker packets and sequential director passes.
- Complex/high-value request: propose native subagents and wait for approval.
- Explicit subagent request: use native runtime subagents when available.
- Native runtime unavailable: use the same role specs as worker packets.
- Every run creates `runtime-subagent-plan.md`, `subagent-orchestration.md`, `subagent-results/README.md`, `subagent-results/_template.md`, and `worker-packets/ac-*.md`.
- Use wave-based orchestration instead of one large parallel batch:
  - Wave 0: `intent-analyst`, `research-architect`
  - Wave 1: evidence and analysis roles
  - Wave 2: `evidence-verifier`, `red-team-critic`
  - Wave 3: `synthesis-architect`
  - Wave 4: `research-quality-controller`
  - Wave 5: `report-composer`
- Codex defaults to six concurrent open agent threads. Keep waves small, split oversized waves, and wait after each wave before starting the next.
- When native subagents actually run, save or summarize findings under `workspace/projects/<project-slug>/research/subagent-results/ac-*.md`.
- Result files must use canonical `ac-<role>.md` names. Do not save role outputs as `market-mapper.md`, `gtm-option-space.md`, nicknames, or combined personality names.
- If the runtime selected a role, that role must have a canonical `subagent-results/ac-<role>.md` file before final delivery. A related note elsewhere in `research/` is useful material, but it is not a substitute for the canonical role result.
- If one native worker covered multiple roles, split the result into each selected canonical role file before synthesis.
- Preflight outputs are not optional. If any specialist subagent result exists, `subagent-results/ac-intent-analyst.md` and `subagent-results/ac-research-architect.md` must also exist or the run is incomplete.
- If one runtime worker covers two logical roles, split the saved findings into the canonical role result files or explicitly mark one file as a fallback summary while preserving both `ac-*` result paths.
- `research-quality-controller` runs after evidence/analysis/critique roles and before `report-composer` for any durable report, strategy memo, market analysis, launch plan, or web-report source document.
- The quality controller must check whether the next improvement should come from better use of existing materials, a targeted research retry, or asking the user.
- `report-composer` runs after `research-quality-controller` when a durable report, strategy memo, or web-report source document will be produced. It drafts the report; the Research Director still owns final acceptance.
- For serious reports, `ac-report-composer.md` is required as a full draft. Do not skip it and write the final report directly from scattered artifacts.
- Do not claim native subagents ran unless those result files contain actual findings or faithful summaries.

The Research Director owns final synthesis.
