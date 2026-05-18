# GitHub First Impression

Use this when configuring the public GitHub repo before launch.

## Goal

Make a new visitor understand Agent Computer in under 10 seconds:

```text
This is a local workspace where Codex / Claude Code agents run like apps and turn messy requests into organized project outputs.
```

The first impression should feel practical, not speculative. It should communicate:

- local-first
- file-based
- agent apps
- durable project outputs
- useful default workflows
- experimental V0 preview

## Recommended Repo Description

Primary:

```text
A local workspace where Codex and Claude Code agents run like apps, turning messy requests into organized project folders, reports, decks, drafts, and QA logs.
```

Shorter:

```text
A file-based computer where Codex and Claude Code agents run like apps.
```

More outcome-driven:

```text
Turn one-off AI chats into durable project folders with research, reports, decks, drafts, conversions, and QA.
```

Developer-focused:

```text
Local-first agent workspace for Codex and Claude Code: agents as apps, outputs as files, work as projects.
```

Avoid:

```text
An autonomous AI OS.
The future of AI agents.
A marketplace for AI agents.
A no-code agent platform.
```

Those phrases overpromise or make the project sound like a SaaS product instead of an inspectable local V0 preview.

## Recommended Topics

Use 10-12 topics so the repo remains focused.

```text
ai-agents
codex
claude-code
agent-workflow
agentic-workflows
local-first
knowledge-work
automation
research
powerpoint
markdown
open-source
```

Optional later topics:

```text
multi-agent
file-based
workflow-automation
productivity
```

## Social Preview

Use:

```text
computer/docs/assets/agent-computer-cover-v3.png
```

Social preview message:

```text
Stop losing agent work in chat history. Boot an Agent Computer.
```

What the image should imply:

- raw files and prompts enter the workspace
- agent apps process the work
- project outputs appear as reports, slides, drafts, folders, and QA
- a visible agent orchestrator exists, but the product is not a robot assistant

## README Above-The-Fold Checklist

The first screen should contain:

- project name
- one memorable line
- cover image
- 2-3 sentence explanation
- experimental V0 status
- clear next step: `START_HERE.md`

Current preferred hero:

```md
# Agent Computer

Stop writing prompts. Boot an agent computer.

![Agent Computer cover](computer/docs/assets/agent-computer-cover-v3.png)

Agent Computer is a file-based workspace where AI agents work like apps. They read files, use tools, remember context, create reports, build decks, organize outputs, and help you run knowledge work.
```

Possible sharper hero:

```md
# Agent Computer

Stop losing agent work in chat history. Boot an Agent Computer.

![Agent Computer cover](computer/docs/assets/agent-computer-cover-v3.png)

Agent Computer is a local, file-based workspace where Codex, Claude Code, and similar coding agents run agents like apps. A single request can become a routed workflow, project folder, research report, editable deck, draft, converted document, and QA log.
```

Use the sharper hero if early testers say the current hero is clear but not compelling enough.

## Pinned Demo Workflow

Use one demo consistently across README, launch posts, and screenshots:

```text
Research newsletter success cases deeply, extract the repeatable growth formulas, and turn the findings into a rich editable PPT.
```

Expected story:

```text
natural request
-> deep-dive-researcher
-> report-writer
-> ppt-builder
-> qa-verifier
-> workspace/projects/newsletter-success-formula/
```

Why this demo works:

- it is concrete enough to understand
- it uses multiple agents
- it produces visible artifacts
- it shows why project folders matter
- it demonstrates research, writing, deck building, and QA in one flow

## GitHub Sidebar Setup

Recommended:

- Website: leave blank until there is a demo page or Agent Hub landing page.
- Releases: create `v0.1.0-preview` after fresh-user testing.
- Discussions: enable after first launch if you want feedback and agent submissions.
- Issues: enable for bugs, agent requests, and feedback.
- Wiki: keep disabled for now; docs should live in the repo.

## First Issues To Create

Create 4-6 starter issues after launch:

- Improve one end-to-end demo workflow.
- Add a new default agent proposal.
- Build an example community agent manifest.
- Improve PPT visual render QA across environments.
- Add more document-ingestor fixtures.
- Design the first Agent Hub catalog page.

Labels:

```text
good first issue
agent request
docs
demo
qa
agent-hub
```

## First-Time Visitor Success Test

Ask someone to open the repo and answer:

1. What is this?
2. Who is it for?
3. How do I try it?
4. Where do outputs go?
5. What is experimental or limited?

Pass condition:

- They can answer all five without reading more than the README first screen and Quick Start.

## Final Pre-Launch Checks

- README image renders on GitHub.
- Repo description uses the primary or shorter line.
- Topics are installed.
- `START_HERE.md` is visible from README.
- `workspace/` folder model is clear.
- npm commands are clearly optional.
- The project does not imply affiliation with OpenAI, Anthropic, or any model provider.
- V0 preview status is visible before any launch post goes live.
