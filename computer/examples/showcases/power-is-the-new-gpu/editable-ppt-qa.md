# Editable PPT Deck QA Notes

Date: 2026-05-26

## Deliverable

- PPTX: `electricity-ai-time-to-power-bottleneck-deck.pptx` release asset.
- Build manifest: original project QA artifact, not included in this lightweight showcase.
- Source report: `research-report.md`
- Source map: `source-map.md`

## Coverage Check

The 10-slide deck preserves the requested elements:

- Core thesis: regional time-to-power bottleneck, not global electricity scarcity.
- Evidence baseline: DOE/LBNL U.S. TWh estimates and IEA global context.
- Caveats: AI attribution, evidence-stage discipline, requested MW vs actual load, no stock-selection inference.
- Public-market ecosystem map: demand creators, delivery/thermal infrastructure, supply/flexibility, metrics and failure modes.
- Bull/bear cases: tight-power evidence, relief/overstatement evidence, counterarguments.
- Signals to watch: requested/forecast/contracted/energized/actual MWh/utilization conversion frame.

## Verification

- Built with artifact-tool presentation workflow using the bundled Node runtime.
- Exported PPTX size: about 66 KB.
- PPTX package contains 10 slide XML files.
- No logos, unofficial marks, screenshots, or external media assets are embedded.
- Slides use editable PowerPoint text, shapes, tables, bars, and diagram elements.
- Rendered all slides to PNG and inspected the contact sheet plus full-size key slides.
- Layout quality checker result: 0 errors, 4 warnings.

## Accepted Warnings

- Slide 4 has a dense attribution guardrail callout; rendered text remains readable and inside the box.
- Slide 7 splits the research guardrail label and body for hierarchy; the split is intentional and rendered cleanly.
- Slide 9 has two tight small-table text boxes; both render legibly.

## Content Guardrails

- No buy/sell/hold recommendation, price target, model portfolio, ranking, or stock-picking conclusion is added.
- Company names are used only as representative category examples.
- Weak claims excluded in the research report remain excluded in the deck.
- The deck keeps the educational research framing throughout.
