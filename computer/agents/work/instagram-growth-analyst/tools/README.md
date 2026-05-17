# Instagram Growth Analyst Tools

## `analyze-instagram-growth.mjs`

Generates a Markdown Instagram growth analysis from a local CSV, TSV, or JSON file.

```bash
node agents/work/instagram-growth-analyst/tools/analyze-instagram-growth.mjs --input <file> --project <project-slug>
```

The tool is deliberately local-only:

- reads files inside the Agent Computer workspace
- writes Markdown inside the workspace
- does not access Instagram
- does not use network requests
- does not post, message, follow, unfollow, like, or comment

Run the smoke test after edits:

```bash
node agents/work/instagram-growth-analyst/tests/run-smoke-test.mjs
```
