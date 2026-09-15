# Launch Readiness Sprint

## Objective

Prepare Agent Computer for an open-source V0 preview launch that can earn attention, GitHub stars, and useful feedback without overstating maturity.

## Product Positioning

Name: Agent Computer

Short line:

> A file-based computer where coding agents run like apps.

Launch thesis:

> Stop losing agent work in chat history. Boot an Agent Computer.

Release posture:

- Experimental V0 preview.
- Built for Codex, Claude Code, and coding-agent power users.
- Local-first and inspectable.
- Not a SaaS dashboard.
- Not a prompt library.
- Not a finished marketplace.
- Not a stable autonomous OS.

## Core User Experience

1. User opens the folder in Codex or Claude Code.
2. The runtime reads `AGENTS.md` or `CLAUDE.md`.
3. User asks in natural language.
4. Agent Computer routes to installed agent apps.
5. Outputs are saved under `workspace/projects/<project-slug>/`.
6. QA and limitations are recorded.

## Workstreams

| Workstream | Goal | Status |
|---|---|---|
| Release copy | Build a clean distributable copy under `dist/` | Done: release builder generates `dist/agent-computer-v0-preview/` |
| Repo hygiene | Remove private/generated artifacts from public release | Done for release copy; needs final fresh-user review |
| README | Make the concept understandable in under 60 seconds | Planned |
| Folder UX | Separate operating layer from user-facing projects | Planned |
| Default agents | Keep V0 agents working and documented | In progress |
| Demo | Show one high-value workflow clearly | Planned |
| Agent Hub | Introduce the future sharing platform lightly | Planned |
| Launch kit | Prepare posts, screenshots, and channel-specific copy | Planned |
| Fresh-user rehearsal | Test from a clean copy before publishing | Next |

## Sprint Phases

### Phase 1: Release Copy Foundation

- Define include/exclude rules.
- Create release builder script.
- Generate `dist/agent-computer-v0-preview/`.
- Run private-data and generated-output scan.
- Run route smoke tests.

### Phase 2: Public Documentation

- Rewrite README for humans.
- Add `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, and release checklist.
- Clarify local-first, no telemetry, approval gates, and known limitations.
- Add `workspace/projects/README.md` and `workspace/inbox/README.md` to guide users.

### Phase 3: Demo And Examples

- Pick one killer demo flow.
- Keep demo source small and public-safe.
- Produce screenshot/GIF/video plan.
- Include example output previews without private data.

### Phase 4: Agent Hub Teaser

- Document the Agent Hub concept.
- Define agent package anatomy.
- Add manifest draft.
- Suggest `computer/agents/community/` for installed community agents.

### Phase 5: Fresh-User Rehearsal

- Open release copy in a new Codex/Claude Code session.
- Ask natural questions, not engineered prompts.
- Verify outputs land in `workspace/projects/`.
- Verify no accidental host-app behavior.
- Verify deep research and PPT workflows follow the new depth/reference rules.

### Phase 6: Launch

- Publish GitHub repo.
- Share with 5-10 coding-agent power users.
- Fix first feedback.
- Launch on X/Twitter, Hacker News Show HN, and selected communities.

## Definition Of Done For V0 Preview

- Clean release copy exists and passes scan.
- README explains the concept, usage, default agents, safety, and limits.
- Fresh-user route smoke passes.
- At least one end-to-end demo workflow works in the release copy.
- Known limitations are visible.
- Agent Hub is framed as a future sharing platform, not a finished paid marketplace.
- Launch copy and first channels are prepared.
