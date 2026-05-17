# Release Checklist

Use this before publishing Agent Computer V0 preview.

Canonical launch docs live under:

```text
computer/docs/launch/
```

## Identity

- [ ] Project name is consistently `Agent Computer`.
- [ ] README explains the concept in under 60 seconds.
- [ ] Status is clearly `experimental V0 preview`.
- [ ] No copy implies stable autonomous OS, SaaS, or complete marketplace.

## Human Usage

- [ ] Quick Start says to open the folder in Codex or Claude Code.
- [ ] Quick Start uses natural-language examples.
- [ ] npm commands are labeled optional developer/smoke helpers.
- [ ] "How do I use this?" is answered as Agent Computer usage, not Codex self-description.

## Folder UX

- [ ] Operating layer is explained: `computer/agents/`, `computer/tools/`, `computer/system/`, `computer/templates/`, `computer/docs/`, `computer/memory/`.
- [ ] User-facing layer is explained: `workspace/inbox/` for source files and `workspace/projects/` for finished work.
- [ ] New durable outputs default to `workspace/projects/<project-slug>/`.
- [ ] `workspace/converted/`, `workspace/reports/`, `workspace/outputs/`, and `workspace/tasks/` are explained as staging or kept empty in release.

## Safety

- [ ] `computer/memory/private/` is excluded.
- [ ] No private contacts are present.
- [ ] No private projects or generated user outputs are present.
- [ ] No `.DS_Store`.
- [ ] No `.env` files.
- [ ] No local absolute user paths in release docs or examples.
- [ ] External sending, publishing, deletion, payment, and account changes require explicit approval.

## Default Agents

- [ ] Every V0 agent has `README.md`, `agent.md`, `workflow.md`, and `output-template.md`.
- [ ] `workspace-router` includes boundary and project decision checks.
- [ ] `deep-dive-researcher` includes N-pass question loop.
- [ ] `ppt-builder` includes reference-set and source-fidelity strategy.
- [ ] `email-operator` explains draft-only mode and local contact book.
- [ ] `file-organizer` requires dry-run before moves.
- [ ] `qa-verifier` can check reports and PPTX packages at a basic level.

## Release Copy

- [ ] Run the release builder:

```bash
npm run release:build -- --version v0-preview --force
```

- [ ] Confirm release copy exists:

```text
dist/agent-computer-v0-preview/
```

- [ ] Confirm manifest exists:

```text
dist/agent-computer-v0-preview/RELEASE_MANIFEST.md
```

- [ ] Confirm scan errors are zero.
- [ ] Confirm smoke checks pass.

## Fresh-User Rehearsal

- [ ] Open the release copy in a fresh Codex or Claude Code session.
- [ ] Ask it to read `AGENTS.md` or `CLAUDE.md`.
- [ ] Run at least one natural-language workflow.
- [ ] Confirm outputs land in `workspace/projects/<project-slug>/`.
- [ ] Confirm no accidental host-app or external-account behavior.

## Launch Assets

- [ ] GitHub description is ready.
- [ ] GitHub topics are chosen.
- [ ] README hero copy is ready.
- [ ] Demo GIF/video plan is ready.
- [ ] X/Twitter launch thread is drafted.
- [ ] Hacker News Show HN title and body are drafted.
- [ ] First feedback targets are listed.
