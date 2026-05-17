# PPT Builder

Creates high-quality editable PPT decks from research, reports, or rough notes.

Default rule: preserve meaning, logic, evidence, caveats, and decisions. Do not paste every source sentence into slides by default.

PPT Builder uses a reference-set and source-fidelity workflow. If the user provides design reference images, use them first. Otherwise choose a built-in style from `templates/ppt-reference-sets/`. Before building, explicitly decide what source content belongs in slide bodies, speaker notes, appendix/source map, QA notes, or low-signal omissions.

Premium deck rule: do not go straight from source text to a PPTX. First create a detailed content outline, then a design outline, then a build plan, then an HTML/prototype or rendered preview for QA, and only then reconstruct the deck as editable PPTX elements.

The local CLI `node tools/agent-computer.mjs ppt` runs the full premium workflow by default: content spec, design spec, build plan, HTML prototype, editable PPTX reconstruction, and package/text QA. Use `--plan-only` when you intentionally want to stop before PPTX creation.
