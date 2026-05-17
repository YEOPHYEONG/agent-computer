# Tool Registry

Shared tools should be registered here.

| Tool | Path | Owner Agent | Purpose | Status |
|---|---|---|---|---|
| render_pdf_pages | `computer/tools/lib/ingest.mjs` | document-ingestor | Render PDF pages to PNG | v0 required |
| render_pptx_slides | `computer/tools/lib/ingest.mjs` | document-ingestor | Render PPTX slides to PNG | v0 required |
| write_agent_markdown | `computer/tools/lib/ingest.mjs` | document-ingestor | Write converted `.agent.md` files | v0 required |
| build_workspace_index | `computer/tools/lib/files.mjs` | file-organizer | Build workspace file index | v0 required |
| plan_file_moves | `computer/tools/lib/organization.mjs` | file-organizer | Generate dry-run move plan | v0 required |
| write_move_manifest | `computer/tools/lib/organization.mjs` | file-organizer | Write reversible move manifest | v0 required |
| undo_last_organize | `computer/tools/lib/organization.mjs` | file-organizer | Undo most recent move manifest | v0 required |
| plan_premium_ppt | `computer/tools/lib/deck.mjs` | ppt-builder | Write premium content spec, design spec, build plan, and QA plan without creating a low-quality PPTX | v0 required |
| build_editable_premium_ppt | `computer/tools/lib/deck.mjs`, `computer/tools/lib/pptx-writer.mjs` | ppt-builder | Run full workflow and build editable PPTX with package/text QA | v0 required |
| premium_ppt_workflow | `computer/agents/work/ppt-builder/workflow.md` | ppt-builder | Define content outline -> design outline -> build plan -> prototype/render QA -> editable PPTX reconstruction | v0 required |
| analyze_instagram_growth | `computer/agents/work/instagram-growth-analyst/tools/analyze-instagram-growth.mjs` | instagram-growth-analyst | Analyze local Instagram performance data and produce growth experiments without external account access | v0 required |
