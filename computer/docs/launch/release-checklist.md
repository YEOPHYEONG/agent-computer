# Release Checklist

Use this before publishing Agent Computer V0 preview.

## Identity

- [ ] Project name is consistently `Agent Computer`.
- [ ] README first screen explains the concept in under 60 seconds.
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

## Demo

- [ ] One clear end-to-end demo is documented.
- [ ] Demo source data is public-safe.
- [ ] Demo shows output saved under `workspace/projects/`.
- [ ] Demo does not depend on private local files.
- [ ] Demo limitations are stated.

## Agent Hub

- [ ] Agent Hub is described as a future/community sharing platform.
- [ ] It is not described as a finished paid marketplace.
- [ ] Agent package anatomy is documented.
- [ ] Community install path is proposed.

## Release Copy

- [ ] `dist/agent-computer-v0-preview/` is generated from source.
- [ ] Release copy scan passes.
- [ ] Route smoke tests pass.
- [ ] `RELEASE_MANIFEST.md` exists.
- [ ] Fresh-user rehearsal is run against release copy.

## Launch Assets

- [ ] GitHub description is ready.
- [ ] GitHub topics are chosen.
- [ ] README hero copy is ready.
- [ ] Demo GIF/video plan is ready.
- [ ] X/Twitter launch thread is drafted.
- [ ] Hacker News Show HN title and body are drafted.
- [ ] First feedback targets are listed.
