# Image Deck Contract

## Purpose

-

## Primary Audience

-

## Use Context

-

## Source Package

-

## Output Format

- Aspect ratio: 16:9 unless specified otherwise
- Target resolution: 1920x1080 or higher
- Deliverables: PNG sequence / image-based PPTX / PDF / all
- Production mode: `pure-imagegen` by default
- `hybrid-overlay` allowed: yes / no

## Text Density Standard

- Content density target:
- Sparse slides allowed for: cover / section divider / closing / other:
- Structure rule: choose the best slide structure for the content; do not force one template across the deck
- Text coverage target rule:
- Standard content slide minimum: enough visible text, labels, examples, comparisons, annotations, or proof objects to communicate the point without presenter narration
- Text must be rendered by `$imagegen` unless `hybrid-overlay` is explicitly approved.

## Language

-

## Slide Count

-

## Editability Boundary

This is an image-based deck. Slide content is mostly non-editable after generation. If editable text, charts, or tables are required, route to `ppt-builder`.

## Claims And Source Boundaries

-

## Approval Gates

- Text lock approval:
- Brand/reference approval:
- Final package approval:
