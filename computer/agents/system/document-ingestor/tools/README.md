# Document Ingestor Tools

Implemented tools:

- `node tools/agent-computer.mjs ingest <source-file>`: main ingest entrypoint.
- `tools/helpers/ingest_pdf_pdfjs.mjs`: PDFJS + canvas helper that renders PDF pages to PNG, extracts embedded text page by page, writes page notes, extracted text files, contact sheets, `visual-review.md`, `source.agent.md`, and `conversion-log.md`.
- `tools/helpers/extract_ooxml_text.py`: DOCX/PPTX OOXML text extraction helper.

Planned or external tools:

- `render_pptx_slides`: currently uses LibreOffice/`soffice` plus Poppler through the main ingest flow.
- `vision_pass`: performed by the coding agent after rendering by inspecting PNGs and updating page notes. This is a visual understanding step, not a separate raster text-recognition pipeline.

These tools should write outputs under `projects/<project-slug>/converted/` when a project is known. Legacy `converted/<source-name>/` outputs are treated as temporary inbox files that `file-organizer` can move into the project-first structure.
