# Claude Code Runtime

Use this workspace with Claude Code by opening the `agent-computer` folder. Claude Code should read `CLAUDE.md` first.

## Boot Sequence

1. Read `CLAUDE.md`.
2. Read `AGENTS.md`.
3. Read `computer/agents/README.md`.
4. Read `computer/system/agent-registry.md`.
5. Route user requests through `workspace-router` unless the user explicitly names an agent.
6. For new work, create a fresh project unless the user explicitly asks to continue, update, improve, compare, or use existing work.
7. Apply `computer/docs/always-on-routing.md` for every meaningful work request, even mid-conversation.
8. Apply `computer/docs/human-in-the-loop.md` for intent-sensitive work.
9. Apply `computer/docs/chain-checkpoints.md` for multi-agent chains.

## Rules

- Treat `computer/agents/` as installed apps.
- Use local tools under `computer/tools/`.
- Do not install global packages.
- Do not mutate global config.
- Keep generated outputs inside the workspace.
- For file organization, use dry-run before bulk moves.
- Do not claim a tool ran if it did not run.
- Mention related existing projects as optional context only; do not reuse them without approval.
- Re-route any mid-conversation message that asks to create, transform, inspect, organize, send, research, verify, remember, build, or improve something.
- Do not create projects for ordinary conversation or question-only discussion.
- If you ask a question that can change the output, stop and wait for the user's answer.
- Confirm inferred hidden intent before acting on it.
- For multi-agent chains, define handoff artifacts, quality gates, and final QA criteria before execution.

## Native Subagents

Agent Computer keeps canonical deep-research specialist specs under `computer/agents/work/deep-dive-researcher/subagents/`.

Claude Code project subagents can be materialized from those specs into `.claude/agents/ac-*.md`, but this should be explicit. Do not silently create or overwrite `.claude/agents/` files during ordinary research.

Use the fixed roster only. Do not materialize one-off personality subagents as product behavior. Serious research should prepare preflight roles first:

- `ac-intent-analyst`
- `ac-research-architect`

When the user approves native Claude Code subagents:

```bash
node computer/tools/agent-computer.mjs deep-research <source.md> --question "..." --runtime claude-code --native-subagents --materialize-subagents
```

The deep-dive researcher remains the Research Director. Claude subagents gather evidence, verify claims, map markets, inspect docs, red-team assumptions, or plan synthesis. They do not own the final report.

Each run should create `subagent-orchestration.md`, `subagent-results/README.md`, and `subagent-results/_template.md`. When Claude Code subagents actually run, save or summarize findings under `workspace/projects/<project-slug>/research/subagent-results/ac-*.md`.

If native subagents are unavailable or not approved, use the generated `worker-packets/ac-*.md` files instead. Do not claim native subagents ran unless the `subagent-results/ac-*.md` files contain actual findings or faithful summaries.

## Example

```text
Use workspace-router to decide the chain for turning this PDF into a report and deck.
```
