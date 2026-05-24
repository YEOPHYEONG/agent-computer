# Workflow

1. Define the user's likely real objective, decision, or desired next action.
2. Draft a research contract:
   - objective
   - user decision or next action
   - audience
   - output artifact
   - scope and exclusions
   - freshness requirement
   - source priority
   - private/local source permissions
   - depth or coverage budget
   - uncertainty threshold
   - confirmation gates
   - stop condition
   - downstream handoff target
3. If the research contract contains an outcome-changing assumption, ask the user a concise question and wait.
   - Do not proceed under assumptions merely because the user requested execution.
   - Proceed under assumptions only when the user explicitly says to use reasonable assumptions, not to ask, or to continue despite uncertainty.
   - Before the user answers, create only preflight notes, not the final research report or downstream artifacts.
4. Choose the research mode:
   - Deep Mode for one hard question, strategic judgment, mechanisms, or conflicting evidence
   - Wide Mode for many independent items with the same rubric
   - Hybrid Mode when broad case coverage must feed deep synthesis
5. Choose the research architecture:
   - Strategic Decision Research for decision, recommendation, option, or tradeoff work
   - Product / GTM Strategy Research for product, positioning, launch, pricing, channel, monetization, retention, or business-model work
   - Growth Case Reconstruction for company, brand, creator, product, newsletter, community, or channel growth journeys
   - Market / Competitive Landscape for category, market, competitor, alternative, or whitespace mapping
   - Technical / Implementation Research for implementation, API, SDK, integration, debugging, platform, security, or official-docs work
   - Source-Heavy Evidence Review for PDFs, reports, papers, decks, transcripts, or local source documents
   - Wide Benchmark To Deep Synthesis for many cases/examples/tools/companies that must become a formula, framework, or recommendation
6. If the architecture choice changes what the user will receive, ask for confirmation and wait.
7. Write the architecture decision:
   - selected architecture
   - why it fits
   - rejected architectures
   - what would make the architecture change
   - architecture-specific workplan
8. Prepare the runtime subagent plan:
   - select only canonical role specs from `subagents/`
   - do not invent ad-hoc named subagents
   - check whether Codex native custom agents exist under `.codex/agents/ac-*.toml`
   - remember that Codex only spawns subagents after explicit user approval or an explicit user request for subagents/delegation/parallel agent work
   - for serious market, strategy, product, GTM, technical, or source-heavy research, ask for native subagent approval before investigation begins when parallel specialist work would materially improve quality
   - always include preflight roles: `intent-analyst` and `research-architect`
   - select investigation roles based on the research architecture
   - include `research-quality-controller` when the run will produce a durable report, market analysis, strategy memo, or web-report source document
   - include `report-composer` when the run will produce a durable report, market analysis, strategy memo, or web-report source document
   - write `runtime-subagent-plan.md`
   - write `subagent-orchestration.md` with wave order, stop gates, and truthfulness rules
   - use wave-based orchestration instead of one large parallel batch:
     - Wave 0: preflight roles
     - Wave 1: evidence and analysis roles
     - Wave 2: verification and critique roles
     - Wave 3: synthesis architecture
     - Wave 4: research quality control
     - Wave 5: report composition
   - keep Codex's default six-thread cap in mind; if a wave has more than five roles, split it into smaller batches and wait between batches
   - never run `ac-report-composer` in the same wave as evidence, analysis, verification, critique, synthesis, or quality-control roles
   - write `subagent-results/README.md` and `subagent-results/_template.md`
   - write role-specific worker packets under `worker-packets/ac-*.md`
   - use native Codex subagents only when the user explicitly asks for subagents, delegation, or parallel agent work, or when the user answers yes to the native-subagent approval question
   - materialize Claude Code `.claude/agents/ac-*.md` files only with explicit user approval
   - if native subagents actually run, save or summarize findings under `subagent-results/ac-*.md`
   - do not claim native subagents ran unless `subagent-results/ac-*.md` contains actual findings or summaries
   - never save subagent outputs under non-canonical names such as `market-mapper.md`, `gtm-option-space.md`, or personality names
   - every selected native role must have its own canonical `subagent-results/ac-<role>.md` before a serious report is delivered
   - if one native worker covers multiple logical roles, split or summarize the output into each selected canonical role file
   - if role findings were accidentally saved elsewhere, create the canonical `subagent-results/ac-<role>.md` summary before synthesis
   - if any investigation result exists, preserve the preflight results as `subagent-results/ac-intent-analyst.md` and `subagent-results/ac-research-architect.md`
   - keep the deep-dive researcher as Research Director and owner of final synthesis
9. Run the preflight subagent phase:
   - `intent-analyst` clarifies real objective, audience, artifact, and outcome-changing assumptions
   - `research-architect` confirms mode, architecture, framework mix, source policy, role plan, and stop condition
   - if native subagents were explicitly requested or approved, run these roles first
   - otherwise run their worker packets internally
   - if preflight reveals an outcome-changing question, ask and wait before investigation starts
   - if the user approved native subagents but the runtime did not actually spawn them, record the fallback clearly in `subagent-orchestration.md`
10. Define the source policy:
   - Tier 1: official or primary sources
   - Tier 2: trusted secondary sources
   - Tier 3: forums, social posts, and weak signals
   - User-provided: preserve faithfully, but mark as document claims unless externally verified
   - Private connectors: use only with explicit permission
11. Review existing workspace memory, especially `computer/memory/user-preferences.md`, `computer/memory/pattern-library.md`, and `computer/memory/context.md`, when present and useful.
12. Review relevant converted files, prior project sources explicitly approved for reuse, and the current request.
13. Run a scout pass: gather initial sources, baseline facts, major claims, timelines, metrics, source clusters, and visible contradictions.
14. Build the first source map, evidence store, claim verification map, hypothesis map, red-team critique, synthesis plan, and runtime subagent plan.
15. Generate a Socratic question set from the scout pass before synthesizing:
   - intent questions
   - evidence questions
   - mechanism questions
   - counterfactual questions
   - transfer questions
   - handoff questions
16. Route each substantive question into a lane:
   - Ask User Now: ask clearly, then stop and wait
   - Research Next: convert into a source/local-file/retry action
   - Assume And Proceed: state the assumption before continuing
   - Validate Later: use only for user-behavior, market-response, pricing, retention, conversion, or implementation claims
17. Build the question ledger from that question set:
   - questions answered by current evidence
   - questions that became more important
   - contradictions or gaps that need another pass
   - questions that should be asked to the user
   - questions that should be answered by further research
   - the selected next-best question and why it matters
18. Run a user-usefulness checkpoint:
   - What would most help this user now?
   - Which next question would change the output?
   - Should the agent ask the user, or continue under a stated assumption?
19. If user input is needed and the choice materially affects usefulness, ask a concise directional question.
20. If you ask a directional question, stop and wait for the user's answer.
21. If user input is not necessary, state the working assumption and continue.
22. Run another research pass focused on the selected highest-usefulness unanswered question.
23. Repeat steps 15-22 as many times as useful. This is an N-pass loop, not a fixed two-pass process.
24. Before final synthesis, write the architecture-to-synthesis trace:
   - selected architecture
   - architecture-specific workplan
   - hypothesis map
   - red-team critique
   - synthesis plan
25. Before final synthesis, write the question-to-synthesis trace:
   - Questions That Changed The Recommendation
   - Assumptions Being Carried
   - Evidence Confidence / Claim-Evidence-Confidence-Caveat Matrix
   - Next-Best Question
26. If a durable report or web-report source document is required, run the research quality-control pass before report composition:
   - read all same-project research artifacts
   - read all `subagent-results/ac-*.md` files that exist
   - write or summarize `subagent-results/ac-research-quality-controller.md`
   - evaluate each specialist role for intent fit, evidence quality, specificity, mechanism depth, counterargument strength, and downstream handoff value
   - identify missing "why" questions that should change the report
   - check whether the final synthesis can be improved from existing materials before requesting new research
   - create repair packets for weak claims, weak roles, underused evidence, or missing caveats
   - route repairs into one of four lanes: use existing material, targeted new research, ask user and wait, or proceed with caveat
   - do not accept a short "proceed" note; the quality-control result must include per-role evaluation, missing why-questions, material-utilization review, repair instructions, and a final report gate
   - treat missing `subagent-results/ac-research-quality-controller.md` as a blocking issue for serious durable reports
   - run quality control as its own wave after all evidence, analysis, critique, and synthesis roles have produced canonical results
27. If quality control requires repairs:
   - if existing materials are sufficient, apply repair instructions to the synthesis/report-composer prompt
   - if a narrow evidence gap remains, run the smallest targeted research pass
   - if the gap depends on user intent, ask and wait
   - record why the repair loop stopped
28. If a durable report or web-report source document is required, run the report composition pass:
   - read all same-project research artifacts
   - read all `subagent-results/ac-*.md` files
   - read `subagent-results/ac-research-quality-controller.md` and any repair packets
   - write or summarize `subagent-results/ac-report-composer.md`
   - make `ac-report-composer.md` a full report draft, not a composition brief or checklist
   - treat missing `subagent-results/ac-report-composer.md` as a blocking issue, not a minor trace gap
   - treat any selected native role missing from `subagent-results/ac-<role>.md` as a blocking issue, even if related content exists elsewhere
   - do not write the final report from scattered source files alone; the report-composer draft is the required synthesis bridge
   - never label the final report as written or composed by `ac-report-composer` unless that file exists
   - include Questions That Changed The Recommendation
   - include a Claim-Evidence-Confidence-Caveat Matrix
   - include assumptions, validation-later items, red-team corrections, and downstream handoff notes
   - Research Director reviews and accepts the final report
   - run report composition as the final single-role wave; do not batch it with other roles
29. If Wide Mode is active:
   - extract the item list
   - define a shared rubric/schema
   - create worker packets or equivalent per-item notes
   - validate each item output
   - run targeted retry for weak rows
30. If Hybrid Mode is active:
   - use Wide Mode for comparable case coverage
   - validate item-level evidence
   - cluster patterns
   - switch into Deep Mode for mechanisms, tradeoffs, and synthesis
31. Run source trust review for important source clusters.
32. Run claim verification review for consequential claims.
33. Organize the synthesis into Data, Information, Knowledge, and Insight when the research supports a planning decision.
34. Analyze causes, mechanisms, patterns, constraints, counterevidence, and practical implications.
35. Record why the loop stopped.
36. Produce findings, implications, next research actions, and the next best user question if further depth would help.
37. Produce the full-depth Markdown research report at market-intelligence / corporate research standard.
38. If the user requested a webpage, stop after the research/report handoff and route HTML implementation to `web-builder`; do not build the web page inside deep-dive-researcher.
39. Save durable research artifacts under `workspace/projects/<project-slug>/research/`.
40. Suggest memory updates only for reusable, evidence-backed patterns.

## Local Tool Path

```bash
node computer/tools/agent-computer.mjs deep-research <source.md> --question "research question"
node computer/tools/agent-computer.mjs deep-research <source.md> --question "research question" --runtime codex --native-subagents
```

The local CLI produces a durable deep-analysis scaffold from workspace material. It creates a research contract, mode decision, architecture decision, runtime subagent plan, worker packets, source policy, question ledger, source map, evidence store, hypothesis map, red-team critique, synthesis plan, claim map, and report. For true deep research, runtime agents must gather external evidence, map sources, separate verified facts from interpretation, and update memory only with reusable, evidence-backed patterns.

## V0 Quality Bar

A passing deep-dive research output should include:

- the research contract
- a full-depth Markdown research report that can stand alone before any web page, deck, or email is created
- the selected research mode and why
- the selected research architecture and why
- architecture-specific workplan, hypothesis map, red-team critique, and synthesis plan
- runtime subagent plan and specialist worker packets
- fixed preflight roles: `intent-analyst` and `research-architect`
- `research-quality-controller` when the run creates a durable report, market analysis, strategy memo, or web-report source document
- `report-composer` when the run creates a durable report, market analysis, strategy memo, or web-report source document
- the decision or real question behind the request
- source policy and freshness expectations
- memory-aware user usefulness frame when memory exists
- N-pass research log or explanation of how many passes were run
- Socratic question engine output with intent, evidence, mechanism, counterfactual, transfer, and handoff questions
- question routing lanes: Ask User Now, Research Next, Assume And Proceed, and Validate Later when relevant
- question ledger with answered, unresolved, newly generated, and next-pass questions
- questions that changed the recommendation, not only questions listed in a ledger
- assumptions being carried into the synthesis
- evidence confidence in the main report, not only in separate source artifacts
- evidence store with atomic evidence items
- source map with checked dates where external sources are used
- claim verification status for consequential claims
- targeted retry notes for weak claims, weak rows, or weak source clusters
- research quality-control verdict, including missing why-questions, material utilization review, and whether existing materials could improve the report before more research
- repair packets or an explanation of why no repair was needed
- complete `ac-research-quality-controller.md`; short approval notes fail
- complete `ac-report-composer.md`; composition briefs fail
- explicit distinction between fact, interpretation, hypothesis, and recommendation
- mechanism analysis, not just a chronology or summary
- source trust notes for major source clusters
- open questions and next research actions
- why the research stopped where it did
- clear limitations when browsing, user interviews, competitor scans, security review, or install tests were not performed

If a downstream web page is requested, the passing chain should include `deep-dive-researcher -> report-writer -> web-builder -> qa-verifier`. The web page is not a substitute for the MI-grade Markdown research report.
