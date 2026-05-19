# Workflow

High-quality PPTX work does not start by generating a PPTX file. First plan the content, then plan the design, then prototype the deck visually, then rebuild it as editable PowerPoint elements.

## 1. Source Understanding

1. Read the full source material.
2. Identify audience, purpose, sharing context, and desired tone.
3. Determine whether the input is polished, research-heavy, or rough.
4. If the input is rough, create a structured brief before slide planning.
5. Mark evidence gaps, weak claims, and uncertain facts.
6. Review workspace memory for presentation preferences, especially source preservation, density, and QA expectations.
7. Decide whether user input is needed before continuing.
8. If audience, reference style, compression level, or presentation purpose would materially change the deck, ask a concise confirmation question and stop until the user answers.
9. If user input is not needed, proceed with explicit assumptions.

## 1.5 Reference Set And Source-Fidelity Strategy

Before writing the content outline, choose the deck's visual reference and preservation strategy.

Reference selection order:

1. User-provided reference images or decks.
2. Project-local references under `projects/<project-slug>/assets/` or `projects/<project-slug>/presentations/assets/`.
3. Built-in reference sets under `templates/ppt-reference-sets/`.

Default built-in reference sets:

- `consulting-report`
- `research-briefing`
- `startup-strategy`
- `product-deck`
- `executive-board`
- `editorial-visual`

Source-fidelity strategy must define:

- content that must be visible in slide bodies
- content that belongs in speaker notes
- content that belongs in appendix/source map
- content that can be omitted because it is repeated, operational log text, local path noise, or otherwise low-signal
- claims that need caveats, softer wording, or external verification

Do not treat source fidelity as verbatim completeness. Preserve logic, evidence, nuance, caveats, examples, decisions, and actionability.

If the source-fidelity strategy depends on an inferred hidden intent, confirm that intent before writing the content outline.

## 2. Content Outline

Create `projects/<project-slug>/presentations/<topic>_ppt-content-spec.md`.

The content outline must include:

- deck objective
- audience and use case
- core narrative
- selected reference set and why it fits the source
- source-fidelity strategy
- slide-by-slide key message
- required semantic content per slide
- evidence, caveats, and source references
- table-heavy source sections rewritten as audience-readable rows, not raw Markdown pipe syntax
- source-map treatment for material that is condensed or kept in the reference layer
- content whose meaning must not be removed without approval
- appendix slides only when the audience needs source-heavy detail in the deck itself

Default rule: if the user does not request summarization or a slide limit, preserve semantic fidelity. Add slides when needed to protect the logic, but do not add slides merely to paste every original sentence.

## 3. Design Outline

Create `projects/<project-slug>/presentations/<topic>_ppt-design-spec.md`.

The design outline must include:

- visual tone
- selected reference set, reference board paths, and design translation notes
- palette and typography
- slide layout roles
- repeated components
- charts, tables, timelines, matrices, cards, diagrams, KPI rails, and appendix treatments
- image or generated-asset needs
- density and readability rules

Every slide should have a layout role. Do not use the same macro layout for long runs unless the source itself requires a repeated appendix pattern.

## 4. Build Specification

Create `projects/<project-slug>/presentations/<topic>_ppt-build-plan.md`.

The build specification combines content and design into implementation instructions:

- slide size and coordinate system
- design tokens
- chosen reference set and what parts of it are being reused
- source-fidelity implementation: slides vs notes vs appendix/source map
- slide-by-slide element inventory
- which elements are PPT text boxes, shapes, tables, charts, SVGs, or image assets
- which elements may be images
- sample slides to build first
- QA checks and known risks

## 5. HTML Or Rendered Design Prototype

For premium decks, create an HTML/CSS prototype or equivalent rendered preview.

Default project-first locations:

- prototype source: `projects/<project-slug>/presentations/prototype/`
- rendered previews/contact sheets: `projects/<project-slug>/presentations/preview/`
- deck-specific assets: `projects/<project-slug>/presentations/assets/`
- layout or reconstruction work files: `projects/<project-slug>/presentations/layout/`
- final PPTX: `projects/<project-slug>/presentations/`
- deck QA: `projects/<project-slug>/qa/`

1. Fix the slide size at 16:9.
2. Use explicit design tokens, grid, spacing, font sizes, and coordinates.
3. Render slides to PNG with Playwright or another available renderer.
4. Create a contact sheet when useful.
5. Check overlap, overflow, hierarchy, contrast, rhythm, and consistency.

HTML/previews are the design reference, not the final PPT. Do not place full-slide screenshots into the final deck.

Do not use top-level `outputs/manual-*` as the normal durable workspace for user-facing decks. If a helper tool forces a temporary `outputs/` path, mirror the final prototype, previews, PPTX, and QA records back into the active project and record the temporary path in the QA note.

## 6. Sample Slides First

When the deck is substantial, build and verify sample slides before the full deck:

- cover or opening slide
- most complex data/evidence slide
- conclusion, roadmap, or recommendation slide

Use the sample to validate the HTML/prototype -> editable PPTX reconstruction path.

## 7. Editable PPTX Reconstruction

Build the final PPTX with editable PowerPoint elements:

- titles, body, captions, callouts, KPI numbers: PPT text
- cards, badges, lines, dividers, process flows, diagrams: PPT shapes
- tables: PPT tables where possible
- charts: PPT native charts or editable SVG/shape groups where possible
- images: only hero visuals, product/place/person images, mockup interiors, textures, or generated assets

## 8. QA And Final Delivery

Create `projects/<project-slug>/qa/<topic>_ppt-qa.md` and run `qa-verifier` on the final PPTX.

Check:

- semantic/content fidelity
- one key message per slide
- editability
- no full-slide screenshot backgrounds
- text overflow
- element overlap
- visual hierarchy
- package validity
- raw Markdown table syntax leakage in extracted PPTX text
- render limitations

## Local Tool Path

```bash
node tools/agent-computer.mjs ppt <source.md> --title "Deck Title"
node tools/agent-computer.mjs ppt <source.md> --title "Deck Title" --plan-only
```

The local V0 CLI runs the full premium workflow by default. It writes the content spec, design spec, build plan, and QA plan, creates an HTML prototype, reconstructs an editable PPTX with text and shapes, and writes package/text QA. It never uses the HTML or PNG previews as full-slide screenshots.

Use `--plan-only` for planning tests or when the user explicitly asks not to create PPTX yet. If a required renderer is unavailable, continue with package/text QA and clearly state the visual-render limitation.
