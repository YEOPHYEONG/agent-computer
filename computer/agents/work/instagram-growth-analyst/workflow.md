# Workflow

## Standard Workflow

1. Confirm the analysis goal: growth diagnosis, content planning, campaign review, creator audit, or client-ready report.
2. Identify the active project slug. If none is given, use `instagram-growth-analysis`.
3. Locate local input files under the workspace. If the user only pasted rough metrics, convert them into the input schema before analysis.
4. Check whether the input includes the fields needed for the requested decision:
   - reach or impressions for distribution
   - likes, comments, shares, saves for engagement quality
   - followers for follower-normalized rates
   - content type, topic, caption, and date for pattern analysis
5. Run the local analyzer:

```bash
node agents/work/instagram-growth-analyst/tools/analyze-instagram-growth.mjs --input <file> --project <project-slug>
```

6. Read the generated report and tighten the human interpretation:
   - remove overconfident claims when data is thin
   - add context from user-provided goals, audience, product, and constraints
   - keep facts, interpretations, assumptions, and recommendations distinct
7. Save durable outputs under:

```text
projects/<project-slug>/reports/
projects/<project-slug>/qa/
```

8. Run the smoke test after tool or template changes:

```bash
node agents/work/instagram-growth-analyst/tests/run-smoke-test.mjs
```

9. For real client or public-facing reports, use `tests/qa-checklist.md` before delivery.

## Data Prep Workflow

1. Copy `templates/input-data-template.csv` into the project's `source/` or `research/` folder.
2. Fill one row per post.
3. Keep unknown metrics blank rather than guessing.
4. Use consistent `content_type` labels such as `reel`, `carousel`, `single_image`, `story`, or `live`.
5. Use consistent `topic` labels such as `education`, `behind_the_scenes`, `product`, `case_study`, or `community`.
6. Run the analyzer and review the data quality notes.

## Analysis Standard

A useful Instagram growth analysis should include:

- the account goal and decision being supported
- data coverage and known gaps
- top posts and weak posts by meaningful rates, not only raw likes
- content type, topic, weekday, and hour patterns when available
- diagnosis of distribution, resonance, conversion, and consistency
- 3 to 5 concrete experiments
- success metrics and review cadence
- safety note that no external posting or account access was performed
