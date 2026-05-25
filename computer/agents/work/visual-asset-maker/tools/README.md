# Visual Asset Maker Tools

This agent primarily uses runtime image generation capabilities rather than a local generation script.

Expected runtime tools/skills:

- `$imagegen` / built-in `image_gen`: mandatory primary generator for final bitmap campaign/social/thumbnail/banner assets from the prompt pack.

Local scripts may be added later only for support tasks:

- contact sheet generation
- image dimension checks
- filename/package validation
- safe-area overlays
- locked copy overlays

Local scripts must not replace `$imagegen` as the main creative generation engine.

Store prompts, generated images, variants, final assets, and QA notes in the project folder.
