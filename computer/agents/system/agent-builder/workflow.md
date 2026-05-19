# Workflow

1. Clarify the requested agent's job.
2. If job-to-be-done, action scope, inputs, outputs, required tools, safety boundaries, or test scenarios are unclear and would materially change the agent, ask and wait before building.
3. Identify inputs, outputs, tools, templates, and validation needs.
4. Create the agent folder.
5. Write `README.md`, `agent.md`, `workflow.md`, and `output-template.md`.
6. Add `tools/` if the agent needs executable capability.
7. Add `templates/`, `tests/`, `examples/`, and `memory/` when useful.
8. Register the agent in workspace docs.
9. Run a smoke test or document how to run one.

## Local Tool Path

```bash
node tools/agent-computer.mjs build-agent <agent-name> --category work --with-tools
```

Do not stop at instructions when the requested agent needs real capability. Define the required actions, implement or connect executable tools, add examples, and include a smoke-test path so the new agent can actually perform its job.
