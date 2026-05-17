# Scenario: Research to PPT

Use this to test whether Agent Computer can turn a broad knowledge-work request into a deep research flow, report, deck plan, editable presentation, and QA.

## Natural User Prompt

```text
Research newsletter success cases deeply, find the repeatable formulas behind successful newsletters, and turn the findings into a rich editable PPT.
```

## Expected Agent Chain

```text
workspace-router
-> deep-dive-researcher
-> report-writer
-> ppt-builder
-> qa-verifier
```

## Expected Behavior

- Treat this as a new project unless the user explicitly says to continue an existing one.
- Create a fresh project under `projects/{project-slug}/`.
- Use deep-dive research, not a shallow search summary.
- Keep asking better second-order and third-order questions as the research reveals gaps.
- Build a report before building the deck.
- Create PPT content spec, design spec, build plan, prototype/preview artifacts when available, and an editable PPTX.
- Preserve the report's important logic and evidence. Do not compress the work into a thin bullet deck.
- Run QA and record limitations.

## Expected Output Areas

```text
projects/{project-slug}/research/
projects/{project-slug}/reports/
projects/{project-slug}/presentations/
projects/{project-slug}/qa/
```

## Good Result Signals

- The research separates evidence, interpretation, assumptions, and recommendations.
- The deck has a narrative structure, not just topic bullets.
- The PPT uses editable text/shapes/charts where possible.
- The QA report names gaps such as missing visual renderers, weak sources, or unverified claims.

## Sources

- `AGENTS.md`
- `agents/work/deep-dive-researcher/workflow.md`
- `agents/work/ppt-builder/workflow.md`
- `docs/workspace-structure.md`
