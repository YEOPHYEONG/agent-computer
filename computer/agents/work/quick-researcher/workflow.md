# Workflow

1. Identify the exact question.
2. If the question is broad and the user's decision context would materially change the answer, ask one concise question and wait.
3. Break it into sub-questions.
4. Check relevant workspace files if provided.
5. Gather a small set of high-signal sources when needed.
6. Cross-check agreement and disagreement between sources.
7. Extract the answer, evidence, interpretation, and uncertainty.
8. Produce a concise but judgment-ready brief.
9. Recommend whether a deep dive is warranted.
10. Save durable outputs under `projects/<project-slug>/research/` when requested.

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
