# Workflow

1. Clarify the requested agent's job.
2. Identify inputs, outputs, tools, templates, and validation needs.
3. Create the agent folder.
4. Write `README.md`, `agent.md`, `workflow.md`, and `output-template.md`.
5. Add `tools/` if the agent needs executable capability.
6. Add `templates/`, `tests/`, `examples/`, and `memory/` when useful.
7. Register the agent in workspace docs.
8. Run a smoke test or document how to run one.

## Local Tool Path

```bash
node tools/agent-computer.mjs build-agent <agent-name> --category work --with-tools
```

Do not stop at instructions when the requested agent needs real capability. Define the required actions, implement or connect executable tools, add examples, and include a smoke-test path so the new agent can actually perform its job.
