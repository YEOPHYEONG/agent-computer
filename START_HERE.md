# Start Here

Welcome to Agent Computer.

This folder is meant to feel like a small computer for agents. You open it with Codex, Claude Code, or another coding agent, then ask for work in normal language.

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
너 어떻게 써?
```

The expected answer should explain Agent Computer usage, not generic Codex or Claude usage. It should point you to `workspace/inbox/` for source files and `workspace/projects/` for final results.

Then try a real task:

```text
Research newsletter success cases deeply and turn the findings into a rich editable PPT.
```

Agent Computer should create a fresh project, save outputs under `workspace/projects/`, and run QA when appropriate.

## Good Usage Answer

If you ask how to use Agent Computer, the answer should sound roughly like this:

```text
그냥 자연어로 시키면 됩니다. 이 폴더는 Agent Computer라서 요청을 받으면 알맞은 에이전트 앱을 골라 작업하고 결과를 workspace/projects/ 아래에 프로젝트별로 남깁니다.

주로 보면 되는 곳은 두 군데입니다.

- workspace/inbox/: 처리할 원본 자료를 넣는 곳
- workspace/projects/: 보고서, PPT, 변환 문서, QA 결과가 프로젝트별로 쌓이는 곳

예를 들면 이렇게 말하면 됩니다.

"이 PDF를 에이전트용 문서로 변환하고 보고서와 PPT까지 만들어줘."
"뉴스레터 성공사례를 딥하게 조사해서 성공 공식으로 정리하고 풍부한 PPT로 만들어줘."
"이 폴더를 프로젝트별로 정리해줘. 먼저 dry-run으로 보여줘."
"차니에게 보낼 이메일 초안 작성해줘."

결과는 보통 workspace/projects/{project-name}/ 안의 converted, research, reports, presentations, qa 폴더에서 찾으면 됩니다.

이메일 발송, 외부 계정, macOS 앱, 삭제, 실제 파일 이동 같은 행동은 명시적으로 승인받기 전에는 하지 않습니다.
```

## Folder Model

For the full map, see [Workspace Structure](computer/docs/workspace-structure.md).
