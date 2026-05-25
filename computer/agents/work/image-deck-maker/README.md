# Image Deck Maker

Creates full-slide image-based presentation decks from approved source content.

Use `image-deck-maker` when the user wants a visually finished deck where each slide is generated as a complete bitmap image, then packaged as PNGs and optionally PPTX/PDF.

Do not use this agent when the user needs editable slide text, editable charts, editable tables, or a source-faithful PowerPoint deck. Use `ppt-builder` instead.

This is an `$imagegen`-native agent. Final slide visuals must be generated with `$imagegen` / built-in `image_gen`.

Default production mode is `pure-imagegen`: visible slide text should also be generated inside the final image by `$imagegen`.

HTML/CSS/SVG/canvas/local renderers are allowed for contact sheets, package assembly, and QA. Text overlays are allowed only in explicitly approved `hybrid-overlay` mode.

Standard content slides should be text-rich enough to stand alone, but the structure must be chosen per slide. Use the best content-fit structure: comparison, timeline, process loop, diagnostic map, before/after, mini table, quote panel, product walkthrough, evidence board, storyboard, dense explainer, or another suitable structure.

Set a slide-specific text coverage target before generation. Treat it as a design range, not a rigid quota:

- cover / section / closing: 5-20%
- cinematic concept: 10-25%
- standard explanation: 20-40%
- comparison / process / diagnostic: 30-50%
- dense explainer / source map: 40-60%

Do not reduce the deck to mood images with only a headline and subtitle unless the slide role explicitly calls for it.

## Core Difference

| Agent | Best For |
|---|---|
| `ppt-builder` | Editable PPTX decks with text, shapes, tables, charts, speaker notes, and source-fidelity controls. |
| `image-deck-maker` | Full-slide visual decks where speed, mood, and visual impact matter more than editability. |

## Boundary

This agent does not research, verify facts, or invent strategy.

If research or synthesis is needed, route upstream first:

```text
deep-dive-researcher -> report-writer -> image-deck-maker -> qa-verifier
```

If approved content already exists:

```text
image-deck-maker -> qa-verifier
```

## Typical Output

```text
workspace/projects/<project-slug>/presentations/image-deck/
  deck-contract.md
  content-outline.md
  design-outline.md
  text-lock.md
  image-prompts.md
  generated/
  output/
  README.md
workspace/projects/<project-slug>/qa/<topic>_image-deck-qa.md
```

## Required Gate

Before image generation, lock the text.

Generated images can corrupt text, especially Korean, names, numbers, URLs, and dense copy. Exact slide text must be short, explicit, and approved before generation.

If `imagegen` is unavailable, stop and report the blocker. Do not replace it with an HTML/SVG-rendered slide deck.
