# Release Copy Spec

## Purpose

Create a clean public distribution copy from the development source.

Source of truth:

```text
agent-computer/
```

Release target:

```text
dist/agent-computer-v0-preview/
```

The release copy should be safe to publish to GitHub.

## Include

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `LICENSE`
- `package.json`
- `computer/docs/`
- `computer/agents/`
- `computer/tools/`
- `computer/templates/`
- `computer/examples/`
- `computer/system/agent-registry.md`
- `computer/system/tool-registry.md`
- `computer/system/organization-policy.md`
- `computer/memory/README.md`
- `computer/memory/*.example.md`
- empty user-facing folders with README guide files:
  - `workspace/projects/`
  - `workspace/inbox/`
  - `workspace/outputs/`
  - `workspace/converted/`
  - `workspace/reports/`
  - `workspace/tasks/`
  - `workspace/archive/`
  - `workspace/trash/`

## Exclude

- `node_modules/`
- `.DS_Store`
- `.env`
- `.env.*`
- `computer/memory/private/`
- real memory files:
  - `computer/memory/context.md`
  - `computer/memory/user-preferences.md`
  - `computer/memory/pattern-library.md`
  - `computer/memory/memory-update-log.md`
- generated project files:
  - `workspace/inbox/*`
  - `workspace/projects/*`
  - `workspace/reports/*`
  - `workspace/converted/*`
  - `workspace/outputs/*`
  - `workspace/tasks/*`
  - `workspace/archive/*`
  - `workspace/trash/*`
- generated system files:
  - `computer/system/workspace-index.md`
  - `computer/system/workspace-map.md`
  - `computer/system/project-index.md`
  - `computer/system/last-dry-run.md`
- private PDFs, decks, screenshots, reports, contacts, logs, or local absolute-path artifacts.

## Required Scans

The release builder should fail or warn on:

- email addresses outside examples or docs that intentionally explain contact storage
- API keys, tokens, cookies, or private credentials
- absolute local user paths such as `/Users/`
- generated artifacts under public output folders
- private memory or `computer/memory/private/`
- `.DS_Store`
- large unexpected binaries

## Required Smoke Checks

Run inside the release copy:

```bash
node --check computer/tools/lib/registry.mjs
node --check computer/tools/lib/research.mjs
node --check computer/tools/lib/deck.mjs
node computer/tools/agent-computer.mjs route "How do I use this workspace?"
node computer/tools/agent-computer.mjs route "Convert this PDF into a report and PPT."
node computer/tools/agent-computer.mjs route "Research newsletter success cases deeply and turn the success formulas into a rich editable PPT."
node computer/tools/agent-computer.mjs route "Save person@example.com as a contact named Alex."
```

Expected:

- document-to-report-to-PPT routes to `document-ingestor -> report-writer -> ppt-builder -> qa-verifier`.
- deep research to PPT routes to `deep-dive-researcher -> report-writer -> ppt-builder -> qa-verifier`.
- contact save routes to `email-operator` and `computer/memory/private/email-contacts.json`, not macOS Contacts.

## Release Builder Goal

Add:

```bash
node computer/tools/release/build-release.mjs --version v0-preview
```

Expected behavior:

1. Remove any previous `dist/agent-computer-v0-preview/` after explicit local command intent.
2. Copy included files.
3. Recreate empty user folders.
4. Run private/generated scan.
5. Run syntax and route smoke checks.
6. Write `dist/agent-computer-v0-preview/RELEASE_MANIFEST.md`.
