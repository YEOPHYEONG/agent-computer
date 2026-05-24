# Workflow

1. Read the user request and confirm whether the desired artifact is:
   - static strategy web report
   - product/landing page
   - internal dashboard-style page
   - documentation page
   - interactive explainer
2. If the page depends on unverified research, current facts, strategy, or market claims, stop and route to `deep-dive-researcher` first.
3. Read the approved source artifacts:
   - deep research report
   - report-writer output if available
   - claim verification map
   - source map
   - evidence store
   - question ledger
   - report-composer handoff
4. Define the page contract:
   - primary audience
   - page purpose
   - desired reader action
   - claims safe to show
   - claims to caveat or omit
   - required sections
   - interaction requirements
5. Produce the web information architecture:
   - page title
   - section order
   - navigation model
   - evidence/caveat placement
   - source/reference layer
6. Implement local static files:
   - `index.html`
   - `styles.css`
   - `app.js` only when interaction is useful
   - local `assets/`
   - `README.md`
   - optional helper: `node computer/tools/agent-computer.mjs web <report.md> --title "..."`
7. Use responsive CSS from the start.
8. Preserve accessibility:
   - semantic headings
   - real buttons/links
   - keyboard access
   - visible focus states
   - alt text for meaningful images
9. Run browser QA when possible:
   - desktop screenshot
   - mobile screenshot
   - console check
   - horizontal overflow check
   - interaction check
   - source link sanity check when practical
10. Save QA notes under `workspace/projects/<project-slug>/qa/`.
11. Hand off the final web path, known limitations, and any publishing steps that still require approval.

## Local Static Output

Default structure:

```text
workspace/projects/<project-slug>/web/<topic>/
  index.html
  styles.css
  app.js
  README.md
  assets/
```

Do not deploy, publish, or open external accounts unless the user explicitly asks and approves.
