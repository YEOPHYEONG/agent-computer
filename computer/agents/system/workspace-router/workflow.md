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
13. If the execution gate is `STOP_BEFORE_EXECUTION`, ask the gate question and stop. Do not continue into research, reports, decks, web pages, email packages, or agent implementation in the same turn.
14. Do not convert `Ask User Now` into assumptions unless the user explicitly says to proceed under reasonable assumptions or not to ask.
15. If you ask an outcome-changing question, stop and wait for the user's answer. Do not continue execution in the same turn.
16. If you infer hidden intent, present it as a hypothesis and ask for confirmation before acting on it.
15. Match the request to an installed agent.
16. If needed, build an agent chain.
17. Apply Chain Checkpoints from `computer/docs/chain-checkpoints.md`.
18. For multi-agent chains, consolidate required questions into one pre-flight checkpoint before execution.
19. Define the chain contract, handoff artifacts, direction-change checkpoint, internal quality gates, and final QA criteria.
20. Check whether the request includes high-risk actions such as external sending, publishing, deletion, file movement, payments, account changes, or irreversible edits.
21. Mark actions that need explicit approval before execution. Email/message drafts are allowed; actual sending requires approval and an available connector.
22. For report, deck, research, new-agent, or multi-step workflows, add `qa-verifier` at the end unless the user explicitly asks for planning only.
23. After required user answers arrive, restate the work contract briefly and execute or hand off in order.
24. Load each selected agent's instructions.
25. Save durable outputs in the right folders, following `system/organization-policy.md`.
26. Prefer project-first paths: `projects/<project-slug>/<work-type>/`.

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
- Idea, service, content, brand, campaign, community, or business planning: `planning-partner`; keep multi-turn planning state and ask outcome-changing questions.
- Email drafts or outreach sequences: `email-operator`; do not send without explicit approval.
- New executable agent: `agent-builder` -> `qa-verifier`.
- Research that must be current or externally factual: `quick-researcher` or `deep-dive-researcher` -> `qa-verifier`.
- Research to local HTML/web page: `deep-dive-researcher` -> `report-writer` -> `web-builder` -> `qa-verifier`.
- HTML/web page from an approved report: `web-builder` -> `qa-verifier`.
- Approved report/source to full-slide image deck: `image-deck-maker` -> `qa-verifier`.
- Research to full-slide image deck: `deep-dive-researcher` -> `report-writer` -> `image-deck-maker` -> `qa-verifier`.
- Approved brief/copy to visual assets: `visual-asset-maker` -> `qa-verifier`.
- Research or strategy to visual assets: upstream research/planning/report agent -> `visual-asset-maker` -> `qa-verifier`.

Creative image routes are `$imagegen`-native. `image-deck-maker` and `visual-asset-maker` must use `$imagegen` / built-in `image_gen` for final visual generation. HTML/SVG/CSS/canvas/Sharp/browser rendering is allowed only for explicitly approved overlays, contact sheets, package assembly, and QA.

For `image-deck-maker`, default to `pure-imagegen`: visible slide text is generated inside the final image by `$imagegen`, and standard slides should contain enough visible content to stand alone. Each slide should choose a content-fit structure and text coverage target. Use `hybrid-overlay` only after explicit user approval.

## Chain Checkpoint Defaults

- Single-agent routes: no full chain map required; use the agent's own workflow and QA guidance.
- Multi-agent routes: include a `Chain Checkpoints` section in routing or handoff output.
- Pre-flight checkpoint: consolidate user questions that affect multiple agents before execution.
- Handoff checkpoints: list the durable artifacts each agent produces for the next agent.
- Direction-change checkpoint: if an agent discovers a material reason to change direction, ask and wait.
- Internal quality gates: check whether each artifact is good enough before a more expensive downstream artifact is built.
- Final QA: `qa-verifier` checks original request satisfaction, chain contract, handoff completeness, source fidelity, evidence gaps, output validity, approval boundaries, and known limitations.

## Always-On Routing Examples

Continuation work:

```text
좋아. 그럼 이걸 PPT로 만들어줘.
```

Route to `ppt-builder`. If "이걸" is unclear, ask which source to use and wait.

Image deck continuation:

```text
이 보고서로 통이미지 장표 덱 만들어줘.
```

Route to `image-deck-maker`, not `ppt-builder`. Confirm the user wants a mostly non-editable image-based deck and require a text-lock gate before generation.

Also state that final slide visuals and visible slide text should be generated with `$imagegen` by default. Local HTML/SVG text overlay requires explicit `hybrid-overlay` approval and cannot be the main creative engine. Standard content slides should not be title/subtitle-only, and should use content-fit structures instead of one fixed template.

Visual asset continuation:

```text
Agent Computer 런칭용 X 카드랑 GitHub hero 이미지 만들어줘.
```

Route to `visual-asset-maker`. Confirm channel, format, copy-lock, and whether any posting/publishing is requested. Draft assets only by default.

Also state that final assets must be generated with `$imagegen`; local HTML/SVG rendering may support copy overlay or QA but cannot be the main creative engine.

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

## Chain Checkpoint Examples

PDF to report and PPT:

```text
이 PDF 읽고 보고서랑 PPT까지 만들어줘.
```

Chain:

```text
document-ingestor -> report-writer -> ppt-builder -> qa-verifier
```

Checkpoints:

- Pre-flight: ask audience/use case only if it materially changes report or deck.
- Handoff 1: converted Markdown, visual review, and conversion log to report-writer.
- Quality gate: report is structured and evidence-aware enough for deck creation.
- Handoff 2: report, evidence map, must-preserve content, and caveats to ppt-builder.
- Final QA: source fidelity, report quality, PPT editability, visual/render limits, and original request satisfaction.

Research to PPT:

```text
뉴스레터 성공사례를 깊게 조사해서 성공 공식으로 정리하고 PPT로 만들어줘.
```

Checkpoints:

- Pre-flight: confirm formula vs case library, audience, and evidence standard.
- Direction-change: ask if evidence suggests changing the core mechanism.
- Handoff: research report, source map, claim map, and question ledger to report-writer.
- Final QA: content fidelity, evidence limitations, editable PPT, and chain contract satisfaction.
