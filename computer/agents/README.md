# Agents

Installed agent apps live here.

## Agent Computer Boundary

Agents operate inside Agent Computer first. Workspace-native tools, memory, files, project folders, and agent apps are the default action space.

Host OS apps and external accounts are peripherals, not defaults. Do not use macOS apps, Google/Outlook accounts, browser profiles, device contacts, calendars, publishing tools, payment tools, or account settings unless the user explicitly asks for that external system and gives the needed approval.

Examples:

- Contact storage means `computer/memory/private/email-contacts.json`.
- Email means draft package first; real sending needs approval and connector.
- File cleanup means `file-organizer` dry-run/manifests.
- Memory means workspace `computer/memory/`.
- Editable deck creation means `ppt-builder` project artifacts.
- Full-slide generated image decks mean `image-deck-maker` project artifacts, with final visuals and visible slide text generated through `$imagegen` by default.
- Campaign/social/thumbnail visual assets mean `visual-asset-maker` project artifacts, with final visuals generated through `$imagegen`.

## Project Isolation

New work starts in a fresh project by default. Do not use a similar existing project as source material, working context, or output target unless the user explicitly asks to continue, update, improve, compare, or use previous work.

If related projects are discovered, mention them as optional context and ask/await approval before reusing them. Otherwise create a new `workspace/projects/<project-slug>/` folder and keep that request's outputs there.

## Always-On Routing

Agents should follow `computer/docs/always-on-routing.md`.

Agent Computer should check every user message for meaningful work, not only the first message in a session.

Route requests to create, transform, inspect, organize, send, research, verify, remember, build, or improve something.

Do not over-route normal conversation. Short reactions, conceptual questions, and feedback without requested action can be answered in chat.

When a message mixes casual language with an action request, route the action request. For example, `좋아. 그럼 이걸 PPT로 만들어줘.` should route to `ppt-builder`.

## Intent Discovery

Agents should follow `computer/docs/human-in-the-loop.md`.

For low intent-sensitivity tasks, proceed without unnecessary questions.

For high intent-sensitivity tasks, discover and confirm intent before execution. If an agent asks a question that can change the outcome, it must stop and wait for the user's answer.

Agent hypotheses are proposals, not decisions. When an inferred purpose changes the output structure, evidence strategy, audience, tone, safety boundary, success criteria, or scope, confirm before acting.

For multi-agent chains, `workspace-router` should consolidate questions so the user is not interrupted by every agent separately.

## Chain Checkpoints

Agents should follow `computer/docs/chain-checkpoints.md`.

For multi-agent workflows, the router should define the chain contract, pre-flight checkpoint, handoff artifacts, direction-change checkpoint, internal quality gates, and final QA criteria.

Each agent should hand off durable artifacts, assumptions, unresolved questions, and limitations. Downstream agents should use the handoff instead of silently inventing a new direction.

## Research Modes

Research agents should follow `computer/docs/research-modes.md`.

`deep-dive-researcher` should choose Deep, Wide, or Hybrid mode, preserve a research contract, keep source/evidence/claim artifacts, and ask before changing an outcome-defining research direction.

## Research Architectures

Deep research should also follow `computer/docs/research-architectures.md`.

Research mode controls breadth. Research architecture controls synthesis shape. `deep-dive-researcher` should preserve `architecture-decision.md`, `hypothesis-map.md`, `red-team-critique.md`, and `synthesis-plan.md` so downstream report and PPT agents do not flatten strategy, GTM, growth, market, technical, source-heavy, or benchmark-synthesis work into a generic report.

## Categories

- `computer/agents/system/`: OS-like agents that route, build, organize, ingest, verify, and maintain the workspace
- `computer/agents/work/`: knowledge work agents that research, write, build decks, email, sell, and analyze data
- `computer/agents/personal/`: reflective or personal support agents

## App Standard

Each agent app should include:

```text
README.md
agent.md
workflow.md
output-template.md
```

Executable agents may also include:

```text
tools/
templates/
tests/
memory/
examples/
```

## Installed Defaults

System:

- `workspace-router`
- `agent-builder`
- `document-ingestor`
- `file-organizer`
- `memory-curator`
- `qa-verifier`

Work:

- `quick-researcher`
- `deep-dive-researcher`
- `planning-partner`
- `report-writer`
- `web-builder`
- `ppt-builder`
- `image-deck-maker`
- `visual-asset-maker`
- `email-operator`
- `instagram-growth-analyst`

Personal:

- `friend-counselor`
