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
   - QA mode: `fast`, `standard`, or `premium`
5. Produce the web information architecture:
   - page title
   - section order
   - navigation model
   - evidence/caveat placement
   - source/reference layer
6. Create a QA manifest before rendering:
   - selected QA mode
   - viewports to test
   - critical selectors
   - critical interactions
   - checks skipped unless premium
   - repair loop limit
7. Implement local static files:
   - `index.html`
   - `styles.css`
   - `app.js` only when interaction is useful
   - local `assets/`
   - `README.md`
   - optional helper: `node computer/tools/agent-computer.mjs web <report.md> --title "..."`
8. Use responsive CSS from the start.
9. Preserve accessibility:
   - semantic headings
   - real buttons/links
   - keyboard access
   - visible focus states
   - alt text for meaningful images
10. Run progressive browser QA when possible:
   - `fast`: JS syntax, asset paths, console status, one desktop viewport, horizontal overflow
   - `standard`: desktop `1440x900`, mobile `390x844`, console status, asset load status, horizontal overflow, critical interactions only, one contact sheet when practical
   - `premium`: desktop/tablet/mobile, all important interactions, screenshots/contact sheet, keyboard/focus checks, source/caveat visibility, deeper visual scan
11. Keep repair loops bounded:
   - `fast`: at most 1 repair pass
   - `standard`: at most 2 repair passes
   - `premium`: at most 4 repair passes
   - If the limit is reached, fix critical breakage first and document remaining non-critical issues.
12. Save QA notes under `workspace/projects/<project-slug>/qa/`.
13. Hand off the final web path, selected QA mode, known limitations, and any publishing steps that still require approval.

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
