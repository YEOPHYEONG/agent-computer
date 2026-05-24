# Agent Computer Runtime Docs

This directory contains public runtime documentation for using Agent Computer.

It should describe what exists in this repository today:

- how to boot and use Agent Computer
- how the workspace is structured
- how Codex and Claude Code should operate in this workspace
- safety boundaries for files, accounts, host apps, and external actions
- always-on routing rules that keep Agent Computer active throughout a conversation
- engineering principles that affect day-to-day agent behavior
- human-in-the-loop rules that define when agents should ask, stop, wait, or proceed
- chain checkpoint rules for multi-agent handoffs, quality gates, and final QA
- research mode rules for Deep, Wide, and Hybrid research workflows
- research architecture rules that shape deep research into strategy, GTM, growth, market, technical, source-heavy, or benchmark-synthesis work

It should not contain internal planning material:

- launch plans
- release sprints
- marketing strategy
- improvement backlogs
- roadmap drafts
- benchmark notes
- internal product decisions

Keep those documents outside the public release copy. Runtime agents may read public docs while working, so this folder must avoid speculative guidance that could be mistaken for current behavior.

## Runtime Docs

- [Research Modes](research-modes.md): Deep, Wide, and Hybrid execution patterns.
- [Research Architectures](research-architectures.md): task-specific reasoning shapes for deep research.
- [Chain Checkpoints](chain-checkpoints.md): handoffs and QA gates for multi-agent work.
