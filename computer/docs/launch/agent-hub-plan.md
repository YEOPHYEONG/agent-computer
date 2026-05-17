# Agent Hub Plan

## Concept

Agent Hub is a sharing place for installable Agent Computer apps.

It is not a paid marketplace in V0. It starts as a free community catalog where people can discover useful agents and install them into their own Agent Computer.

Simple distinction:

```text
Agent Hub = shared catalog and gallery
Paid marketplace = later commercial layer, not V0
```

## V0 Scope

V0 Agent Hub can be described as:

- a future community hub
- a curated list of useful agent apps
- a way to share agent folders that include prompts, tools, templates, tests, and docs

Do not promise:

- payments
- accounts
- automatic secure installation
- verified third-party code execution
- ratings/reviews
- hosted agent execution

## Agent Package Anatomy

An installable agent app should include:

```text
agent-name/
  README.md
  agent.md
  workflow.md
  output-template.md
  manifest.json
  tools/
  templates/
  tests/
  examples/
```

Minimum required:

- `README.md`
- `agent.md`
- `workflow.md`
- `output-template.md`
- `manifest.json`

## Draft Manifest

```json
{
  "name": "newsletter-strategist",
  "displayName": "Newsletter Strategist",
  "version": "0.1.0",
  "category": "work",
  "description": "Research newsletter growth cases and turn them into strategy outputs.",
  "author": {
    "name": "Example Author",
    "url": "https://example.com"
  },
  "license": "MIT",
  "entry": {
    "agent": "agent.md",
    "workflow": "workflow.md",
    "outputTemplate": "output-template.md"
  },
  "permissions": {
    "filesystem": "workspace",
    "network": "optional",
    "externalAccounts": "none"
  },
  "tools": [],
  "tags": ["newsletter", "growth", "research"]
}
```

## Install Location

Community agents should install under:

```text
computer/agents/community/<agent-name>/
```

Default agents stay under:

```text
computer/agents/system/
computer/agents/work/
computer/agents/personal/
```

## Future Install Flow

Possible later command:

```bash
node computer/tools/agent-computer.mjs install-agent newsletter-strategist
```

V0 can avoid automatic install and use manual copy instructions instead.

## Safety Model

Before any community agent is trusted:

- inspect `manifest.json`
- inspect the agent's `tools/`
- check requested permissions
- run smoke tests
- avoid global installs
- avoid external accounts unless explicitly approved
- keep third-party tools inside the workspace

## Roadmap

### V0

- Document package anatomy.
- Mention Agent Hub as a coming community sharing place.
- Accept example agents by PR or issue discussion.

### V0.5

- Add local manifest validation.
- Add manual install helper.
- Add compatibility checks.

### V1

- Hosted Agent Hub website.
- Search, tags, author pages, examples.
- Community submissions.
- Optional ratings/reviews.

### Later

- Signed packages.
- Verified agents.
- Paid agent sales, if the ecosystem justifies it.
