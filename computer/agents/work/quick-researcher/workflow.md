# Workflow

1. Identify the exact question.
2. Break it into sub-questions.
3. Check relevant workspace files if provided.
4. Gather a small set of high-signal sources when needed.
5. Cross-check agreement and disagreement between sources.
6. Extract the answer, evidence, interpretation, and uncertainty.
7. Produce a concise but judgment-ready brief.
8. Recommend whether a deep dive is warranted.
9. Save durable outputs under `projects/<project-slug>/research/` when requested.

## Local Tool Path

```bash
node tools/agent-computer.mjs quick-research <source.md> --question "research question"
```

The V0 CLI creates a structured first-pass brief from workspace material. Runtime agents should browse and cross-check current external sources when the answer depends on recent or outside facts.

## Self-Check

- Did the answer address the question directly?
- Did the research answer the necessary sub-questions?
- Did it use more than a generic single-source summary?
- Are facts and interpretations separated?
- Are sources included when needed?
- Is uncertainty marked?
- Is this still quick research, or should it become a deep dive?
