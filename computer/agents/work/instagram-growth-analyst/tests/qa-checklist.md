# Instagram Growth Analyst QA Checklist

Use this checklist before delivering a real analysis.

## Input Safety

- [ ] Input file is inside the Agent Computer workspace.
- [ ] No passwords, session cookies, API keys, private DMs, phone numbers, or personal emails are included.
- [ ] The user supplied the data or explicitly approved the local file being analyzed.
- [ ] Unknown metrics are blank, not guessed.

## Tool Run

- [ ] `analyze-instagram-growth.mjs` ran successfully.
- [ ] Report path is under `projects/<project-slug>/reports/` unless an explicit workspace path was requested.
- [ ] Report states that no external posting or account access was performed.

## Analysis Quality

- [ ] Facts, interpretations, assumptions, and recommendations are distinguishable.
- [ ] Recommendations cite the supplied metrics or clearly mark uncertainty.
- [ ] Top posts are not ranked by likes alone.
- [ ] Save, share, comment, reach, and conversion signals are considered when present.
- [ ] Small sample size or missing metrics are called out.
- [ ] Experiments include hypothesis, action, success metric, and review window.

## Delivery

- [ ] The report avoids generic Instagram advice unless tied to the supplied data.
- [ ] No claim implies live Instagram access.
- [ ] Any external benchmark or competitor claim is cited, dated, and marked as separately researched.
