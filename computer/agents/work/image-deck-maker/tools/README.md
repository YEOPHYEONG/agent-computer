# Image Deck Maker Tools

This agent primarily uses runtime capabilities rather than a local generation script.

Expected runtime tools/skills:

- `$imagegen` / built-in `image_gen`: mandatory primary generator for final full-slide bitmap visuals from the prompt pack.
- `presentations`: assemble generated slide images into a PPTX/PDF package when available.

Local scripts may be added later only for support tasks:

- contact sheet generation
- image dimension checks
- PNG sequence validation
- image-based PPTX assembly
- locked text overlays only in explicit `hybrid-overlay` mode

Local scripts must not replace `$imagegen` as the main creative generation engine.

Local scripts must not be used to add slide text in default `pure-imagegen` mode.

Store prompts, generated images, package files, and QA notes in the project folder.
