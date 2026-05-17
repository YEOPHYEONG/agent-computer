# Workflow

1. Read the user request.
2. Apply the Agent Computer Boundary Rule: handle the request inside this workspace first unless the user explicitly asks for an external app/account.
3. Apply the New Request Isolation Rule: new requests create fresh projects by default.
4. Identify the desired output.
5. Match the request to an installed agent.
6. If needed, build an agent chain.
7. Check whether the request includes high-risk actions such as external sending, publishing, deletion, file movement, payments, account changes, or irreversible edits.
8. Mark actions that need explicit approval before execution. Email/message drafts are allowed; actual sending requires approval and an available connector.
9. For report, deck, research, new-agent, or multi-step workflows, add `qa-verifier` at the end unless the user explicitly asks for planning only.
10. Load each selected agent's instructions.
11. Execute or hand off in order.
12. Save durable outputs in the right folders, following `system/organization-policy.md`.
13. Prefer project-first paths: `projects/<project-slug>/<work-type>/`.

## Boundary Defaults

- Contact storage: `email-operator` and `memory/private/email-contacts.json`, not macOS Contacts or Google Contacts.
- Email: `email-operator` draft package first; actual sending requires explicit approval and connector.
- Memory: `memory-curator` and workspace `memory/`, not external note apps.
- File organization: `file-organizer` dry-run/manifests, not Finder by default.
- Decks: `ppt-builder` project artifacts, not PowerPoint/Keynote automation by default.
- Documents: `document-ingestor` converted Markdown, not external document app automation by default.

## Project Decision Defaults

- Usage/help requests such as "how do I use this?", "너 어떻게 써?", or "사용법 알려줘" are not project work. Answer from `START_HERE.md`, `README.md`, `AGENTS.md`, and `docs/workspace-structure.md` without creating a project unless the user asks to save the guide.
- A good usage/help answer should tell the user to ask in natural language, put source files in `inbox/`, find final work in `projects/`, and expect outputs such as converted docs, research, reports, presentations, and QA logs under `projects/<project-slug>/`.
- Do not frame `agents/`, `tools/`, `system/`, or `templates/` as user-facing result folders. They are the operating layer.
- New work default: create a fresh `projects/<project-slug>/`.
- Existing project reuse requires explicit user intent such as continue, update, improve, compare, or use previous outputs.
- Similar existing projects may be mentioned as optional context, but they are not source material and not output targets unless the user approves reuse.
- If the user corrects the project decision, immediately switch and keep the old project untouched.
- Include a `Project Decision` section in routing or handoff output.

## Chain Defaults

- Usage/help: `workspace-router`, answer in chat unless the user asks for a saved guide.
- PDF/document conversion only: `document-ingestor`.
- PDF/document to report and PPT: `document-ingestor` -> `report-writer` -> `ppt-builder` -> `qa-verifier`.
- Workspace organization: `file-organizer`; default to dry-run and require approval/`--yes` for actual moves.
- Email drafts or outreach sequences: `email-operator`; do not send without explicit approval.
- New executable agent: `agent-builder` -> `qa-verifier`.
- Research that must be current or externally factual: `quick-researcher` or `deep-dive-researcher` -> `qa-verifier`.
