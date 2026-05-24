# Web Builder

Builds local static web pages and interactive web reports from approved source material.

`web-builder` is intentionally separate from `deep-dive-researcher`. Deep research produces the deep evidence package and MI-grade Markdown report. `web-builder` reads that package and turns it into a polished HTML/CSS/JS artifact without changing the research conclusion.

Default output path:

```text
workspace/projects/<project-slug>/web/<topic>/
```

Typical files:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `assets/`
- `preview/` or screenshot QA files when rendered

Use `web-builder` when the user asks for an HTML page, landing page, interactive report, webpage, website, or local static web artifact.

Local helper:

```bash
node computer/tools/agent-computer.mjs web workspace/projects/<project-slug>/reports/<topic>_report.md --title "Page Title"
```

The helper creates a static HTML package from a Markdown source report. Runtime agents can then improve the layout, add interactions, render screenshots, and run visual QA.
