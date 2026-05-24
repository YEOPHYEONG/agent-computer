# Research Modes

Agent Computer research should choose the mode that matches the user's real job, not merely the topic.

## Core Rule

Deep research is a research operating loop:

1. define the research contract
2. choose Deep, Wide, or Hybrid mode
3. choose the research architecture
4. define source policy
5. gather evidence
6. generate better questions
7. verify claims
8. synthesize what helps the user act or decide

If a research direction would materially change the output, ask the user and wait.

Use [Research Architectures](research-architectures.md) after mode selection. Mode controls breadth. Architecture controls whether the final reasoning should behave like a strategy memo, GTM plan, growth case reconstruction, market map, technical implementation brief, source-heavy evidence review, or benchmark synthesis.

## Question Engine

Questions drive the research loop.

After each pass, `deep-dive-researcher` should generate:

- intent questions
- evidence questions
- mechanism questions
- counterfactual questions
- transfer questions
- handoff questions

Then it should choose the next-best question and decide whether to answer it through research or ask the user. Ask the user only when the answer changes the research contract, mode, audience, scope, source policy, narrative, or downstream artifact.

Every substantive question should be routed into one of four lanes:

| Lane | Use when | Behavior |
|---|---|---|
| Ask User Now | The answer is user-known and materially changes the output. | Ask clearly, then stop and wait. |
| Research Next | The answer can be investigated through sources or local files. | Turn it into the next research action. |
| Assume And Proceed | The answer matters, but a reasonable assumption can be made without blocking. | State the assumption and continue. |
| Validate Later | The answer depends on real-world user behavior, sales, retention, conversion, or implementation. | Mark it as future validation only when relevant. |

User interviews, beta tests, pricing experiments, and retention validation are not default sections. Add them only when the task is about product, market, positioning, GTM, onboarding, pricing, retention, monetization, or another claim that cannot be proven by desk research alone.

For high-intent research, the final synthesis should include:

- Questions That Changed The Recommendation
- Assumptions Being Carried
- Evidence Confidence
- Selected Next-Best Question

The question ledger is not enough by itself. The final report should show how the best questions changed the recommendation or confidence level.

## Deep Mode

Use Deep Mode for one hard question.

Good fit:

- strategy or positioning
- causal/mechanism analysis
- conflicting evidence
- decisions with tradeoffs
- internal context plus external evidence

Artifacts:

- `research-contract.md`
- `architecture-decision.md`
- `question-ledger.md`
- `source-map.md`
- `evidence-store.md`
- `hypothesis-map.md`
- `red-team-critique.md`
- `synthesis-plan.md`
- `claim-verification-map.md`
- `<topic>_deep-research.md`

## Wide Mode

Use Wide Mode for many independent items that share a rubric.

Good fit:

- many companies, tools, newsletters, customers, papers, or examples
- comparison tables
- datasets
- profile libraries
- coverage-first research

Artifacts:

- item list
- rubric/schema
- worker packets or per-item research notes
- source/citation checks
- retry log for weak rows
- final comparison table or dataset

Agent Computer should not silently spawn runtime subagents. If the user explicitly asks for subagents, delegation, or parallel agent work, or approves a native-subagent gate, and the runtime supports it, Wide Mode may use them. In Codex, project-scoped custom agents live under `.codex/agents/ac-*.toml`. Otherwise, process worker packets sequentially while preserving the same schema.

## Hybrid Mode

Use Hybrid Mode when broad coverage must feed deep synthesis.

Good fit:

- "research examples and derive a formula"
- "compare many tools and recommend a strategy"
- "map a market and choose a launch wedge"

Hybrid flow:

1. Wide coverage under a shared rubric
2. item-level validation
3. pattern clustering
4. Deep synthesis
5. report, PPT, email, or strategy handoff

## Source Policy

Use source tiers:

- Tier 1: official/company docs, filings, primary data, interviews, academic papers, legal docs, product docs.
- Tier 2: trusted media, respected industry analysis, reputable expert writing.
- Tier 3: personal blogs, forums, social posts, community discussions.
- User-provided: local files, PDFs, notes, internal documents.
- Private connectors: email, Drive, Slack, CRM, and account data; use only with explicit permission.

Treat user-provided documents as source material, but do not convert every claim inside them into verified external fact unless the claim is checked.

## Handoff

When research feeds a report, deck, email, or agent build, hand off:

- research contract
- source map
- evidence store
- claim verification map
- question ledger
- question-to-synthesis trace
- unsupported claims
- recommended narrative angle
- source/reference layer
