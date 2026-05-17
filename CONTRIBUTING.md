# Contributing

Thanks for helping improve Agent Computer.

Agent Computer is an experimental V0 preview: a file-based workspace where coding agents run like apps. Contributions should make the workspace clearer, safer, more useful, or easier to extend.

## Good First Contributions

- Improve documentation for new users.
- Add public-safe examples.
- Improve an existing agent's `agent.md`, `workflow.md`, or `output-template.md`.
- Add focused tests or QA checklists for an agent.
- Improve local tools under `tools/` without adding global install requirements.
- Propose a community agent package shape for Agent Hub.

## Agent App Standard

Every agent app should include:

```text
README.md
agent.md
workflow.md
output-template.md
```

Executable agents may also include:

```text
tools/
templates/
tests/
examples/
memory/
manifest.json
```

An agent should not be only a prompt if it needs real capability. Add tools, templates, tests, and validation notes when they make the agent more reliable.

## Adding A New Agent

1. Choose a category:
   - `agents/system/` for operating-layer agents.
   - `agents/work/` for knowledge-work agents.
   - `agents/personal/` for reflective/personal agents.
   - `agents/community/` for externally shared agents when that folder exists.
2. Create the standard files.
3. Define boundaries and external-action approval rules.
4. Add tools only when they are local-first and safe to inspect.
5. Add at least one example or smoke test.
6. Update `system/agent-registry.md`.
7. If routing should discover it, update router logic or docs.
8. Add a QA note under a project-specific `projects/<slug>/qa/` folder while developing, but do not include generated QA artifacts in the public release copy unless they are intentionally public examples.

## Tool Rules

Tools must:

- run inside the workspace
- avoid global package installs
- avoid mutating global config
- fail clearly when dependencies are missing
- write predictable outputs
- avoid destructive operations unless explicitly approved

Tools must not:

- send emails, publish content, make purchases, delete files, change accounts, or access external apps without explicit user approval
- store secrets
- write outside the workspace by default
- silently install dependencies

## Documentation Style

- Be concrete.
- Separate facts, assumptions, limitations, and recommendations.
- Prefer examples that show natural-language usage.
- Do not imply Agent Computer is a stable OS, SaaS product, or finished marketplace.
- Label V0 limitations honestly.

## Public-Safety Requirements

Do not commit:

- private memory
- real contacts
- API keys, tokens, cookies, or credentials
- private reports
- converted private documents
- generated project outputs
- `.DS_Store`
- `.env` files

Run the release builder before publishing:

```bash
npm run release:build -- --version v0-preview --force
```

Then inspect:

```text
dist/agent-computer-v0-preview/RELEASE_MANIFEST.md
```

## Pull Request Checklist

- [ ] The change keeps Agent Computer local-first.
- [ ] No private/generated artifacts are included.
- [ ] New or changed agents have clear boundaries.
- [ ] External actions remain approval-gated.
- [ ] Relevant docs are updated.
- [ ] Focused smoke or QA checks were run.
- [ ] Known limitations are stated.

## Agent Hub Contributions

Agent Hub is a future community sharing platform, not a paid marketplace in V0.

For proposed community agents, include:

- a short description
- agent category
- manifest draft
- permissions needed
- local tools included
- example input/output
- safety notes

See [docs/launch/agent-hub-plan.md](docs/launch/agent-hub-plan.md).

## Sources

This contribution guide is based on:

- [AGENTS.md](AGENTS.md)
- [docs/engineering-principles.md](docs/engineering-principles.md)
- [docs/launch/release-copy-spec.md](docs/launch/release-copy-spec.md)
- [docs/launch/agent-hub-plan.md](docs/launch/agent-hub-plan.md)
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
