# Release Manifest

Generated: 2026-05-17T12:37:20.850Z
Version: english-quickstart-check
Target: `dist/agent-computer-english-quickstart-check`

## Summary

- Files copied: 164
- Scan errors: 0
- Scan warnings: 0
- Smoke checks: 7/7 passed

## Scan Errors

- None

## Scan Warnings

- None

## Smoke Checks

### node --check computer/tools/lib/registry.mjs

- Status: pass

### node --check computer/tools/lib/research.mjs

- Status: pass

### node --check computer/tools/lib/deck.mjs

- Status: pass

### node computer/tools/agent-computer.mjs route How do I use this workspace?

- Status: pass

```text
# Routing Plan

## Request

How do I use this workspace?

## Agent Chain

1. `workspace-router`

## Project Decision

- New request or continuation: usage/help request.
- Existing related project found: not applicable.
- Default action: explain Agent Computer usage from `START_HERE.md`, `README.md`, `AGENTS.md`, and `computer/docs/workspace-structure.md`.
- New project slug: not applicable for usage help.
- Existing project reuse allowed: not applicable.
- Reuse approval needed: no.

## Expected Outputs

- Chat answer explaining how to use Agent Computer.
- Reference `START_HERE.md`, `README.md`, `AGENTS.md`, and `computer/docs/workspace-structure.md`.
- No project folder is needed unless the user asks to save the guidance.

## Boundary Check

- Workspace-native path used first: yes.
- External app/account needed by default: no.
- Approval needed before external action: yes, if the task later requires host apps, external accounts, sending, publishing, deletion, payments, account changes, or actual file moves.

## Notes

- If the user explicitly named an agent, use it first.
- Add prerequisite agents when the task needs conversion, reporting, deck building, or QA.
- Agent Computer is the primary computer; host OS apps and external accounts are peripherals, not defaults.
- New requests get a fresh project by default; similar existing projects are optional context only unless the user explicitly asks to reuse them.
- Actual sending, publishing, deletion, payment, account changes, host-app automation, or file moves require explicit approval before execution.
```

### node computer/tools/agent-computer.mjs route Convert this PDF into a report and PPT.

- Status: pass

```text
# Routing Plan

## Request

Convert this PDF into a report and PPT.

## Agent Chain

1. `document-ingestor`
2. `report-writer`
3. `ppt-builder`
4. `qa-verifier`

## Project Decision

- New request or continuation: new request by default.
- Existing related project found: mention as optional context only if discovered.
- Default action: create a fresh project and keep prior project artifacts out of the evidence/source chain.
- New project slug: `workspace/projects/convert-this-pdf-into-a-report-and-ppt/` unless a clearer slug is chosen from the source title.
- Existing project reuse allowed: no.
- Reuse approval needed: yes.

## Expected Outputs

- `workspace/projects/<project-slug>/converted/source.agent.md`
- `workspace/projects/<project-slug>/converted/conversion-log.md`
- `workspace/projects/<project-slug>/converted/visual-review.md` when pages/slides are rendered
- `workspace/projects/<project-slug>/reports/<topic>_report.md`
- `workspace/projects/<project-slug>/presentations/<topic>_ppt-content-spec.md`
- `workspace/projects/<project-slug>/presentations/<topic>_ppt-design-spec.md`
- `workspace/projects/<project-slug>/presentations/<topic>_ppt-build-plan.md`
- prototype source under `workspace/projects/<project-slug>/presentations/prototype/`
- rendered previews/contact sheets under `workspace/projects/<project-slug>/presentations/preview/`
- deck-specific assets/layout work under `workspace/projects/<project-slug>/presentations/assets/` and `workspace/projects/<project-slug>/presentations/layout/` when needed
- approved premium PPTX reconstruction: `workspace/projects/<project-slug>/presentations/<topic>.pptx` with editable PPT elements
- `workspace/projects/<project-slug>/qa/<topic>_ppt-qa.md`
- `workspace/projects/<project-slug>/qa/<topic>_qa.md`

## Boundary Check

- Workspace-native path used first: yes.
- External app/account needed by default: no.
- Approval needed before external action: yes, if the task later requires host apps, external accounts, sendi
... truncated ...
```

### node computer/tools/agent-computer.mjs route Research newsletter success cases deeply and turn the success formulas into a rich editable PPT.

- Status: pass

```text
# Routing Plan

## Request

Research newsletter success cases deeply and turn the success formulas into a rich editable PPT.

## Agent Chain

1. `deep-dive-researcher`
2. `report-writer`
3. `ppt-builder`
4. `qa-verifier`

## Project Decision

- New request or continuation: new request by default.
- Existing related project found: mention as optional context only if discovered.
- Default action: create a fresh project and keep prior project artifacts out of the evidence/source chain.
- New project slug: `workspace/projects/research-newsletter-success-cases-deeply-and-turn-the/` unless a clearer slug is chosen from the source title.
- Existing project reuse allowed: no.
- Reuse approval needed: yes.

## Expected Outputs

- `workspace/projects/<project-slug>/research/<topic>_deep-research.md`
- `workspace/projects/<project-slug>/reports/<topic>_report.md`
- `workspace/projects/<project-slug>/presentations/<topic>_ppt-content-spec.md`
- `workspace/projects/<project-slug>/presentations/<topic>_ppt-design-spec.md`
- `workspace/projects/<project-slug>/presentations/<topic>_ppt-build-plan.md`
- prototype source under `workspace/projects/<project-slug>/presentations/prototype/`
- rendered previews/contact sheets under `workspace/projects/<project-slug>/presentations/preview/`
- deck-specific assets/layout work under `workspace/projects/<project-slug>/presentations/assets/` and `workspace/projects/<project-slug>/presentations/layout/` when needed
- approved premium PPTX reconstruction: `workspace/projects/<project-slug>/presentations/<topic>.pptx` with editable PPT elements
- `workspace/projects/<project-slug>/qa/<topic>_ppt-qa.md`
- `workspace/projects/<project-slug>/qa/<topic>_qa.md`

## Boundary Check

- Workspace-native path used first: yes.
- External app/account needed by default: no.
- Approval needed before external action: yes, if the task later requires host apps, external accounts, sending, publishing, deletion, payments, account changes, or actual file moves.

## 
... truncated ...
```

### node computer/tools/agent-computer.mjs route Save person@example.com as a contact named Alex.

- Status: pass

```text
# Routing Plan

## Request

Save person@example.com as a contact named Alex.

## Agent Chain

1. `email-operator`

## Project Decision

- New request or continuation: workspace memory update.
- Existing related project found: not applicable.
- Default action: update the Agent Computer private contact book only.
- New project slug: not applicable for contact storage.
- Existing project reuse allowed: not applicable.
- Reuse approval needed: no; external contact apps are still not used without explicit request and approval.

## Expected Outputs

- `computer/memory/private/email-contacts.json` for explicitly saved contacts

## Boundary Check

- Workspace-native path used first: yes.
- External app/account needed by default: no.
- Approval needed before external action: yes, if the task later requires host apps, external accounts, sending, publishing, deletion, payments, account changes, or actual file moves.

## Notes

- If the user explicitly named an agent, use it first.
- Add prerequisite agents when the task needs conversion, reporting, deck building, or QA.
- Agent Computer is the primary computer; host OS apps and external accounts are peripherals, not defaults.
- New requests get a fresh project by default; similar existing projects are optional context only unless the user explicitly asks to reuse them.
- Actual sending, publishing, deletion, payment, account changes, host-app automation, or file moves require explicit approval before execution.
```
