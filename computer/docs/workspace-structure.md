# Workspace Structure

Agent Computer has two layers:

1. Operating layer: files that make the agent computer run. This lives under `computer/`.
2. User output layer: files a user normally opens to find work results. This lives under `workspace/`.

The split matters because users should not have to browse implementation files to find a report, deck, or converted document.

## User Output Layer

Most daily work should end up here.

```text
workspace/
  projects/
    {project-slug}/
      source/
      converted/
      research/
      reports/
      presentations/
      web/
      qa/
      assets/
      tasks/
      archive/

  inbox/
  outputs/
  converted/
  reports/
  tasks/
  archive/
  trash/
```

Use `workspace/projects/` as the main starting point. Each real request should normally create or update one project folder.

Use `workspace/inbox/` for source files that have not been assigned to a project yet.

Use `workspace/outputs/`, `workspace/converted/`, `workspace/reports/`, and `workspace/tasks/` as staging areas only. Durable work should be copied or moved into `workspace/projects/{project-slug}/` when the project is known.

## Operating Layer

These folders are the operating layer of the agent-operated computer.

```text
AGENTS.md
CLAUDE.md
README.md
package.json

computer/
  agents/
  system/
  tools/
  templates/
  docs/
  examples/
  memory/
```

Most users should not need to open these during normal work.

- `AGENTS.md` and `CLAUDE.md` tell coding agents how to operate this workspace.
- `computer/agents/` contains installed agent apps.
- `computer/system/` contains registries, routing metadata, policies, and generated indexes.
- `computer/tools/` contains executable helper tools.
- `computer/templates/` contains reusable output and agent templates.
- `computer/docs/` contains project documentation.
- `computer/examples/` contains safe public examples.
- `computer/memory/` contains reusable context. Real private memory should stay out of public releases.

## Default Behavior

When a user asks for work, Agent Computer should:

1. Route the request to the right installed agent or agent chain.
2. Create a fresh `workspace/projects/{project-slug}/` folder for new work unless the user explicitly asks to continue an old project.
3. Keep source, converted files, research, reports, presentations, web pages, assets, and QA inside that project folder.
4. Use the operating layer only to run the work, not as the place where user-facing results are buried.

## External Systems

Agent Computer treats the host computer as a runtime, not the default action space.

Workspace-native actions should be tried first:

- contacts: `computer/memory/private/email-contacts.json`
- email: draft package first
- file organization: dry-run and move manifest
- memory: Markdown files under `computer/memory/`
- decks: project presentation artifacts
- web pages: project web artifacts under `workspace/projects/{project-slug}/web/`
- document conversion: project converted artifacts

Host OS apps, browser profiles, email accounts, calendars, publishing tools, and payment systems require explicit user approval.
