# Examples

Public-safe examples and demo scenarios live here.

Use fictional, public-domain, or clearly licensed sample data. Do not commit real customer documents, private reports, personal contact lists, credentials, or generated user work.

## What to Try First

You do not need to use a special command to experience Agent Computer. Open this folder with a coding agent and ask in normal language.

Start with one of these:

- [Research to PPT](scenarios/research-to-ppt.md)
- [Document to Report and PPT](scenarios/document-to-report-and-ppt.md)
- [Build a New Agent](scenarios/build-a-new-agent.md)
- [Organize Project Files](scenarios/organize-project-files.md)

## Sample Input

`examples/input/sample.md` is a tiny safe source document used by smoke tests and demos.

Expected workflow:

```text
examples/input/sample.md
-> projects/{project-slug}/converted/source.agent.md
-> projects/{project-slug}/research/
-> projects/{project-slug}/reports/
-> projects/{project-slug}/presentations/
-> projects/{project-slug}/qa/
```

The exact project slug may differ. The important behavior is project-first output, clear source preservation, and QA notes.

## Fixture Inputs

`examples/input/document-ingestor-qa/` contains small fixture files for document-ingestor QA. They are for local validation, not polished demo content.
