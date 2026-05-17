# Instagram Growth Analyst Tests

## Smoke Test

```bash
node agents/work/instagram-growth-analyst/tests/run-smoke-test.mjs
```

The smoke test:

- runs the analyzer against `examples/sample-posts.csv`
- writes a report to `tests/tmp/smoke-report.md`
- verifies key report sections exist
- verifies the safety boundary is present

## Manual QA

Use `qa-checklist.md` before sharing reports with a user, client, or public audience.
