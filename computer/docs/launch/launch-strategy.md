# Launch Strategy

## Goal

Launch Agent Computer as a compelling open-source V0 preview and earn meaningful early GitHub stars, feedback, and contributors from coding-agent power users.

## Target Users

Primary:

- Codex users
- Claude Code users
- developers already comfortable with local files, Git, CLI, and agent instructions
- people building personal AI workflows
- prompt/agent power users frustrated by chat-history-only work

Secondary:

- researchers and operators who want durable reports, decks, and workspace organization
- open-source tinkerers interested in agent app ecosystems

## Core Message

Main:

> Stop losing agent work in chat history. Boot an Agent Computer.

Support:

> A file-based computer where Codex and Claude Code run agents like apps.

Differentiators:

- Not another chatbot.
- Not a SaaS dashboard.
- Not a prompt library.
- Agents are apps with files, tools, workflows, templates, tests, and QA.
- Work becomes durable artifacts under `workspace/projects/`.
- Local-first and inspectable.

## Demo Strategy

The demo should show one obvious transformation:

```text
Natural request -> agent chain -> project folder -> report/PPT/QA outputs
```

Recommended demo:

```text
뉴스레터 성공사례를 딥하게 조사하고, 성공 공식으로 정리해서 내용이 풍부한 PPT로 만들어줘
```

What to show:

- opening folder in Codex or Claude Code
- `AGENTS.md` boot
- natural-language request
- routing to `deep-dive-researcher -> report-writer -> ppt-builder -> qa-verifier`
- `workspace/projects/<project-slug>/` result folder
- sample report
- sample PPT spec or deck
- QA file

## Launch Sequence

### Step 1: Quiet Preview

- Share with 5-10 coding-agent power users.
- Ask them to run one workflow from a clean copy.
- Collect confusion points.
- Fix README and folder UX.

### Step 2: GitHub Public

- Publish repo.
- Add topics:
  - `ai-agents`
  - `codex`
  - `claude-code`
  - `agent-workflow`
  - `local-first`
  - `automation`
  - `knowledge-work`

### Step 3: Social Launch

Channels:

- X/Twitter thread
- Hacker News Show HN
- Reddit communities only if the post is honest and useful:
  - `r/ClaudeAI`
  - `r/OpenAI`
  - `r/LocalLLaMA`
  - `r/SideProject`
  - `r/opensource`

### Step 4: Follow-Up

- Post example agents.
- Show Agent Hub preview.
- Publish "build your own agent app" guide.
- Convert feedback into issues.

## Launch Post Angles

Title options:

- Stop writing prompts. Boot an Agent Computer.
- I built a file-based computer for Codex and Claude Code agents.
- Agents should be apps, not chat threads.
- Show HN: Agent Computer - a local workspace where coding agents run like apps.

## README Hero Requirements

- One-line concept.
- 5-second visual mental model.
- Small workflow diagram.
- Quick Start with natural language.
- Real default agent list.
- Safety and limitations.
- Agent Hub teaser.

## Star Drivers

People star when they quickly understand one of these:

- "I want to try this."
- "This is a useful mental model."
- "This could become an ecosystem."
- "I can build my own agent app for this."

Therefore the launch package needs:

- strong README
- clear demo
- install-free mental model
- community/Agent Hub path
- contributor-friendly agent app template

## Risks

| Risk | Mitigation |
|---|---|
| Looks like a prompt library | Emphasize executable agents with tools, workflows, templates, tests, and QA |
| Looks like a SaaS promise | Say local-first V0 preview |
| Users expect npm service | Quick Start should be Codex/Claude Code folder usage first |
| Generated docs feel cluttered | Keep release copy clean and project-first |
| Agent Hub sounds like paid marketplace too early | Frame as free sharing platform first |
