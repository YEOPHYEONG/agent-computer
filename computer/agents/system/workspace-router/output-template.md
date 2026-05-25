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

## Execution Gate

- Gate state: PROCEED / ASK_IF_MATERIAL / STOP_BEFORE_EXECUTION / PROCEED_WITH_EXPLICIT_ASSUMPTIONS
- Why:
- Allowed before user answer:
- Blocked before user answer:
- Ask now:
- If `STOP_BEFORE_EXECUTION`, ask and wait. Do not create final research reports, strategy recommendations, decks, web pages, send packages, or new agent implementations in the same turn.

## Chain Checkpoints

- Chain type:
- Pre-flight checkpoint:
- User confirmation required before execution:
- Handoff checkpoints:
- Direction-change checkpoint:
- Internal QA gates:
- Final QA:

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
- For `planning-partner`, expect multi-turn planning artifacts under `projects/<project-slug>/planning/`: `planning-state.md`, `question-ledger.md`, `assumption-map.md`, `blindspot-review.md`, `research-needed.md`, `planning-brief.md`, and `next-actions.md`.
- For `report-writer`, expect the default Markdown report at `projects/<project-slug>/reports/<topic>_report.md`.
- For `web-builder`, expect local static web files at `projects/<project-slug>/web/<topic>/index.html`, `styles.css`, optional `app.js`, `README.md`, assets, and web QA under `projects/<project-slug>/qa/`.
- For `ppt-builder`, expect `projects/<project-slug>/presentations/<topic>.pptx` plus content/design/build specs under `projects/<project-slug>/presentations/`, prototype/preview/assets/layout work under `projects/<project-slug>/presentations/`, and PPT QA under `projects/<project-slug>/qa/`.
- For `image-deck-maker`, expect full-slide image deck planning under `projects/<project-slug>/presentations/image-deck/`: `deck-contract.md`, `content-outline.md` with content-fit structure and text coverage target per slide, `design-outline.md`, `text-lock.md`, `image-prompts.md`, generated images under `generated/`, optional image-based PPTX/PDF under `output/`, an `$imagegen` generation audit, a pure-imagegen or approved hybrid-overlay mode declaration, and image deck QA under `projects/<project-slug>/qa/`.
- For `visual-asset-maker`, expect visual asset planning under `projects/<project-slug>/assets/visual-assets/`: `asset-contract.md`, `copy-lock.md`, `creative-direction.md`, `format-plan.md`, `image-prompts.md`, generated assets under `generated/`, variants under `variants/`, final assets under `final/`, an `$imagegen` generation audit, and visual asset QA under `projects/<project-slug>/qa/`.

Creative image agents are `$imagegen`-native. If the final deck/assets were primarily created by HTML/CSS/SVG/canvas/Sharp/browser rendering, mark the output as blocked or failed, not complete. For image decks, also fail title/subtitle-only content slides when the approved source calls for substantive explanation, and fail rigid repeated structures when the content needs varied slide forms.
- For `file-organizer`, expect dry-run plans, move logs, move manifests, and index updates when it actually organizes files.
- For `email-operator`, expect drafts, follow-ups, and send checklists under `projects/<project-slug>/reports/<topic>_email-package.md`. Actual sending requires explicit approval and an available connector.
- For `agent-builder`, create or update the executable agent app under `agents/<category>/<agent-name>/`; store build briefs, test notes, and QA under `projects/<agent-name>/tasks/` and `projects/<agent-name>/qa/`.
- For `qa-verifier`, expect `projects/<project-slug>/qa/<topic>_qa.md`.
- For actual file moves, deletion, publishing, email sending, account changes, or payments, include an explicit approval gate before execution.
- Host OS apps and external accounts are not defaults. Use them only when the user explicitly requests that external system and approves it.
