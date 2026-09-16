# Deep-Dive Researcher Subagents

These are canonical specialist role specs for the `deep-dive-researcher` Agent App.

They are not ad-hoc personalities. Do not create one-off named subagents such as `Tesla` or `Copernicus` as product behavior. If the runtime needs native subagents, map work to this fixed roster.

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
| `report-composer` | Composition | Draft the final human-readable report from all research artifacts without losing trace, caveats, or user intent. |

## Runtime Rule

- Ordinary request: use worker packets and sequential director passes.
- Complex/high-value request: propose native subagents and wait for approval.
- Explicit subagent request: use native runtime subagents when available.
- Native runtime unavailable: use the same role specs as worker packets.
- Every run creates `runtime-subagent-plan.md`, `subagent-orchestration.md`, `subagent-results/README.md`, `subagent-results/_template.md`, and `worker-packets/ac-*.md`.
- When native subagents actually run, save or summarize findings under `workspace/projects/<project-slug>/research/subagent-results/ac-*.md`.
- Result files must use canonical `ac-<role>.md` names. Do not save role outputs as `market-mapper.md`, `gtm-option-space.md`, nicknames, or combined personality names.
- Preflight outputs are not optional. If any specialist subagent result exists, `subagent-results/ac-intent-analyst.md` and `subagent-results/ac-research-architect.md` must also exist or the run is incomplete.
- If one runtime worker covers two logical roles, split the saved findings into the canonical role result files or explicitly mark one file as a fallback summary while preserving both `ac-*` result paths.
- `report-composer` is the last specialist role when a durable report, strategy memo, or web-report source document will be produced. It drafts the report; the Research Director still owns final acceptance.
- Do not claim native subagents ran unless those result files contain actual findings or faithful summaries.

The Research Director owns final synthesis.
