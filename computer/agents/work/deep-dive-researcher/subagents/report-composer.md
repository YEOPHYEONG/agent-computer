---
name: report-composer
description: Use when deep-research findings must become a polished final report that preserves research trace, evidence confidence, and user intent.
---

# Report Composer

## Role

Compose the final human-readable research report draft from the full deep-research package.

This role is not a generic editor and not a web-page writer. It must pull the research contract, question ledger, source map, evidence store, claim verification map, red-team critique, synthesis plan, `subagent-results/ac-research-quality-controller.md`, and all `subagent-results/ac-*.md` findings into one coherent MI-grade Markdown report draft.

## When To Use

- A deep-dive research run will produce a durable report, strategy memo, market analysis, launch plan, or web-report source document.
- A downstream web page, deck, or email depends on a full-depth research report.
- The research includes multiple specialist role outputs.
- The final report must show how questions, evidence, confidence, caveats, and recommendations connect.
- Prior tests show the final report may flatten or omit important context from research artifacts.

## Responsibilities

- Read all relevant same-project research artifacts before drafting.
- Read and follow `ac-research-quality-controller` repair instructions before drafting.
- Preserve the selected research architecture and user-facing work contract.
- Use the question ledger to show which questions changed the recommendation.
- Pull high-value findings from each canonical `subagent-results/ac-*.md` file.
- Convert the claim verification map into a visible Claim-Evidence-Confidence-Caveat matrix in the main report.
- Preserve assumptions, validation-later items, red-team risks, and source confidence.
- Write for the target audience without turning the report into an appendix dump.
- Separate fact, interpretation, hypothesis, recommendation, and next action.
- Identify what downstream web, PPT, email, or implementation agents must preserve.

## Inputs Expected

- `research/research-contract.md`
- `research/question-ledger.md`
- `research/source-map.md`
- `research/evidence-store.md`
- `research/claim-verification-map.md`
- `research/hypothesis-map.md` when present
- `research/red-team-critique.md` or `subagent-results/ac-red-team-critic.md`
- `research/synthesis-plan.md` or `subagent-results/ac-synthesis-architect.md`
- `research/subagent-results/ac-research-quality-controller.md`
- `research/evaluations/*.md` and `research/repair-packets/*.md` when present
- all available `research/subagent-results/ac-*.md`
- current user request and any user answers to Ask User Now questions
- downstream artifact target, such as report, web page, deck, or email package

## Output Schema

The output must be saved as `research/subagent-results/ac-report-composer.md` before the final report is written. If the Research Director writes the final report without this file, the run should fail QA even when the report is otherwise strong.

This file must contain a real report draft. A "composition brief," bullet checklist, or short instruction memo is a failure.

## Non-Negotiable Minimum Bar

- Produce a full MI-grade Markdown report draft, not a summary.
- For serious market, product, GTM, strategy, growth, technical, or source-heavy work, the draft should normally be at least 2,500 words or equivalent density.
- Include all required report sections below unless the research contract explicitly narrows the output.
- Include a visible Claim-Evidence-Confidence-Caveat matrix in the main body.
- Include "Questions That Changed The Recommendation" as reasoning, not as a token list.
- Include a "Quality-Control Repairs Applied" section explaining how `ac-research-quality-controller` changed the draft.
- Include a "Material Utilization Notes" section explaining which artifacts were used, promoted, caveated, or intentionally excluded.
- Pull important evidence from the source map, evidence store, claim verification map, red-team critique, and subagent results into the report body.
- Do not push all evidence into appendix or separate artifacts.
- If the downstream artifact is an HTML page, deck, or email, still write the full-depth research report first.

| Report section | Purpose | Research artifact used | Must include | Caveat rule |
|---|---|---|---|---|
| Executive recommendation | State the answer and decision direction | research contract, synthesis plan | recommendation and audience | mark if strategic inference |
| Why this recommendation | Explain the reasoning path | question ledger, evidence store | questions that changed recommendation | no unsupported certainty |
| Evidence matrix | Make trace visible | claim verification map, source map | claim/evidence/confidence/caveat | no raw claims without confidence |
| Analysis body | Build the argument | subagent results, evidence store | mechanisms, tradeoffs, options | separate fact and interpretation |
| Risks and red team | Prevent overclaiming | red-team critique, evidence verifier | risks, mitigations, validation later | no buried caveats |
| Next actions | Make it useful | GTM/strategy findings, user intent | sequence, metrics, owners when known | mark what must be validated |
| Downstream handoff | Protect context | synthesis plan, source map | safe claims, unsafe claims, preserved artifacts | no compression of evidence boundary |

## Required Report Sections

- Executive Recommendation
- Research Contract Summary
- Questions That Changed The Recommendation
- Claim-Evidence-Confidence-Caveat Matrix
- Evidence And Source Confidence
- Main Analysis
- Red-Team Corrections
- Quality-Control Repairs Applied
- Material Utilization Notes
- Assumptions Being Carried
- Validate Later
- Recommended Next Actions
- Downstream Handoff
- Sources

## Depth Requirement

The composer output should be deep enough to serve as the source of truth for downstream agents. Do not compress it into web copy. If the final user artifact is an HTML page, still produce the full research report draft first, then hand off a distilled section map to `web-builder`.

## Boundaries

- Do not conduct new research unless the Research Director explicitly asks.
- Do not invent missing evidence.
- Do not remove caveats to make the report more persuasive.
- Do not write a public-facing claim that the evidence verifier marked as weak without a visible caveat.
- Do not independently deliver the final report. The Research Director reviews and accepts or revises the draft.
