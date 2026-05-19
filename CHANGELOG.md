# Changelog

All notable changes to Agent Computer will be documented here.

## Unreleased

- Public documentation boundary cleanup so runtime docs stay separate from internal planning docs.
- Public README polish.
- README raster showcase workflow and known limitations section.
- Release copy automation.
- Fresh-user launch rehearsal.

## v0-preview

Initial experimental preview.

### Added

- Agent Computer operating rules in `AGENTS.md`.
- Claude Code boot instructions in `CLAUDE.md`.
- Default system agents:
  - `workspace-router`
  - `agent-builder`
  - `document-ingestor`
  - `file-organizer`
  - `memory-curator`
  - `qa-verifier`
- Default work agents:
  - `quick-researcher`
  - `deep-dive-researcher`
  - `report-writer`
  - `ppt-builder`
  - `email-operator`
  - `instagram-growth-analyst`
- Default personal agent:
  - `friend-counselor`
- Project-first folder model under `projects/<project-slug>/`.
- Agent Computer Boundary Rule: host apps and external accounts are peripherals, not defaults.
- New Request Isolation Rule: new work creates a fresh project unless the user asks to continue, update, compare, or use previous work.
- Deep-dive N-pass research loop with question ledger and user-usefulness checkpoints.
- PPT Builder reference-set and source-fidelity workflow.
- Built-in original PPT reference boards under `templates/ppt-reference-sets/`.
- Private local email contact book support under `memory/private/email-contacts.json`.
- Release builder:
  - `tools/release/build-release.mjs`
  - `npm run release:build`
- Public release checklist.

### Safety

- Draft-only email behavior by default.
- Explicit approval gates for external sending, publishing, deletion, payments, account changes, host-app automation, and actual file moves.
- Release copy scan for private/generated artifacts.
- `.gitignore` rules for generated outputs and private memory.

### Known Limitations

- V0 is experimental and intended for coding-agent power users.
- Local CLI research scaffolds do not browse the web by themselves; runtime agents must gather external evidence when needed.
- PPTX visual rendering QA depends on local renderers such as LibreOffice/Poppler or other available tooling.
