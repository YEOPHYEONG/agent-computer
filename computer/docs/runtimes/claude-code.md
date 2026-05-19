# Claude Code Runtime

Use this workspace with Claude Code by opening the `agent-computer` folder. Claude Code should read `CLAUDE.md` first.

## Boot Sequence

1. Read `CLAUDE.md`.
2. Read `AGENTS.md`.
3. Read `computer/agents/README.md`.
4. Read `computer/system/agent-registry.md`.
5. Route user requests through `workspace-router` unless the user explicitly names an agent.
6. For new work, create a fresh project unless the user explicitly asks to continue, update, improve, compare, or use existing work.
7. Apply `computer/docs/human-in-the-loop.md` for intent-sensitive work.

## Rules

- Treat `computer/agents/` as installed apps.
- Use local tools under `computer/tools/`.
- Do not install global packages.
- Do not mutate global config.
- Keep generated outputs inside the workspace.
- For file organization, use dry-run before bulk moves.
- Do not claim a tool ran if it did not run.
- Mention related existing projects as optional context only; do not reuse them without approval.
- If you ask a question that can change the output, stop and wait for the user's answer.
- Confirm inferred hidden intent before acting on it.

## Example

```text
Use workspace-router to decide the chain for turning this PDF into a report and deck.
```
