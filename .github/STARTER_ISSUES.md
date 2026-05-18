# Starter Issues

Use these after launch to create the first public issues.

## 1. Improve One End-To-End Demo Workflow

Labels: `good first issue`, `demo`, `qa`

Body:

```md
Take one real workflow and improve the public demo path.

Suggested workflow:

> Research newsletter success cases deeply, extract the repeatable growth formulas, and turn the findings into a rich editable PPT.

Acceptance criteria:

- The workflow starts from a natural-language request.
- Outputs land under `workspace/projects/<project-slug>/`.
- The result includes research, report, presentation, and QA artifacts.
- The README or example docs explain the workflow without implying npm is the main user experience.
```

## 2. Add A New Default Agent Proposal

Labels: `agent request`, `docs`

Body:

```md
Propose one useful default agent for Agent Computer.

A strong proposal should include:

- agent name
- target user
- job-to-be-done
- expected inputs
- expected outputs
- tools/templates needed
- QA checks
- safety boundaries

Agents should be executable app folders, not just prompt snippets.
```

## 3. Build An Example Community Agent Manifest

Labels: `good first issue`, `agent-hub`, `docs`

Body:

```md
Create a small example `manifest.json` for a community agent.

Acceptance criteria:

- The manifest follows `computer/docs/agent-hub.md`.
- It includes name, displayName, version, category, description, author, license, entry, permissions, tools, and tags.
- It avoids external accounts by default.
- It can be used as a reference for future Agent Hub submissions.
```

## 4. Improve PPT Visual Render QA Across Environments

Labels: `qa`, `demo`

Body:

```md
Improve or document PPT visual QA options across common local environments.

Useful areas:

- LibreOffice / `soffice`
- Poppler
- PDFJS fallback
- platform differences
- clear failure messages when renderers are missing

Acceptance criteria:

- The docs explain what can be verified locally.
- Missing renderer behavior is explicit and non-misleading.
- The workflow does not turn whole decks into screenshots.
```

## 5. Add More Document-Ingestor Fixtures

Labels: `good first issue`, `qa`

Body:

```md
Add small public-safe fixture files for `document-ingestor`.

Useful fixture types:

- PDF with text and visuals
- PPTX with slide notes
- DOCX with headings and tables
- image-only page

Acceptance criteria:

- Fixtures are small and public-safe.
- No private data or personal information.
- Expected output notes are included.
```

## 6. Design The First Agent Hub Catalog Page

Labels: `agent-hub`, `docs`, `demo`

Body:

```md
Sketch the first public Agent Hub catalog page.

V0 should be a simple community sharing concept, not a paid marketplace.

Acceptance criteria:

- Shows agent name, category, description, permissions, tools, and example workflow.
- Explains manual install into `computer/agents/community/<agent-name>/`.
- Includes safety review notes before installing community agents.
```
