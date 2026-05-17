# Organization Policy

- Policy: project-based
- Created: 2026-05-16T09:09:53.984Z

## Workspace Structure Preference

- Structure basis: project-first
- Preferred default: project-first, then work type.
- Goal: humans should find every report, deck, source, and QA artifact by opening one project folder first.

## Preferred Project Layout

```text
workspace/projects/
  <project-slug>/
    source/          original or user-provided files
    converted/       agent-readable converted documents
    research/        quick/deep research briefs and source packs
    reports/         written reports and narrative documents
    presentations/   PPTX decks and slide planning artifacts
    qa/              QA reports and verification logs
    assets/          images, rendered pages, contact sheets, media
    tasks/           project-specific task briefs
    archive/         stale or superseded project artifacts
```

## Work Type Rules

- Reports go under `reports/`.
- Research briefs go under `research/`.
- PPTX files and PPT planning files go under `presentations/`.
- QA files go under `qa/`.
- Images and visual assets go under `assets/`.
- Unknown or ambiguous files go to `review-needed/` unless a confident project target exists.

## Safety Rules

- Always prefer `--dry-run` before moving.
- Actual moves require explicit `--yes`, even for one file.
- Write a reversible move manifest.
- Never recursively reorganize files already under `workspace/projects/`.

## Supported Policies

- project-based
- function-based
- output-type-based
- date-based
- hybrid
