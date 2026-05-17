# Scenario: Build a New Agent

Use this to test whether Agent Computer can create executable agent apps instead of prompt-only instructions.

## Natural User Prompt

```text
Build an Instagram growth analyst agent that can analyze exported post metrics and tell me what content patterns are working.
```

## Expected Agent Chain

```text
workspace-router
-> agent-builder
-> qa-verifier
```

## Expected Behavior

- Create a new agent app under `agents/work/{agent-name}/`.
- Include `README.md`, `agent.md`, `workflow.md`, and `output-template.md`.
- Add tools, templates, examples, and tests if the agent needs executable capability.
- Register the new agent in the relevant registry files.
- Keep build notes and QA under a project folder such as `projects/{agent-name}/`.
- Avoid external platform login or account access unless explicitly approved.

## Expected Output Areas

```text
agents/work/{agent-name}/
projects/{agent-name}/tasks/
projects/{agent-name}/qa/
```

## Good Result Signals

- The agent can do at least one real local action.
- The tool has a smoke test or fixture.
- The router can identify the new agent for relevant requests.
- QA distinguishes implemented capability from planned capability.

## Sources

- `AGENTS.md`
- `agents/system/agent-builder/workflow.md`
- `templates/agent-app/`
- `docs/workspace-structure.md`
