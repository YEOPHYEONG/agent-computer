# Chain Checkpoints

Agent Computer chains should behave like coordinated workflows, not simple lists of agents.

When multiple agents contribute to one result, `workspace-router` should define the chain contract, handoffs, checkpoints, and final QA criteria before execution.

## Core Rule

Every multi-agent chain should have visible checkpoints.

The checkpoints should make clear:

- what the chain is trying to accomplish
- which agents are responsible for which phase
- what artifact each agent hands to the next
- which checkpoints require user confirmation
- which checkpoints are internal QA gates
- what the final QA must verify

## Checkpoint Types

### Pre-Flight Checkpoint

Before execution, consolidate questions that determine the chain direction.

Use this when:

- the chain creates a large artifact
- the user's intent is medium or high sensitivity
- several agents need the same context
- audience, purpose, depth, or evidence standard would change the result

If the pre-flight checkpoint asks an outcome-changing question, stop and wait for the user's answer.

### Handoff Checkpoint

Between agents, record what was produced and what the next agent should use.

This usually does not need user input.

Each handoff should include:

- artifact path
- artifact purpose
- source scope
- assumptions
- unresolved questions
- limitations
- recommended next agent

### Direction-Change Checkpoint

If an agent finds evidence that would materially change the direction, ask the user and stop.

Example:

```text
The research suggests the strongest pattern is distribution loops, not editorial voice.

Should I shift the report and deck toward distribution-loop mechanics?
I will wait before changing the structure.
```

### Quality Gate

Before moving to a more expensive artifact, check whether the current artifact is good enough.

Examples:

- converted source is faithful enough for reporting
- research is evidence-backed enough for recommendations
- report is deck-ready
- PPT content/design/build plan is strong enough before final PPTX

Internal quality gates can proceed without user input when they do not change scope or direction.

### Final QA

The final `qa-verifier` pass should check the original request and chain contract, not only file validity.

Final QA should check:

- original request satisfaction
- chain contract satisfaction
- handoff completeness
- source fidelity
- evidence gaps
- output validity and editability
- approval boundaries
- known limitations

## Common Handoffs

### document-ingestor -> report-writer

Hand off:

- `converted/source.agent.md`
- `converted/visual-review.md` when pages or slides were rendered
- `converted/conversion-log.md`
- extraction or rendering limitations

### deep-dive-researcher -> report-writer

Hand off:

- `research-contract.md`
- MI-grade deep research report
- evidence store
- source map
- claim verification map
- question ledger
- selected research mode
- unresolved evidence gaps
- recommended report stance

### report-writer -> web-builder

Hand off:

- final Markdown report
- evidence map
- source links
- target audience
- page purpose
- must-preserve claims
- caveats that must remain visible
- sections that can be distilled into cards, tables, charts, or interactions

`web-builder` should not replace `deep-dive-researcher`. It turns the approved report/research package into HTML after the deep research and narrative report exist.

### report-writer -> ppt-builder

Hand off:

- report
- evidence map
- key argument
- audience and use case
- must-preserve content
- caveats that must remain visible

### ppt-builder -> qa-verifier

Hand off:

- PPTX
- content spec
- design spec
- build plan
- prototype or preview paths
- PPT QA report
- render limitations

### deep-dive-researcher -> email-operator

Hand off:

- research evidence
- target audience notes
- supported claims
- unsupported or risky claims
- recommended message angle

### agent-builder -> qa-verifier

Hand off:

- agent folder
- tools
- templates
- tests
- examples
- registry/doc updates
- smoke test result or instructions

## Router Output

For multi-agent chains, routing output should include:

```text
## Chain Checkpoints

- Chain type:
- Pre-flight checkpoint:
- User confirmation required before execution:
- Handoff 1:
- Handoff 2:
- Direction-change checkpoint:
- Internal QA gates:
- Final QA:
```

For single-agent routes:

```text
## Chain Checkpoints

- Not applicable: single-agent route.
```

## Relationship To Other Runtime Rules

Always-on routing decides whether a message contains work and how it routes.

Human-in-the-loop decides whether the chain should ask, proceed, or stop.

Chain checkpoints decide how the selected agents coordinate work and handoffs.
