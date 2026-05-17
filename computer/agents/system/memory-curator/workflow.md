# Workflow

1. Review new outputs and user preferences.
2. Identify reusable information.
3. Classify memory: preference, context, pattern, source, or temporary note.
4. Run a sensitive-data check before writing anything.
5. If the source contains secrets, tokens, passwords, or private contact data, write only a review log and do not auto-promote memory.
6. Update the appropriate memory file only for safe durable candidates.
7. Remove duplication.
8. Mark uncertain information clearly.
9. Write a project-first curation log under `projects/<project-slug>/qa/`.

## Local Tool Path

```bash
node tools/agent-computer.mjs curate-memory <source.md>
```

The local tool writes durable global memory under `memory/` and writes a project-first curation log under `projects/<project-slug>/qa/`. It blocks auto-promotion for files that contain secret-like patterns.

## V0 Quality Bar

- Promotes reusable preferences, patterns, context, or evidence notes.
- Skips temporary or one-off statements.
- Blocks auto-write when source-level secrets are detected.
- Does not copy private contact data into durable memory.
- Deduplicates repeated memory items.
- Logs added, skipped, and reasoning.
