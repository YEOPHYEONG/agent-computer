# Instagram Growth Analyst

Local-first agent app for analyzing Instagram growth from exported or manually entered performance data.

This agent does not log into Instagram, scrape private accounts, post content, send messages, or change account settings. It works from files inside Agent Computer and produces workspace-native analysis artifacts.

## Best For

- Finding which posts, formats, topics, hooks, and posting windows are driving growth.
- Turning Instagram post metrics into a clear growth diagnosis and experiment plan.
- Auditing content performance without using external account access.
- Preparing a repeatable report for creators, brands, or marketing teams.

## Inputs

Preferred input is a CSV or JSON file with one row per post. Use `templates/input-data-template.csv` as the safest starting point.

Required field:

- `date`

Recommended fields:

- `content_type`
- `topic`
- `caption`
- `followers`
- `reach`
- `impressions`
- `likes`
- `comments`
- `shares`
- `saves`
- `profile_visits`
- `website_taps`
- `plays`

The analyzer can run with partial data, but the report will mark missing metrics and lower-confidence recommendations.

## Executable Tool

```bash
node agents/work/instagram-growth-analyst/tools/analyze-instagram-growth.mjs --input agents/work/instagram-growth-analyst/examples/sample-posts.csv --project instagram-growth-demo
```

Useful options:

```bash
--input <path>       CSV, TSV, or JSON file inside the workspace.
--project <slug>    Project folder under projects/. Defaults to instagram-growth-analysis.
--profile <name>    Optional profile or brand name for the report.
--followers <n>     Optional fallback follower count when rows do not include followers.
--out <path>        Optional explicit Markdown output path inside the workspace.
```

Default output:

```text
projects/<project-slug>/reports/instagram-growth-analysis-YYYY-MM-DD.md
```

## App Files

- `agent.md` defines the role, boundaries, and operating principles.
- `workflow.md` defines the end-to-end analysis workflow.
- `output-template.md` defines the report structure.
- `tools/analyze-instagram-growth.mjs` generates a Markdown growth analysis from local data.
- `templates/input-data-template.csv` gives a safe data schema.
- `templates/experiment-log-template.md` supports follow-up experiment tracking.
- `tests/run-smoke-test.mjs` validates the tool against sample data.
- `tests/qa-checklist.md` provides manual QA checks for real client work.

## Smoke Test

```bash
node agents/work/instagram-growth-analyst/tests/run-smoke-test.mjs
```

The smoke test writes a local test report under the agent's `tests/tmp/` folder and checks that the report includes the expected sections and safety boundary language.
