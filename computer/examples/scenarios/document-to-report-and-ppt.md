# Scenario: Document to Report and PPT

Use this to test whether Agent Computer can process a source file, preserve important content, and turn it into reusable outputs.

## Natural User Prompt

```text
Convert this document into an agent-readable document, then make a practical report and a presentation from it.
```

Attach or place the source file in `inbox/` or `examples/input/`.

## Expected Agent Chain

```text
workspace-router
-> document-ingestor
-> report-writer
-> ppt-builder
-> qa-verifier
```

## Expected Behavior

- Create a fresh project under `projects/{project-slug}/`.
- Copy or reference the source file under `source/`.
- Convert the document into `converted/source.agent.md`.
- For visual PDFs or slides, render pages/slides into images when the local runtime supports it.
- Add conversion logs and page notes.
- Produce a report that preserves the source's important arguments, facts, tables, claims, and uncertainty.
- Produce a PPT workflow that includes content spec, design spec, build plan, and editable PPTX reconstruction.
- Do not pretend visual extraction succeeded if required renderers are missing.

## Expected Output Areas

```text
projects/{project-slug}/source/
projects/{project-slug}/converted/
projects/{project-slug}/reports/
projects/{project-slug}/presentations/
projects/{project-slug}/qa/
```

## Good Result Signals

- `conversion-log.md` explains what was extracted and what may be missing.
- `source.agent.md` is useful to another agent without opening the original file.
- The report marks source claims separately from externally verified facts.
- The PPT is not a full-slide screenshot deck.

## Sources

- `AGENTS.md`
- `agents/system/document-ingestor/workflow.md`
- `agents/work/report-writer/workflow.md`
- `agents/work/ppt-builder/workflow.md`
- `docs/workspace-structure.md`
