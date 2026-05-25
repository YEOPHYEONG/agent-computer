# Workflow

1. Confirm the requested artifact is a visual asset package.
   - If it is a multi-slide image presentation, route to `image-deck-maker`.
   - If it is an editable deck, route to `ppt-builder`.
   - If it needs research or campaign strategy, route upstream before this agent.
2. Read the approved source package.
   - campaign brief
   - approved copy
   - planning brief or report
   - brand notes
   - reference images
   - channel requirements
3. Define the asset contract:
   - purpose
   - channel
   - audience
   - CTA
   - format/sizes
   - language
   - brand constraints
   - source boundaries
   - approval requirements
4. Write `asset-contract.md`.
5. Write `copy-lock.md`.
   - exact image text
   - CTA
   - risky strings
   - approval status
6. Write `creative-direction.md`.
   - core creative concept
   - mood
   - visual metaphor
   - color direction
   - composition rule
   - image subject
   - what to avoid
7. Write `format-plan.md`.
   - channel
   - size
   - safe area
   - crop/variant requirements
   - final filenames
8. If copy lock contains exact text, Korean text, numbers, URLs, claims, or brand names, stop and wait for user approval.
9. Write `image-prompts.md`.
   - one prompt per format/variant
   - aspect ratio
   - copy instructions
   - visual concept
   - negative prompt
   - filename
10. Generate final visual assets with `$imagegen` / built-in `image_gen`.
   - This is mandatory for final visual generation.
   - If `imagegen` is unavailable, stop and report the blocker. Do not silently substitute HTML/SVG/CSS/canvas rendering as the main generator.
   - If exact copy is risky, prefer generating a mostly text-free visual layer with `imagegen`, then overlay locked copy with a support renderer.
11. Save outputs under:

```text
workspace/projects/<project-slug>/assets/visual-assets/generated/
workspace/projects/<project-slug>/assets/visual-assets/variants/
workspace/projects/<project-slug>/assets/visual-assets/final/
```

12. Use support rendering only when needed:
   - locked copy overlay
   - safe-area guide
   - contact sheet
   - dimension validation
   - package assembly
   - visual QA
13. Run visual asset QA:
   - `imagegen` use confirmed
   - no HTML/SVG/CSS/canvas renderer used as the main creative engine
   - dimensions/aspect ratio
   - text accuracy
   - text legibility
   - safe area
   - brand fit
   - unsupported claims
   - channel fit
   - filename/package completeness
14. Save QA under:

```text
workspace/projects/<project-slug>/qa/<topic>_visual-asset-qa.md
```

15. Final handoff must state:
   - `$imagegen` was used for final visual generation
   - generated asset paths
   - selected final assets
   - variant paths
   - copy accuracy limitations
   - whether any asset needs regeneration
   - whether posting/publishing was not performed
