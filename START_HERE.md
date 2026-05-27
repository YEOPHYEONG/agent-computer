# Start Here

Welcome to Agent Computer.

Agent Computer is a local computer operated by your coding agent. You open this folder with Codex, Claude Code, or another file-editing agent, then ask for work in normal language.

The agent should run installed agent apps, create project folders, and leave durable results behind instead of only answering in chat.

## If You Are a User

Start with these folders:

- `workspace/projects/`: your finished work, organized by project
- `workspace/inbox/`: source files you want agents to process
- `README.md`: what Agent Computer is and how to try it
- `AGENTS.md`: instructions for Codex-style agents
- `CLAUDE.md`: instructions for Claude Code

Most final outputs should be easy to find under:

```text
workspace/projects/{project-slug}/
```

Inside each project, look for:

- `converted/`: agent-readable converted documents
- `research/`: research briefs
- `reports/`: written reports and documents
- `presentations/`: PPT decks, specs, prototypes, and slide assets
- `web/`: local HTML pages and interactive web reports
- `qa/`: verification notes

## If You Are Looking at the Operating Layer

These folders make Agent Computer run:

- `computer/agents/`: installed agent apps
- `computer/system/`: registries, policies, routing metadata, and indexes
- `computer/tools/`: executable helper tools
- `computer/templates/`: reusable templates
- `computer/docs/`: documentation
- `computer/memory/`: reusable context and preferences
- `computer/examples/`: safe examples

You normally do not need to browse these folders to find your own work.

## First Prompt to Try

Open this folder with your coding agent and ask:

```text
How do I use this workspace?
```

The expected answer should explain Agent Computer usage, not generic Codex or Claude usage. It should point you to `workspace/inbox/` for source files and `workspace/projects/` for final results.

Then try a real task:

```text
Research newsletter success cases deeply and turn the findings into a rich editable PPT.
```

Agent Computer should create a fresh project, save outputs under `workspace/projects/`, and run QA when appropriate.

For web reports, ask naturally:

```text
Research this market deeply, write the full report, then turn it into an interactive HTML page.
```

Agent Computer should keep the deep Markdown research/report separate from the HTML page.

## Good Usage Answer

If you ask how to use Agent Computer, the answer should sound roughly like this:

```text
Ask in normal language. This folder is an Agent Computer, so I route your request to the right agent app or agent chain, do the work in this workspace, and save durable results under workspace/projects/.

The two main folders to use are:

- workspace/inbox/: put source files here when you want agents to process them
- workspace/projects/: find reports, PPT decks, converted documents, drafts, and QA logs by project

For example, you can ask:

"Convert this PDF into an agent-readable document, then create a report and PPT."
"Research newsletter success cases deeply and turn the success formulas into a rich editable PPT."
"Organize this workspace by project. Show me the dry-run first."
"Draft an email to Alex about the Agent Computer preview."

Results usually live under workspace/projects/{project-name}/ in converted, research, reports, presentations, web, and qa folders.

I do not send email, access external accounts, operate host apps, delete files, or actually move files unless you explicitly approve that action.
```

## Folder Model

For the full map, see [Workspace Structure](computer/docs/workspace-structure.md).
