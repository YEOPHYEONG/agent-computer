# Workflow

1. Identify file type.
2. Choose conversion path.
3. For text-native files, extract text and structure it as Markdown.
4. For visual files, render pages/slides to PNG.
5. Generate page-note drafts, extracted text files, and a visual review checklist when available.
6. Inspect rendered images page by page.
7. Update page-level Markdown with concrete visual understanding: layout, hierarchy, tables, charts, diagrams, screenshots, callouts, captions, and uncertain areas.
8. Save output under `projects/<project-slug>/converted/` when a project is known; use `converted/<source-name>/` only as a temporary inbox before file-organizer runs.
9. Create a conversion log with limitations and uncertain areas.

## Local Tool Path

```bash
node tools/agent-computer.mjs ingest <source-file>
```

The CLI extracts text for Markdown, text, DOCX, PDF, and PPTX files. For PDF conversion, it first tries the PDFJS helper (`tools/helpers/ingest_pdf_pdfjs.mjs`) and can use the Codex Desktop bundled Node runtime when available; if that path is unavailable, it falls back to Poppler `pdftotext`/`pdftoppm`. For PPTX visual conversion, it requires LibreOffice/`soffice` to export slides to PDF and Poppler `pdftoppm` to render pages. If a required renderer is missing, stop and report the missing dependency instead of pretending the visual pass succeeded.

## Vision Pass Rule

The rendered image is the source of truth for visual structure. Embedded text extraction is support material, not the final interpretation. Do not add a separate raster text-recognition step by default. Instead, inspect the PNG page image and update the generated page note.

For each visual page, fill:

- page role or purpose
- layout structure and visual hierarchy
- tables/charts, including labels, measures, trends, comparisons, and conclusions
- diagrams, screenshots, flows, callouts, arrows, icons, and visual relationships
- unreadable or uncertain areas
- a reusable `Visual Reconstruction Addendum`
