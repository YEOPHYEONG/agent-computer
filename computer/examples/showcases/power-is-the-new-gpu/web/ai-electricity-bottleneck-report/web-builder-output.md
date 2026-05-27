# Web Builder Output

## Web Artifact

- Project: `electricity-ai-stocks-deep-research`
- Page purpose: polished local HTML web report that preserves the research depth while making the material easier to browse.
- Primary audience: readers evaluating AI infrastructure, electricity, grid, cooling, data-center, and public-market narrative mechanisms.
- QA mode: `standard`
- Local path: `computer/examples/showcases/power-is-the-new-gpu/web/ai-electricity-bottleneck-report/index.html`
- Preview path used for QA: `http://127.0.0.1:8790/web/ai-electricity-bottleneck-report/index.html`

## Source Package Used

- Deep research report: `../../research-report.md`
- Claim verification map: `../../claim-verification-map.md`
- Evidence store: `../../evidence-store.md`
- Source map: `../../source-map.md`
- Research QA notes: `../../research-qa.md`

## Page Structure

| Section | Purpose | Source artifact | Caveat preserved |
|---|---|---|---|
| Hero and evidence snapshot | State core thesis and key figures immediately. | Final report, evidence store | Educational only; no security recommendations. |
| Core thesis | Explain time-to-power and confidence levels. | Final report, question ledger | Global scarcity framing avoided. |
| Evidence map | Make U.S., global, AI attribution, and regional evidence browsable. | Evidence store, claim verification map | Total data centers separated from AI workload electricity. |
| Bottleneck stack | Show how annual electricity becomes usable compute. | Final report, mechanism analysis | Multiple layers can be binding. |
| Public-market ecosystem | Explain exposure categories and metrics. | Final report, market map | Representative companies only; no rankings. |
| Paid vs risk | Separate invoice capture from economic risk. | Final report synthesis | Exposure does not equal profit capture. |
| Bull/base/bear cases | Show scenario logic. | Final report, synthesis plan | Educational scenario lenses only. |
| Signals to watch | Turn research into future evidence checklist. | Final report, claim verification map | Emphasizes conversion quality over announcements. |
| Uncertainty and sources | Preserve limitations and primary source links. | QA notes, source map | Weak claims excluded. |

## Interaction / Component Plan

- Navigation: sticky in-page side navigation.
- Cards: metrics, confidence, bottleneck layers, ecosystem categories, scenarios, signals, sources.
- Tables/matrices: thesis-change table and regional evidence table.
- Charts/diagrams: bar visualization and local SVG time-to-power stack.
- Filters/tabs: evidence tabs, ecosystem filters, signals filters, source search.
- Source/reference layer: searchable primary-source cards and links back to the original project artifacts.

## Implementation Files

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `assets/time-to-power-stack.svg`

## QA Summary

- QA manifest: standard mode, desktop 1440 x 900, mobile 390 x 844, critical interactions, console, asset loading, overflow.
- Desktop render: pass.
- Mobile render: pass.
- Console: no errors or warnings.
- Overflow: no page-level horizontal overflow. Wide tables and sticky nav use intended internal scrolling.
- Critical interactions: pass.
- Source/caveat visibility: pass.
- Repair loops used: 1.

## Limitations

- Static local web page; no deployment performed.
- External source URLs were preserved from the source map and not revalidated during web QA.
- The browser preview used localhost because direct `file://` navigation was blocked by browser policy.
