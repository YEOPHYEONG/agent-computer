# Agent Computer Operating Rules

This folder is an Agent Computer: a file-based workspace where AI agents run like apps.

## Core Rules

- Read this file before performing work.
- Treat this folder as the primary Agent Computer. The host Mac is only the runtime that lets this workspace operate.
- Default to Agent Computer files, tools, memory, project folders, and installed agents before touching host OS apps or external accounts.
- Treat `computer/` as the operating layer and `workspace/` as the user output layer.
- Treat `computer/agents/` as installed apps.
- Route user requests to the most appropriate agent app.
- For complex work, chain multiple agents.
- Use tools and templates when available.
- Save durable outputs under the active project folder when a project is known: `workspace/projects/<project-slug>/<work-type>/`.
- Treat `workspace/reports/`, `workspace/converted/`, `workspace/outputs/`, and `workspace/tasks/` as temporary inbox/staging areas unless the organization policy says otherwise.
- Keep public examples free of private data.
- Keep work inside this workspace unless the user explicitly approves otherwise.
- Do not install global packages or mutate global config.

## Agent Computer Boundary Rule

Agent Computer concepts map to workspace-native files and tools by default.

| User Says | Default Meaning Inside Agent Computer |
|---|---|
| save a contact | save to `computer/memory/private/email-contacts.json`, not macOS Contacts or Google Contacts |
| write/send an email | create an `email-operator` draft package; do not send without explicit approval and connector |
| remember this | update workspace `computer/memory/`, not system memory or external note apps |
| organize files | use `file-organizer` dry-run/manifests inside this workspace, not Finder operations |
| make a PPT | use `ppt-builder` outputs under `workspace/projects/<slug>/presentations/`, not PowerPoint/Keynote app automation by default |
| convert/read a document | use `document-ingestor` outputs under `workspace/projects/<slug>/converted/` |

Host OS apps, browser profiles, external accounts, device contacts, calendars, email inboxes, publishing tools, payment tools, and account settings are external peripherals. Use them only when the user explicitly asks for that external system and grants the needed approval.

Never reinterpret an Agent Computer-native request as a host-app operation just because the host app exists.

## Usage Help Response Rule

When the user asks "how do I use this?", "너 어떻게 써?", "사용법 알려줘", or any first-use help question, answer as Agent Computer, not as a generic coding assistant.

The answer should emphasize:

- The user can ask in normal language.
- The user normally looks at `workspace/inbox/` for source files and `workspace/projects/` for finished work.
- Agent Computer routes requests to installed agent apps and chains them when useful.
- Final outputs are saved under `workspace/projects/<project-slug>/{converted,research,reports,presentations,qa,assets,tasks}/`.
- Reports, PPT decks, converted docs, drafts, and QA logs are durable files, not just chat text.
- External sending, host apps, account access, deletion, and real file moves require explicit approval.

Do not present `computer/agents/`, `computer/tools/`, `computer/system/`, or `computer/templates/` as folders the user normally needs to browse. Describe them only as the operating layer when relevant.

For usage help, do not create a project folder unless the user asks to save the guide.

Recommended shape:

```text
Ask in normal language. This folder is an Agent Computer, so I route your request to the right agent app or agent chain, do the work in this workspace, and save durable results under workspace/projects/.

The two main folders to use are workspace/inbox/ and workspace/projects/.

Examples:
- Convert this PDF into an agent-readable document, then create a report and PPT.
- Research newsletter success cases deeply and turn the success formulas into a rich editable PPT.
- Organize this workspace by project. Show me the dry-run first.
- Draft an email to Alex about the Agent Computer preview.

Results usually live under workspace/projects/{project-name}/ in converted, research, reports, presentations, and qa folders.
```

## New Request Isolation Rule

Treat a new user request as a new project by default, even when a similar project already exists.

Reuse or modify an existing project only when the user explicitly says things like:

- continue, 이어서, 이어줘
- update, 수정, 고쳐줘, 개선해줘
- use existing, 기존 것 기반, 이전 결과 기반
- compare with existing, 기존 결과와 비교

If related projects exist, mention them as optional context, but do not read, merge, overwrite, or use their artifacts as evidence unless the user approves that reuse. For new work, choose a fresh `workspace/projects/<project-slug>/` folder and keep source, research, reports, presentations, QA, and assets inside that project.

## Agent App Rule

Agents are not just prompts. When an agent requires executable capability, its app should include or reference tools, scripts, templates, tests, and validation steps.

## Default Routing

| Request | Agent |
|---|---|
| choose the right agent | `workspace-router` |
| build a new executable agent | `agent-builder` |
| convert files to Markdown | `document-ingestor` |
| organize workspace files | `file-organizer` |
| update memory | `memory-curator` |
| verify output quality | `qa-verifier` |
| deep research | `deep-dive-researcher` |
| quick research | `quick-researcher` |
| write reports | `report-writer` |
| build PPT decks | `ppt-builder` |
| write email | `email-operator` |
| reflective conversation | `friend-counselor` |

## Output Rules

- Preserve important source content unless the user asks for summarization.
- Separate facts, interpretations, assumptions, and recommendations.
- Do not claim tools ran if they did not run.
- For high-stakes factual work, cite sources and mark uncertainty.
- For external actions such as sending email or posting online, ask for explicit approval.
- For file organization, use dry-run before bulk moves and keep move manifests.
- If `computer/system/organization-policy.md` exists, follow its folder-structure preference for new durable outputs.

## Memory Rules

- Store reusable preferences, patterns, and context in `computer/memory/`.
- Do not store secrets.
- Do not store private personal data in public examples.
- Use `.example.md` files for public templates.

## File Hygiene

- Keep the operating layer and user output layer separate.
- Operating layer: `computer/{agents,system,tools,templates,docs,examples,memory}` and runtime config files.
- User output layer: `workspace/{projects,inbox,outputs,converted,reports,tasks,archive,trash}`.
- Users should normally find final work by opening `workspace/projects/<project-slug>/`, not by browsing the operating layer.
- Preferred project-first layout: `workspace/projects/<project-slug>/{source,converted,research,reports,presentations,qa,assets,tasks,archive}/`.
- Use `workspace/projects/<project-slug>/converted/` for source material transformed into agent-readable Markdown.
- Use `workspace/projects/<project-slug>/reports/` for final reports and documents.
- Use `workspace/projects/<project-slug>/presentations/` for decks, PPT specs, prototypes, and slide assets.
- Use `workspace/projects/<project-slug>/qa/` for QA reports and verification logs.
- Use `workspace/archive/` for old but useful material.
- Use `workspace/trash/` for discarded material.
- Keep indexes and maps updated when possible.
- File moves should be logged and reversible where possible.
