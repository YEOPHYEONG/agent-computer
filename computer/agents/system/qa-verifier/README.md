# QA Verifier

Checks work before it is delivered.

For research-heavy outputs, QA should confirm that questions are used to improve the final synthesis, not merely listed in a question ledger. Strong outputs make assumptions, a Claim-Evidence-Confidence-Caveat matrix, and recommendation-changing questions visible.

For subagent-backed research, QA should also verify trace integrity:

- canonical result files are named `research/subagent-results/ac-<role>.md`
- preflight results `ac-intent-analyst.md` and `ac-research-architect.md` exist when investigation results exist
- final report packages include `ac-report-composer.md` when specialist research results feed a report
- reports that claim `ac-report-composer` authorship/composition fail QA if `ac-report-composer.md` is missing
- native subagent execution is not claimed unless actual findings are saved or faithfully summarized
