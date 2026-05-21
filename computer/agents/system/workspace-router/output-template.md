# Routing Output

## Selected Agent


## Agent Chain


## Reason


## Routing Mode

- Mode: new work / continuation work / correction / question-only
- Meaningful work request detected:
- Active context required:
- Active context clear:
- Prior project reuse allowed:
- If context is ambiguous, ask and wait:

## Boundary Check

- Workspace-native path used first:
- External app/account needed:
- Approval needed before external action:

## Intent Check

- Intent sensitivity: low / medium / high
- Surface request:
- Likely hidden goal:
- Would hidden intent materially change the output:
- Questions needed before execution:
- Confirmation gate needed:
- If a question is asked, stop and wait before execution:

## Project Decision

- New request or continuation:
- Existing related project found:
- Default action:
- New project slug:
- Existing project reuse allowed:
- Reuse approval needed:

For usage/help requests, mark the project as not applicable and answer from `START_HERE.md`, `README.md`, `AGENTS.md`, and `computer/docs/workspace-structure.md`.

## Expected Outputs

- Follow `system/organization-policy.md` when choosing output locations. The recommended default is project-first: `projects/<project-slug>/<work-type>/`.
- For `document-ingestor`, use `projects/<project-slug>/converted/source.agent.md`, not `converted.md`.
- For `document-ingestor`, also expect `projects/<project-slug>/converted/conversion-log.md`.
- For `report-writer`, expect the default Markdown report at `projects/<project-slug>/reports/<topic>_report.md`.
- For `ppt-builder`, expect `projects/<project-slug>/presentations/<topic>.pptx` plus content/design/build specs under `projects/<project-slug>/presentations/`, prototype/preview/assets/layout work under `projects/<project-slug>/presentations/`, and PPT QA under `projects/<project-slug>/qa/`.
- For `file-organizer`, expect dry-run plans, move logs, move manifests, and index updates when it actually organizes files.
- For `email-operator`, expect drafts, follow-ups, and send checklists under `projects/<project-slug>/reports/<topic>_email-package.md`. Actual sending requires explicit approval and an available connector.
- For `agent-builder`, create or update the executable agent app under `agents/<category>/<agent-name>/`; store build briefs, test notes, and QA under `projects/<agent-name>/tasks/` and `projects/<agent-name>/qa/`.
- For `qa-verifier`, expect `projects/<project-slug>/qa/<topic>_qa.md`.
- For actual file moves, deletion, publishing, email sending, account changes, or payments, include an explicit approval gate before execution.
- Host OS apps and external accounts are not defaults. Use them only when the user explicitly requests that external system and approves it.
