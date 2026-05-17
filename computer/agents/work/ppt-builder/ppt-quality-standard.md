# PPT Quality Standard

This standard defines what counts as a high-quality `ppt-builder` output.

## Core Rule

The final PPTX must be editable. HTML previews, rendered PNGs, and screenshots are QA/design references, not full-slide backgrounds for the final deck.

## Content Quality

- Do not silently remove important source meaning, evidence, caveats, or decisions.
- If the user gives no slide limit, add slides only when condensation would damage the source logic.
- Each slide should have one clear key message.
- Do not simply split the source into plain text chunks.
- Convert dense source material into slide logic: timelines, matrices, tables, process flows, KPI rails, risk registers, recommendations, appendices, or other fitting structures.
- Never expose raw Markdown syntax such as pipe-delimited table rows in slide titles or body text.
- Put source-heavy detail into a source map or appendix slides when it must be traceable but would overwhelm the core narrative.
- Do not force repeated phrasing, local file paths, tool logs, conversion metadata, or source transcripts into slide bodies by default.
- Mark weak evidence, assumptions, and open questions clearly.

## Planning Quality

Before the final PPTX, create:

- content spec
- design spec
- build plan
- prototype or rendered preview notes when possible
- QA notes

The specs must be useful enough for another agent or human to understand how the deck should be built.

## Design Quality

- Use a coherent visual system: palette, typography, spacing, grid, and component rules.
- Use varied slide layout roles; avoid long runs of identical text-only slides.
- Reserve dense repeated layouts for appendices.
- Use charts, tables, and diagrams when they clarify the argument.
- Avoid decorative clutter, generic icon scatter, and full-slide stock-like backgrounds.
- Text must not overlap or overflow.
- Contrast must be readable.

## Editable Object Rules

- Titles, subtitles, body text, captions, and numbers must be PPT text.
- Cards, badges, lines, dividers, timelines, and diagrams should be PPT shapes.
- Tables should be PPT tables when possible.
- Charts should be PPT native charts or editable SVG/shape groups when possible.
- Images are allowed only for hero visuals, actual product/place/person imagery, mockup interiors, textures, or generated assets.
- Core text and data should not be embedded inside images.

## HTML/Preview Rules

- HTML/CSS prototypes are encouraged for polished decks.
- Render previews or contact sheets should be used to catch layout defects.
- The final deck must reconstruct the design with editable PPT elements.
- If render tools are unavailable, document the limitation in QA.

## Final QA

Check and report:

- PPTX opens and package structure is valid.
- Slide count matches the semantic fidelity plan.
- Text is editable.
- No full-slide screenshot backgrounds were used.
- Tables/charts are editable where possible.
- Raw Markdown table syntax does not appear in extracted PPTX slide text.
- Render QA was performed, or the reason it could not be performed is stated.
- Known issues and remaining manual QA are documented.
