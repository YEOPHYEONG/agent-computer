# Tools

Shared executable tools live here.

Agent-specific tools can live inside each agent app under `computer/agents/<category>/<agent>/tools/`.

Tool scripts should include:

- clear input and output paths
- error handling
- a usage example
- smoke test instructions

Do not hard-code secrets.

## CLI

Run from the repository root:

```bash
node computer/tools/agent-computer.mjs --help
npm run demo
```

Core commands:

```bash
node computer/tools/agent-computer.mjs route "turn this PDF into a report and ppt deck"
node computer/tools/agent-computer.mjs ingest path/to/file.pdf
node computer/tools/agent-computer.mjs quick-research workspace/projects/file/converted/source.agent.md
node computer/tools/agent-computer.mjs deep-research workspace/projects/file/converted/source.agent.md
node computer/tools/agent-computer.mjs report workspace/projects/topic/research/topic_quick-research.md
node computer/tools/agent-computer.mjs ppt workspace/projects/topic/reports/topic_report.md --title "Topic Report"
node computer/tools/agent-computer.mjs qa workspace/projects/topic/reports/topic_report.md
node computer/tools/agent-computer.mjs organize --policy project-based --dry-run
```

`ppt` runs the premium workflow by default: planning specs, HTML prototype, editable PPTX reconstruction, and package/text QA. Add `--plan-only` when you want only the planning files.

`ingest` creates agent-readable Markdown and should be organized under `workspace/projects/<project-slug>/converted/`. PDFs use the PDFJS helper when available, including the Codex Desktop bundled runtime, and fall back to Poppler. PDF outputs include `visual-review.md` so the coding agent can inspect page PNGs and update page notes with visual structure. PPTX visual rendering requires LibreOffice/`soffice`; missing renderers are recorded as failures instead of fake successes.

`organize` defaults to planning behavior. The recommended policy is project-first: `workspace/projects/<project-slug>/<work-type>/`. Actual file movement requires `--yes` for every move, even a single file. `undo-last-organize` reverses the latest manifest when safe and refreshes `computer/system/workspace-index.md`.
