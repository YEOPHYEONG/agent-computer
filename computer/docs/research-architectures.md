# Research Architectures

Deep research in Agent Computer has two separate choices:

- Research mode: how broad the execution should be. Use Deep, Wide, or Hybrid.
- Research architecture: how the reasoning should be shaped for the user's task.

Mode controls breadth. Architecture controls synthesis.

## Required Director Step

For serious research, the deep-dive researcher acts as a research director before writing the report.

It must:

1. Identify the user's surface request.
2. Infer the likely decision, use, or next action behind the request.
3. Ask and wait if that inference would materially change the output.
4. Choose Deep, Wide, or Hybrid mode.
5. Choose one research architecture.
6. Write an `architecture-decision.md` artifact.
7. Create a `runtime-subagent-plan.md`, `subagent-orchestration.md`, `subagent-results/README.md`, `subagent-results/_template.md`, and architecture-specific `worker-packets/ac-*.md`.
8. Always prepare preflight worker packets for `ac-intent-analyst` and `ac-research-architect`.
9. If native subagents actually run, save or summarize findings under `subagent-results/ac-*.md`.
10. Use `ac-report-composer` when a durable report, market analysis, strategy memo, or web-report source document is produced.
11. Generate architecture-specific questions, hypotheses, red-team critique, synthesis plan, and report-composition trace.

Native runtime subagents are optional and permission-bound. Codex native custom agents are project-scoped TOML files under `.codex/agents/ac-*.toml`; they require an explicit user request for subagents, delegation, or parallel agent work, or a yes answer to a clear native-subagent approval gate. Claude Code project subagents can be materialized from the same specs only after explicit approval. Without native runtime support, the worker packets preserve the same specialist structure.

Use canonical role names only. Do not create ad-hoc personality subagents as product behavior. Do not claim native subagents ran unless their result files contain actual findings or faithful summaries.

## Architecture Catalog

### Strategic Decision Research

Use when the user needs to decide what to do, compare paths, resolve tradeoffs, or make a recommendation under uncertainty.

Required thinking:

- options
- decision criteria
- evidence by option
- tradeoffs and constraints
- recommendation
- counterargument
- next-best action

### Product / GTM Strategy Research

Use for product, positioning, launch, pricing, channel, onboarding, retention, sales, monetization, or business-model questions.

Required thinking:

- target segment
- problem or job-to-be-done
- offer and positioning
- channel strategy
- acquisition, conversion, and retention loop
- experiment plan
- success metrics
- assumptions and validation-later items when user behavior cannot be proven by desk research

### Growth Case Reconstruction

Use when the user asks how a company, brand, creator, product, community, or channel grew.

Required thinking:

- starting wedge
- growth timeline
- inflection points
- milestone-level tactics
- channel, message, offer, and operating mechanics
- why each step worked then
- evidence strength by milestone
- transferable playbook
- non-transferable context

### Market / Competitive Landscape

Use when the user asks about a market, category, competitor set, alternatives, positioning, or whitespace.

Required thinking:

- category definition
- segmentation
- direct, indirect, and substitute competitors
- comparison dimensions
- market dynamics
- crowded areas
- whitespace
- positioning implications

### Technical / Implementation Research

Use when the user asks how to implement, integrate, debug, configure, secure, or evaluate a technical system.

Required thinking:

- goal and environment
- official or primary documentation
- architecture or integration approach
- implementation steps
- edge cases
- security/version/platform assumptions
- concrete verification plan

### Source-Heavy Evidence Review

Use when the user provides a PDF, report, paper, transcript, deck, local note, or source document and wants it preserved, interpreted, or transformed.

Required thinking:

- source scope
- source claim map
- data, interpretation, recommendation, and rhetoric separation
- visual/table/context notes when relevant
- external verification needs
- downstream preservation guidance

### Wide Benchmark To Deep Synthesis

Use when the user wants many cases, examples, tools, companies, or brands researched and then turned into a formula, framework, strategy, or recommendation.

Required thinking:

- inclusion criteria
- shared rubric
- case or item matrix
- patterns
- exceptions and outliers
- derived formula or framework
- transfer rules
- application to the user's context

## Selection Heuristics

| User signal | Likely architecture |
|---|---|
| what should we do, decision, tradeoff, recommendation | Strategic Decision Research |
| product, GTM, launch, pricing, channel, positioning, business model | Product / GTM Strategy Research |
| how did X grow, growth journey, milestones, viral, community | Growth Case Reconstruction |
| market, competitors, landscape, category, alternatives, whitespace | Market / Competitive Landscape |
| API, SDK, implementation, architecture, debug, docs, install | Technical / Implementation Research |
| this PDF/report/deck/paper, based on the source, source document | Source-Heavy Evidence Review |
| cases, examples, benchmark, compare, success formula, many | Wide Benchmark To Deep Synthesis |

If two architectures fit, choose the one that controls the final synthesis.

Examples:

- "뉴스레터 성공사례를 조사해서 성공 공식으로 PPT 만들어줘" -> Hybrid Mode + Wide Benchmark To Deep Synthesis.
- "Farnam Street의 성장 과정을 벤치마킹 가능한 수준으로 조사해줘" -> Deep Mode + Growth Case Reconstruction.
- "worLd-Lim 시장 포지셔닝과 비즈니스 모델을 조사해줘" -> Deep Mode + Product / GTM Strategy Research.

## Required Artifacts

When a serious research task creates files, preserve:

- `research-contract.md`
- `architecture-decision.md`
- `source-map.md`
- `evidence-store.md`
- `question-ledger.md`
- `hypothesis-map.md`
- `red-team-critique.md`
- `synthesis-plan.md`
- `runtime-subagent-plan.md`
- `subagent-orchestration.md`
- `subagent-results/README.md`
- `subagent-results/_template.md`
- `worker-packets/ac-intent-analyst.md`
- `worker-packets/ac-research-architect.md`
- `worker-packets/ac-report-composer.md` when a durable report or web-report source document is required
- `worker-packets/ac-*.md`
- `subagent-results/ac-report-composer.md` when native/fallback report composition is executed
- `<topic>_deep-research.md`
- `<topic>_research-qa.md` when QA is requested or downstream artifacts depend on the research

For durable reports, `subagent-results/ac-report-composer.md` is a hard gate. The final report may not claim `ac-report-composer` authorship or composition unless that file exists and contains the composition trace.

## Human-In-The-Loop Rule

The agent may infer an architecture. If that architecture changes what the user will receive, ask for confirmation and wait.

Example:

```text
제가 보기엔 이 요청의 핵심은 사례 수집보다 재현 가능한 성공 공식 도출입니다. 이 방향으로 진행해도 될까요?
```

Do not over-ask when the task is obvious and low-risk. Document conversion, source preservation, and explicit implementation research usually need fewer broad intent questions.
