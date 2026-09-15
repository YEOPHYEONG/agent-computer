# Launch Copy

Use this when publishing Agent Computer V0 preview.

## GitHub Repo Description

File-based computer for Codex and Claude Code agents. Agents run like apps, save work under `workspace/projects`, and produce reports, decks, drafts, conversions, and QA.

## GitHub Topics

```text
ai-agents
codex
claude-code
agent-workflow
local-first
automation
knowledge-work
agentic-workflows
powerpoint
research
```

## One-Line Positioning

Stop losing agent work in chat history. Boot an Agent Computer.

## Short Pitch

Agent Computer is a local, file-based workspace where coding agents run specialized agents like apps. A request can become a routed workflow, a project folder, a report, an editable PPT, an email draft, a converted document, and a QA log.

It is not a chatbot, not a SaaS dashboard, and not just a prompt library. The point is to make agent work inspectable, durable, and reusable.

Status: experimental V0 preview.

## README Hero Variant

```md
# Agent Computer

Stop losing agent work in chat history. Boot an Agent Computer.

Agent Computer is a local, file-based workspace where Codex, Claude Code, and similar coding agents run agents like apps. It routes work, creates project folders, saves outputs, uses tools, remembers context, and verifies results.

Try asking:

> Research newsletter success cases deeply, find the repeatable formulas, and turn the findings into a rich editable PPT.
```

## Demo Script

Show one transformation:

```text
Natural request
-> routed agent chain
-> workspace/projects/{project-slug}/
-> research report
-> PPT plan/prototype/editable deck
-> QA log
```

Recommended request:

```text
뉴스레터 성공사례를 딥하게 조사해서 성공 공식으로 정리하고 풍부한 PPT로 만들어줘
```

Screen beats:

1. Open the folder in Codex or Claude Code.
2. Show `START_HERE.md`.
3. Ask `너 어떻게 써?`.
4. Ask the newsletter research-to-PPT prompt.
5. Show the route: `deep-dive-researcher -> report-writer -> ppt-builder -> qa-verifier`.
6. Show the generated project folder.
7. Open the report, deck plan, and QA file.

## X/Twitter Thread Draft

Post 1:

```text
I built Agent Computer: a local file-based workspace where Codex / Claude Code agents run like apps.

The idea: stop losing agent work in chat history. Turn requests into project folders, reports, decks, drafts, converted docs, and QA logs.
```

Post 2:

```text
It is not a chatbot wrapper or prompt library.

Agents are folders with roles, workflows, templates, tools, tests, and QA.

The workspace treats agents like installed apps:
- document-ingestor
- deep-dive-researcher
- report-writer
- ppt-builder
- email-operator
- file-organizer
```

Post 3:

```text
Example:

"Research newsletter success cases deeply and turn the success formulas into a rich editable PPT."

Agent Computer routes:
deep-dive-researcher -> report-writer -> ppt-builder -> qa-verifier

Outputs go under workspace/projects/{project}/ instead of disappearing into chat.
```

Post 4:

```text
V0 is experimental and local-first.

You open the folder with Codex, Claude Code, or a similar coding agent. npm commands are optional smoke helpers, not the main product experience.
```

Post 5:

```text
I am also sketching Agent Hub: a community place to share installable agent apps for Agent Computer.

For now, I want feedback from coding-agent power users:
- does the mental model click?
- do the default agents help?
- where does the workflow feel confusing?
```

Post 6:

```text
GitHub: {repo-url}

Try the V0 preview, run one real workflow, and tell me where it breaks or feels magical.
```

## Hacker News Show HN

Title:

```text
Show HN: Agent Computer - a local workspace where coding agents run like apps
```

Body:

```text
Hi HN,

I built Agent Computer, an experimental local workspace for Codex, Claude Code, and similar coding agents.

The core idea is simple: agent work should not disappear inside chat history. It should become inspectable files: project folders, converted documents, research briefs, reports, decks, email drafts, QA logs, and reusable memory.

Agent Computer treats agents like installed apps. Each agent is a folder with role docs, workflows, templates, and, when needed, executable tools/tests. The V0 includes agents for routing, document ingestion, deep research, report writing, PPT building, file organization, email drafting, memory curation, and QA.

This is not a SaaS app and not a finished autonomous OS. It is a local-first V0 preview for people already comfortable opening a folder with a coding agent.

I would love feedback on:

- whether the "agent computer" mental model is clear
- whether the folder structure feels useful or too heavy
- which default agents should be stronger
- what a community Agent Hub should look like

Repo: {repo-url}
```

## Reddit / Community Post

Title:

```text
I built a local "Agent Computer" workspace for Codex / Claude Code workflows
```

Body:

```text
I have been experimenting with a file-based workspace where coding agents run specialized agents like apps.

Instead of treating every task as a one-off chat, Agent Computer routes requests into project folders with durable outputs: converted docs, research, reports, PPT plans/decks, email drafts, QA logs, and memory.

V0 is open source and experimental. It is aimed at people who already use Codex, Claude Code, or similar coding agents and want more durable workflows.

The part I am most interested in feedback on:

- does the folder-based mental model help?
- are executable agent apps better than prompt files?
- what default agents would you want installed?
- would you share/install community agents through an Agent Hub?

Repo: {repo-url}
```

## Direct Preview Message

```text
Hey, I am preparing a small open-source preview called Agent Computer.

It is a local folder you open with Codex or Claude Code. Inside, agents behave like apps and create durable outputs under project folders: research, reports, PPT decks, drafts, converted docs, QA logs, etc.

I am looking for coding-agent power users to try one real workflow and tell me where the concept is confusing or useful.

Repo: {repo-url}

The best first test is:
"Research newsletter success cases deeply and turn the success formulas into a rich editable PPT."
```

## Demo GIF / Video Plan

Length: 45-75 seconds.

Scenes:

1. Open repo folder.
2. Show `START_HERE.md`.
3. Ask `너 어떻게 써?`.
4. Ask one real workflow.
5. Show routing output.
6. Show `workspace/projects/{project-slug}/` result folders.
7. Open report, presentation plan/deck, and QA.

Avoid:

- implying cloud automation or hosted SaaS
- showing private files
- claiming stable production readiness
- presenting `npm run demo` as the primary user flow

## First Feedback Targets

Ask 5-10 people who already understand coding agents:

- Codex users
- Claude Code users
- developers who use local scripts and Markdown
- people who create reports/decks/research with AI
- people building personal agent workflows

Ask them to test one thing:

```text
Open the folder, ask how to use it, then run one real task. Tell me where you got confused.
```

## Sources

- `computer/docs/launch/launch-strategy.md`
- `README.md`
- `START_HERE.md`
- `computer/docs/workspace-structure.md`
- Fresh-user rehearsal notes from the clean release copy.
