# Agent Registry

## System Agents

| Agent | Path | Purpose |
|---|---|---|
| workspace-router | `computer/agents/system/workspace-router` | Route requests to agents |
| agent-builder | `computer/agents/system/agent-builder` | Build executable agent apps |
| document-ingestor | `computer/agents/system/document-ingestor` | Convert files to agent-readable Markdown |
| file-organizer | `computer/agents/system/file-organizer` | Plan, move, log, and undo workspace file organization |
| memory-curator | `computer/agents/system/memory-curator` | Maintain useful memory |
| qa-verifier | `computer/agents/system/qa-verifier` | Verify output quality |

## Work Agents

| Agent | Path | Purpose |
|---|---|---|
| quick-researcher | `computer/agents/work/quick-researcher` | Fast focused research |
| deep-dive-researcher | `computer/agents/work/deep-dive-researcher` | Deep research |
| planning-partner | `computer/agents/work/planning-partner` | Multi-turn planning partner for ideas, services, content, brands, campaigns, communities, and projects |
| report-writer | `computer/agents/work/report-writer` | Reports and documents |
| web-builder | `computer/agents/work/web-builder` | Local static HTML pages and interactive web reports |
| ppt-builder | `computer/agents/work/ppt-builder` | Editable PPT decks |
| image-deck-maker | `computer/agents/work/image-deck-maker` | `$imagegen`-native full-slide generated image decks from approved source content |
| visual-asset-maker | `computer/agents/work/visual-asset-maker` | `$imagegen`-native campaign, social, thumbnail, banner, launch, and showcase images from approved briefs and copy |
| email-operator | `computer/agents/work/email-operator` | Email drafts and follow-ups |
| instagram-growth-analyst | `computer/agents/work/instagram-growth-analyst` | Analyze local Instagram performance data and produce growth experiments without external account access |

## Personal Agents

| Agent | Path | Purpose |
|---|---|---|
| friend-counselor | `computer/agents/personal/friend-counselor` | Reflection and supportive conversation |

## Native Subagent Support

Native subagents are a runtime capability, not a property every agent app needs.

| Agent app | Support level | Rule |
|---|---|---|
| deep-dive-researcher | Native Codex custom agents available via `.codex/agents/ac-*.toml` | Use for serious research only after explicit user approval or explicit user request. Save findings under `workspace/projects/<project-slug>/research/subagent-results/ac-*.md`. |
| planning-partner | Handoff only | Clarify intent and hand off to `deep-dive-researcher` when specialist research is needed. |
| report-writer | Consume research package | Do not spawn research subagents directly by default. Use the deep-dive research package, including `ac-report-composer.md` when present. |
| web-builder | Consume approved source | Do not conduct deep research. Build from approved reports and research packages. |
| ppt-builder | Consume approved source | Do not conduct deep research. Build from approved reports, specs, and source material. |
| image-deck-maker | No research subagents by default | Generate full-slide visuals through `$imagegen` from approved source content and locked slide text. |
| visual-asset-maker | No research subagents by default | Generate visual assets through `$imagegen` from approved copy and creative direction. |
| document-ingestor / file-organizer / memory-curator / email-operator / qa-verifier | Single-agent by default | Keep workflows focused and approval-gated. |
