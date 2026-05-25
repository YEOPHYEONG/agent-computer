# Agent Computer Operating Rules

This folder is an Agent Computer: a file-based workspace where AI agents run like apps.

## Core Rules

- Read this file before performing work.
- Treat this folder as the primary Agent Computer. The host Mac is only the runtime that lets this workspace operate.
- Default to Agent Computer files, tools, memory, project folders, and installed agents before touching host OS apps or external accounts.
- Treat `computer/` as the operating layer and `workspace/` as the user output layer.
- Treat `computer/agents/` as installed apps.
- Route user requests to the most appropriate agent app.
- Re-route every meaningful work request through Agent Computer, even if it appears mid-conversation.
- For complex work, chain multiple agents.
- Use tools and templates when available.
- Save durable outputs under the active project folder when a project is known: `workspace/projects/<project-slug>/<work-type>/`.
- Treat `workspace/reports/`, `workspace/converted/`, `workspace/outputs/`, and `workspace/tasks/` as temporary inbox/staging areas unless the organization policy says otherwise.
- Treat Agent Computer as a multi-turn work partner. For intent-sensitive work, discover the user's real goal, confirm outcome-changing interpretations, and wait for answers before executing.
- Keep public examples free of private data.
- Keep work inside this workspace unless the user explicitly approves otherwise.
- Do not install global packages or mutate global config.

## Always-On Routing Rule

Agent Computer stays active throughout the conversation.

Every meaningful work request should be routed through the right installed agent or agent chain, even when it appears after conceptual discussion, feedback, approval, or casual conversation.

Route messages that ask Agent Computer to create, transform, inspect, organize, send, research, verify, remember, build, or improve something.

Do not over-route ordinary conversation, short reactions, or question-only discussion. If a message contains both casual language and a work request, route the work request.

Examples:

- `좋아. 그럼 이걸 PPT로 만들어줘.` -> continuation work, route to `ppt-builder`.
- `오케이. 차니한테 보낼 메일 초안 써줘.` -> route to `email-operator`.
- `아니, 투자자용이 아니라 내부 팀 실행용이야.` -> correction, update the work contract before continuing.
- `좋다.` -> conversation-only, no project needed.

Use these routing modes:

- New work: new task or topic; create a fresh project by default.
- Continuation work: current context is being transformed, revised, or extended.
- Correction: user is changing a prior assumption, audience, goal, or scope.
- Question-only: answer in chat without creating files unless requested.

Always-on routing does not override project isolation. If the user refers to "this", "that", "이거", or "그거" and the source is unclear, ask which source/project to use and wait.

See `computer/docs/always-on-routing.md` for the shared routing policy.

## Intent Discovery Rule

Classify requests by whether the user's hidden intent would materially change the output.

- Low intent sensitivity: file conversion, simple summaries, QA, formatting, indexes, or already-specific instructions. Proceed with stated assumptions and avoid unnecessary questions.
- Medium intent sensitivity: rough reports, email drafts, quick research, or first-time file organization. Ask one or two focused questions only when the answer would change the work.
- High intent sensitivity: deep research, PPT/deck creation, web pages, strategy, marketing, sales, branding, new agent creation, counseling, and large multi-agent artifacts. Ask Socratic questions to uncover the real objective, audience, success criteria, and decision context before execution.

If an agent asks a question that can change the outcome, it must stop and wait for the user's answer. Do not ask and then continue anyway.

When an agent infers a hidden intent, present it as a hypothesis and confirm it before acting on it.

For high intent-sensitivity work, do not convert `Ask User Now` questions into assumptions unless the user explicitly says to proceed under reasonable assumptions or not to ask. Phrases like "make a strategy", "deeply research", "build a deck", "make a web page", "create a new agent", or "position this product" should trigger an execution gate before final deliverables are created.

Allowed before the user answers:

- read routing and agent instructions
- draft a chain contract
- create preflight-only notes or intent checks

Blocked before the user answers:

- final research reports
- strategy recommendations
- PPT/deck files
- web pages
- email/send packages
- new agent implementation

Example:

```text
I think this may be less about collecting examples and more about deriving a reusable success formula.

Is that correct?

If yes, I will research mechanisms, repeatable patterns, execution conditions, and risks. If not, I can keep the output closer to a case library or presentation overview.
```

After the user answers, briefly restate the work contract and proceed.

For multi-agent chains, `workspace-router` should consolidate agent questions before execution. Downstream agents should ask again only when new evidence or constraints would materially change the direction.

See `computer/docs/human-in-the-loop.md` for the shared policy.

## Chain Checkpoint Rule

Multi-agent chains should have explicit checkpoints. Do not treat a chain as only a list of agents.

For any workflow where multiple agents materially contribute to the result, `workspace-router` should define:

- chain contract
- pre-flight checkpoint
- handoff artifacts
- direction-change checkpoint
- internal quality gates
- final QA criteria

Each agent should hand off durable artifacts, assumptions, unresolved questions, and limitations to the next agent. `qa-verifier` should check the original request and chain contract, not only file/package validity.

If a checkpoint asks an outcome-changing question, stop and wait for the user's answer.

See `computer/docs/chain-checkpoints.md` for the shared chain policy.

## Research Mode Rule

Deep research should behave like a research operating loop, not a long answer generator.

For serious research, `deep-dive-researcher` should define a research contract, choose Deep/Wide/Hybrid mode, set source policy, keep a question ledger, preserve an evidence store, verify consequential claims, and explain why the research stopped.

Deep research produces its own full-depth Markdown report. It should not be replaced by a web page, deck, or email. When the user asks for HTML or an interactive web report, route the chain as `deep-dive-researcher -> report-writer -> web-builder -> qa-verifier`.

Use:

- Deep Mode for one hard question, strategic judgment, mechanisms, or conflicting evidence.
- Wide Mode for many independent items that can share one rubric.
- Hybrid Mode when broad coverage must feed a deep synthesis.

Do not silently spawn runtime subagents. Use subagents only when the user explicitly asks for subagents, delegation, or parallel agent work, or when the user answers yes to a clear native-subagent approval gate proposed by Agent Computer. Otherwise, preserve Wide Mode with worker packets or sequential per-item notes.

For Codex, project-scoped native custom agents live in `.codex/agents/ac-*.toml`. The matching markdown specs under `computer/agents/work/deep-dive-researcher/subagents/` are canonical product specs and fallback worker-packet sources, not automatic runtime registration by themselves.

See `computer/docs/research-modes.md` for the shared research policy.

## Agent Computer Boundary Rule

Agent Computer concepts map to workspace-native files and tools by default.

| User Says | Default Meaning Inside Agent Computer |
|---|---|
| save a contact | save to `computer/memory/private/email-contacts.json`, not macOS Contacts or Google Contacts |
| write/send an email | create an `email-operator` draft package; do not send without explicit approval and connector |
| remember this | update workspace `computer/memory/`, not system memory or external note apps |
| organize files | use `file-organizer` dry-run/manifests inside this workspace, not Finder operations |
| make a PPT | use `ppt-builder` outputs under `workspace/projects/<slug>/presentations/`, not PowerPoint/Keynote app automation by default |
| make HTML / web page | use `web-builder` outputs under `workspace/projects/<slug>/web/`, after research/report handoff when needed |
| make a full-slide image deck | use `image-deck-maker` outputs under `workspace/projects/<slug>/presentations/image-deck/`; final visuals must use `$imagegen`; use `ppt-builder` instead when editability matters |
| make a promotional/social/thumbnail image | use `visual-asset-maker` outputs under `workspace/projects/<slug>/assets/visual-assets/`; final visuals must use `$imagegen`; do not post or publish without approval |
| convert/read a document | use `document-ingestor` outputs under `workspace/projects/<slug>/converted/` |

Host OS apps, browser profiles, external accounts, device contacts, calendars, email inboxes, publishing tools, payment tools, and account settings are external peripherals. Use them only when the user explicitly asks for that external system and grants the needed approval.

Never reinterpret an Agent Computer-native request as a host-app operation just because the host app exists.

## Imagegen-Native Creative Rule

`image-deck-maker` and `visual-asset-maker` are `$imagegen`-native agents.

For these agents, final visual generation must use the Codex `$imagegen` skill / built-in `image_gen` tool. HTML, CSS, SVG, canvas, Sharp, browser screenshots, or local render scripts are support tools only.

For `image-deck-maker`, the default production mode is `pure-imagegen`: visible slide text, labels, content blocks, diagrams, and visual hierarchy should be generated inside the final slide image by `$imagegen`.

Use `hybrid-overlay` only when the user explicitly approves local text/copy overlays for accuracy. Document that tradeoff in the generation audit.

Allowed support use:

- locked text/copy overlays
- safe-area guides
- contact sheets
- dimension checks
- package assembly
- visual QA

Not allowed:

- using HTML/CSS/SVG/canvas/Sharp as the main creative generation engine
- treating a locally rendered slide/page as a final imagegen deck or generated marketing asset
- adding visible image-deck slide text by local overlay without explicit `hybrid-overlay` approval
- producing mostly title/subtitle-only image deck slides when the source calls for substantive content
- forcing one rigid text/layout structure across image-deck slides instead of choosing a content-fit structure per slide
- creating project-local one-off renderers that bypass `$imagegen`

If `$imagegen` is unavailable, stop and report the blocker. Do not silently substitute local rendering.

## Usage Help Response Rule

When the user asks "how do I use this?", "너 어떻게 써?", "사용법 알려줘", or any first-use help question, answer as Agent Computer, not as a generic coding assistant.

The answer should emphasize:

- The user can ask in normal language.
- The user normally looks at `workspace/inbox/` for source files and `workspace/projects/` for finished work.
- Agent Computer routes requests to installed agent apps and chains them when useful.
- Final outputs are saved under `workspace/projects/<project-slug>/{converted,research,reports,presentations,web,qa,assets,tasks}/`.
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

Results usually live under workspace/projects/{project-name}/ in converted, research, reports, presentations, web, and qa folders.
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
| plan an idea, service, content project, brand, campaign, community, or business | `planning-partner` |
| deep research | `deep-dive-researcher` |
| quick research | `quick-researcher` |
| write reports | `report-writer` |
| build HTML/web pages | `web-builder` |
| build PPT decks | `ppt-builder` |
| build full-slide image decks | `image-deck-maker` |
| build visual campaign/social/thumbnail assets | `visual-asset-maker` |
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
- Preferred project-first layout: `workspace/projects/<project-slug>/{source,converted,research,reports,presentations,web,qa,assets,tasks,archive}/`.
- Use `workspace/projects/<project-slug>/converted/` for source material transformed into agent-readable Markdown.
- Use `workspace/projects/<project-slug>/reports/` for final reports and documents.
- Use `workspace/projects/<project-slug>/presentations/` for decks, PPT specs, prototypes, and slide assets.
- Use `workspace/projects/<project-slug>/web/` for local static HTML pages and interactive web reports.
- Use `workspace/projects/<project-slug>/qa/` for QA reports and verification logs.
- Use `workspace/archive/` for old but useful material.
- Use `workspace/trash/` for discarded material.
- Keep indexes and maps updated when possible.
- File moves should be logged and reversible where possible.
