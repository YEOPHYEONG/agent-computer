# Workflow

1. Identify audience, purpose, and format.
2. If audience, decision purpose, evidence standard, or recommendation posture is unclear and would materially change the report, ask and wait for the user's answer.
3. Determine whether input is rough, research-heavy, or polished.
4. Structure rough input into question, conclusion, evidence, analysis, and next actions.
5. Check whether evidence is strong enough for a report.
6. List weak claims, missing facts, and unresolved context.
7. Fill small gaps with quick supplementary research when possible.
8. Escalate deeper gaps to `deep-dive-researcher`.
9. Convert research-heavy input into a readable narrative.
10. If the source or same project includes research artifacts, synthesize them into the report:
   - `research/question-ledger.md`
   - `research/evidence-store.md`
   - `research/claim-verification-map.md`
   - `research/research-contract.md`
   - `research/source-map.md`
   - questions that changed the recommendation
   - assumptions being carried
   - evidence confidence
   - claim-evidence-confidence-caveat matrix for strategy, positioning, market, GTM, or recommendation reports
   - claim/source boundaries
   - next-best question
11. Check output depth before delivery:
   - If the user asked for a full report, strategy report, market analysis, or research-backed recommendation, do not deliver a thin brief.
   - If the output is intentionally short, label it as a brief and preserve the full research artifacts as separate references.
   - If same-project `research/` artifacts exist, make sure the final report includes their core recommendation, evidence, assumptions, risks, and next actions.
12. Preserve important content by default.
13. Mark remaining gaps clearly.
14. Save the default Markdown report output as `projects/<project-slug>/reports/<topic>_report.md`.
15. If the user requested a local HTML page or interactive web report, pass the completed report, evidence map, caveats, and intended page goal to `web-builder`. Keep the Markdown report as the durable source of truth.
16. Ask `qa-verifier` to review when quality matters.

## Local Tool Path

```bash
node tools/agent-computer.mjs report <source.md> --audience "target audience"
node tools/agent-computer.mjs qa projects/<project-slug>/reports/<topic>_report.md
```

The V0 CLI adds report structure, extracts claim-like source items, performs a lightweight local evidence scan, creates an Evidence Map, marks remaining gaps, adds a Risk Register, preserves question-to-synthesis trace when present, and keeps a source-preserved appendix so content is not silently removed. Runtime agents should still add supplementary research for weak claims when the report depends on current external facts, competitive claims, security claims, user demand, or other evidence outside the workspace.
