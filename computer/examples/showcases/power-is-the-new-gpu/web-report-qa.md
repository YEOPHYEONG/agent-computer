# Web Report QA Notes

Project: `electricity-ai-stocks-deep-research`
Artifact: `web/ai-electricity-bottleneck-report/index.html`
Date: 2026-05-26
QA mode: standard

## QA Manifest

| Check | Standard |
|---|---|
| Desktop viewport | 1440 x 900 |
| Mobile viewport | 390 x 844 |
| Console status | No browser errors or warnings |
| Asset loading | Local CSS, JS, and SVG asset load |
| Horizontal overflow | No page-level horizontal overflow |
| Critical interactions | Evidence tabs, ecosystem filters, signals filters, source search |
| Source/caveat visibility | Educational disclaimer, evidence-stage caveats, uncertainty section, sources |
| Repair loop limit | 2 |

## Results

| Gate | Status | Notes |
|---|---|---|
| Files exist | Pass | `index.html`, `styles.css`, `app.js`, `README.md`, and `assets/time-to-power-stack.svg` exist. |
| JavaScript syntax | Pass | `node --check app.js` completed with no errors. |
| Desktop render | Pass | 1440 x 900 render checked; no page-level horizontal overflow. |
| Mobile render | Pass | 390 x 844 render checked; no page-level horizontal overflow. Wide tables and the sticky nav scroll inside their own containers as intended. |
| Console errors/warnings | Pass | Browser logs returned no errors or warnings. |
| Asset loading | Pass | Local stylesheet, script, and SVG image were observed and loaded. |
| Evidence tabs | Pass | U.S. baseline to global context tab switch works. |
| Ecosystem filters | Pass | Power delivery filter reduced visible exposure cards to 6 and updated the count. |
| Signals filters | Pass | Rules and regulation filter reduced visible signal cards to 2. |
| Source search | Pass | Search for `FERC` reduced source cards to 2 with no no-results warning. |
| Local project links | Pass | Project-root preview resolved links to the Markdown report, source map, and research QA notes. |
| Investment-advice guardrail | Pass | Restricted advice terms appear only in educational disclaimer/guardrail contexts or ordinary non-advice words such as "hold up." |

## Source Preservation

The web report preserves:

- Core thesis: electricity is becoming a regional time-to-power constraint, not a global electricity scarcity claim.
- Evidence map: U.S., global, AI-attribution, and regional evidence views.
- Public-market ecosystem: exposure categories, representative examples, metrics to watch, and failure modes.
- Who gets paid vs who carries risk.
- Bull/base/bear scenario framing.
- Uncertainty, excluded weak claims, and signals to watch.
- Primary source layer with search.

## Known Limitations

- This is a static local HTML artifact, not a deployed site.
- Browser QA used a local loopback preview because direct `file://` navigation is blocked by the browser safety policy.
- External source URLs were not re-crawled during web QA; they were carried from the already verified research package.
- The page intentionally avoids company rankings, price targets, and investment recommendations.

## Repair Loops Used

One repair pass:

- Fixed the ecosystem filter data-key mapping so buttons filter the `data-category` cards correctly.
