# Workflow

1. Read the user request.
2. Apply Always-On Routing from `computer/docs/always-on-routing.md`.
3. Classify routing mode:
   - New work: a new task, artifact, topic, or project.
   - Continuation work: transform, revise, extend, or build from current context.
   - Correction: update a prior assumption, audience, goal, scope, or work contract.
   - Question-only: explain or discuss without creating work artifacts.
4. If the message is question-only or ordinary conversation, answer in chat and do not create a project unless the user asks to save something.
5. If the message contains casual language plus an action request, route the action request.
6. Apply the Agent Computer Boundary Rule: handle the request inside this workspace first unless the user explicitly asks for an external app/account.
7. Apply the New Request Isolation Rule: new requests create fresh projects by default.
8. For continuation work, use active conversation context only when the referent is clear. If "this", "that", "이거", or "그거" is ambiguous, ask which source or project to use and wait.
9. Apply the Human-in-the-Loop policy from `computer/docs/human-in-the-loop.md`.
10. Identify the desired output.
11. Classify intent sensitivity:
   - Low: conversion, simple summary, QA, formatting, indexing, or already-specific instructions.
   - Medium: rough report, email draft, quick research, or first-time organization.
   - High: deep research, PPT/deck, web page, strategy, marketing, sales, branding, counseling, new agent, or large multi-agent artifact.
12. For high intent-sensitivity work, identify the surface request and likely hidden goals. Ask concise Socratic questions when the answers would materially change the output.
13. If you ask an outcome-changing question, stop and wait for the user's answer. Do not continue execution in the same turn.
14. If you infer hidden intent, present it as a hypothesis and ask for confirmation before acting on it.
15. For multi-agent chains, consolidate required questions into one checkpoint before execution.
16. Match the request to an installed agent.
17. If needed, build an agent chain.
18. Check whether the request includes high-risk actions such as external sending, publishing, deletion, file movement, payments, account changes, or irreversible edits.
19. Mark actions that need explicit approval before execution. Email/message drafts are allowed; actual sending requires approval and an available connector.
20. For report, deck, research, new-agent, or multi-step workflows, add `qa-verifier` at the end unless the user explicitly asks for planning only.
21. After required user answers arrive, restate the work contract briefly and execute or hand off in order.
22. Load each selected agent's instructions.
23. Save durable outputs in the right folders, following `system/organization-policy.md`.
24. Prefer project-first paths: `projects/<project-slug>/<work-type>/`.

## Boundary Defaults

- Contact storage: `email-operator` and `memory/private/email-contacts.json`, not macOS Contacts or Google Contacts.
- Email: `email-operator` draft package first; actual sending requires explicit approval and connector.
- Memory: `memory-curator` and workspace `memory/`, not external note apps.
- File organization: `file-organizer` dry-run/manifests, not Finder by default.
- Decks: `ppt-builder` project artifacts, not PowerPoint/Keynote automation by default.
- Documents: `document-ingestor` converted Markdown, not external document app automation by default.

## Project Decision Defaults

- Usage/help requests such as "How do I use this workspace?", "너 어떻게 써?", or "사용법 알려줘" are not project work. Answer from `START_HERE.md`, `README.md`, `AGENTS.md`, and `computer/docs/workspace-structure.md` without creating a project unless the user asks to save the guide.
- A good usage/help answer should tell the user to ask in natural language, put source files in `workspace/inbox/`, find final work in `workspace/projects/`, and expect outputs such as converted docs, research, reports, presentations, and QA logs under `workspace/projects/<project-slug>/`.
- Do not frame `agents/`, `tools/`, `system/`, or `templates/` as user-facing result folders. They are the operating layer.
- New work default: create a fresh `projects/<project-slug>/`.
- Existing project reuse requires explicit user intent such as continue, update, improve, compare, or use previous outputs.
- Similar existing projects may be mentioned as optional context, but they are not source material and not output targets unless the user approves reuse.
- If the user corrects the project decision, immediately switch and keep the old project untouched.
- Include a `Project Decision` section in routing or handoff output.

## Routing Mode Defaults

- New work: create a fresh project unless the user clearly says to use an existing one.
- Continuation work: use active conversation context when clear; otherwise ask which source/project to use.
- Correction: update the current work contract. Do not create a new project unless the user asks for a new artifact or revision.
- Question-only: answer in chat. Do not create files or projects.
- Mixed message: route the action part and ignore casual filler.
- Include a `Routing Mode` section in routing or handoff output.

## Intent Decision Defaults

- Low intent-sensitivity tasks should proceed without Socratic questioning.
- Medium intent-sensitivity tasks should ask only when missing context changes the output.
- High intent-sensitivity tasks should include intent discovery before execution.
- If the router asks a question, the correct output is the question plus a pause. Do not execute tools, create files, or start the agent chain until the user answers.
- If the user answers a prior confirmation question, continue from the confirmed work contract.
- If the user says to proceed with the agent's hypothesis, use that hypothesis as the chain contract.
- If the user rejects the hypothesis, revise the route and contract before execution.

## Chain Defaults

- Usage/help: `workspace-router`, answer in chat unless the user asks for a saved guide.
- PDF/document conversion only: `document-ingestor`.
- PDF/document to report and PPT: `document-ingestor` -> `report-writer` -> `ppt-builder` -> `qa-verifier`.
- Workspace organization: `file-organizer`; default to dry-run and require approval/`--yes` for actual moves.
- Email drafts or outreach sequences: `email-operator`; do not send without explicit approval.
- New executable agent: `agent-builder` -> `qa-verifier`.
- Research that must be current or externally factual: `quick-researcher` or `deep-dive-researcher` -> `qa-verifier`.

## Always-On Routing Examples

Continuation work:

```text
좋아. 그럼 이걸 PPT로 만들어줘.
```

Route to `ppt-builder`. If "이걸" is unclear, ask which source to use and wait.

Email continuation:

```text
오케이. 차니한테 보낼 메일 초안 써줘.
```

Route to `email-operator`. Resolve the contact alias if saved. Draft only by default.

Correction:

```text
아니, 투자자용이 아니라 내부 팀 실행용이야.
```

Treat as a correction to the work contract. Ask whether to revise the current artifact if no explicit deliverable is named.

Question-only:

```text
왜 이게 그냥 Codex 쓰는 것보다 나아?
```

Answer in chat. Do not create project files unless requested.

## Confirmation Gate Examples

High-intent request:

```text
뉴스레터 성공사례를 조사해서 내용이 풍부한 PPT로 만들어줘.
```

Do not immediately execute. Ask:

```text
이 요청은 단순 사례 수집보다 재현 가능한 성공 공식 도출이 핵심일 수 있습니다.

이 해석이 맞나요?

맞다면 성장 메커니즘, 반복 패턴, 적용 조건, 실패 리스크 중심으로 조사하고 PPT를 만들겠습니다. 아니라면 사례 라이브러리나 발표용 개요 중심으로 조정하겠습니다.
```

Then stop.

Low-intent request:

```text
이 PDF를 에이전트용 문서로 변환해줘.
```

Proceed with `document-ingestor` and do not ask broad intent questions unless the file/source is missing.
