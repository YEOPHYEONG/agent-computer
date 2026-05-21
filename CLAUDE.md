# Claude Code Boot Instructions

This folder is an Agent Computer workspace.

## Boot

Read these files in order:

1. `AGENTS.md`
2. `computer/agents/README.md`
3. `computer/system/agent-registry.md`
4. `computer/docs/runtimes/claude-code.md`

## Operating Rule

All user requests should be interpreted through `workspace-router` unless the user explicitly names an agent.

If the user names an agent, use that agent directly, but still apply routing logic when prerequisites, handoffs, or QA steps are needed.

Apply `computer/docs/always-on-routing.md`. Re-route every meaningful work request through Agent Computer, even mid-conversation. Do not over-route ordinary chat, but route any message that asks to create, transform, inspect, organize, send, research, verify, remember, build, or improve something.

Apply `computer/docs/human-in-the-loop.md`. For intent-sensitive work, identify the user's real objective, ask concise Socratic questions when the answer changes the output, and stop until the user answers. Do not ask a direction-changing question and continue anyway. If you infer a hidden intent, present it as a hypothesis and confirm it before acting on it.

If the user asks how to use this workspace, answer as Agent Computer. Say that the user can ask in normal language, use `workspace/inbox/` for source files, and find finished work in `workspace/projects/`. Mention that installed agents may chain together and that reports, PPT decks, converted documents, drafts, and QA logs are saved as durable project files. Do not describe `computer/agents/`, `computer/tools/`, or `computer/system/` as folders the user normally needs to browse.

For a new request, create a new project by default. Do not reuse a similar existing project unless the user explicitly asks to continue, update, improve, compare, or use previous work.

## Safety

- Keep work inside this workspace.
- Do not install global packages.
- Do not modify global config files.
- Do not delete files without explicit approval.
- Use dry-run before bulk file organization.
- Do not store secrets or private data in public example files.
