# Workflow

1. Identify audience, purpose, and format.
2. Determine whether input is rough, research-heavy, or polished.
3. Structure rough input into question, conclusion, evidence, analysis, and next actions.
4. Check whether evidence is strong enough for a report.
5. List weak claims, missing facts, and unresolved context.
6. Fill small gaps with quick supplementary research when possible.
7. Escalate deeper gaps to `deep-dive-researcher`.
8. Convert research-heavy input into a readable narrative.
9. Preserve important content by default.
10. Mark remaining gaps clearly.
11. Save the default Markdown report output as `projects/<project-slug>/reports/<topic>_report.md`.
12. Ask `qa-verifier` to review when quality matters.

## Local Tool Path

```bash
node tools/agent-computer.mjs report <source.md> --audience "target audience"
node tools/agent-computer.mjs qa projects/<project-slug>/reports/<topic>_report.md
```

The V0 CLI adds report structure, extracts claim-like source items, performs a lightweight local evidence scan, creates an Evidence Map, marks remaining gaps, adds a Risk Register, and keeps a source-preserved appendix so content is not silently removed. Runtime agents should still add supplementary research for weak claims when the report depends on current external facts, competitive claims, security claims, user demand, or other evidence outside the workspace.
