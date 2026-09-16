# Codex Runtime

Use this workspace with Codex by opening the `agent-computer` folder and asking Codex to read `AGENTS.md`.

## Boot Sequence

1. Read `AGENTS.md`.
2. Read `computer/agents/README.md`.
3. Read `computer/system/agent-registry.md`.
4. Route user requests through `workspace-router` unless the user explicitly names an agent.
5. Use installed agent apps as the default way to work.
6. For new work, create a fresh project unless the user explicitly asks to continue, update, improve, compare, or use existing work.
7. Apply `computer/docs/always-on-routing.md` for every meaningful work request, even mid-conversation.
8. Apply `computer/docs/human-in-the-loop.md` for intent-sensitive work.
9. Apply `computer/docs/chain-checkpoints.md` for multi-agent chains.

## Rules

- Keep work inside the workspace.
- Use local tools under `computer/tools/`.
- Do not install global packages.
- Do not mutate global config.
- Preserve important source content unless the user asks for summarization.
- For file organization, use dry-run before bulk moves.
- Mention related existing projects as optional context only; do not reuse them without approval.
- Re-route any mid-conversation message that asks to create, transform, inspect, organize, send, research, verify, remember, build, or improve something.
- Do not create projects for ordinary conversation or question-only discussion.
- If you ask a question that can change the output, stop and wait for the user's answer.
- Confirm inferred hidden intent before acting on it.
- For multi-agent chains, define handoff artifacts, quality gates, and final QA criteria before execution.

## Native Subagents

Agent Computer ships prebuilt deep-research specialist specs under `computer/agents/work/deep-dive-researcher/subagents/`.

In Codex, those files are not auto-registered by their directory alone. Treat them as canonical prompts and role contracts.

Use native Codex subagents only when the user explicitly asks for subagents, delegation, or parallel agent work. Ordinary requests such as "research this" should create `runtime-subagent-plan.md` and `worker-packets/ac-*.md`, then proceed through the deep-dive researcher.

Use the fixed roster only. Do not invent one-off personality subagents as product behavior. Serious research should prepare preflight roles first:

- `ac-intent-analyst`
- `ac-research-architect`

When native subagents are explicitly authorized:

1. Read the selected role specs.
2. Spawn only the roles needed for the selected research architecture.
3. Give each subagent a bounded task.
4. Wait for the results.
5. Write or summarize each result under `workspace/projects/<project-slug>/research/subagent-results/ac-*.md`.
6. Have the deep-dive researcher synthesize as Research Director.

Subagents should gather, verify, critique, or structure findings. They should not own the final report.

Each run should also create `subagent-orchestration.md`, `subagent-results/README.md`, and `subagent-results/_template.md`. Do not claim native subagents ran unless the `subagent-results/ac-*.md` files contain actual findings or faithful summaries.

## Example

```text
Use document-ingestor to convert workspace/inbox/sample.pdf, then use quick-researcher to make a brief.
```
