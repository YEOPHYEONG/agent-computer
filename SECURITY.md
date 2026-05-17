# Security Policy

Agent Computer is an experimental V0 preview. Treat it as local-first software that runs inside a folder you can inspect.

## Supported Versions

| Version | Status |
|---|---|
| `v0-preview` | Experimental preview; security reports welcome |

## Security Model

Agent Computer should:

- keep work inside the workspace
- avoid global environment mutation
- avoid telemetry by default
- avoid hidden background services
- require explicit approval for external actions
- keep private memory out of public releases
- fail clearly when dependencies are missing

## Approval-Gated Actions

These actions must not happen without explicit user approval and an available connector/tool:

- sending email or messages
- publishing online
- deleting files
- moving files in bulk
- making payments
- changing account settings
- accessing external accounts
- using host OS apps as a side effect

Drafting emails, planning file moves, and writing reports are allowed. Actual external actions need approval.

## Private Data

Do not store or commit:

- API keys
- passwords
- tokens
- cookies
- private contacts
- private reports
- private source files
- converted private documents
- customer data

Real contact aliases belong only in:

```text
memory/private/email-contacts.json
```

That path must stay out of public releases.

## Community Agents

Community agents are code and instructions. Inspect them before use.

Before installing or running a third-party agent:

- read `manifest.json`
- inspect `tools/`
- check requested permissions
- prefer local-only tools
- avoid agents that require broad external account access
- run smoke tests in a disposable copy of Agent Computer

V0 does not provide package signing, verified publishers, sandboxed third-party execution, or paid marketplace trust infrastructure.

## Reporting A Vulnerability

If the project is already on GitHub, open a private security advisory when available. If private advisories are not available, open a minimal public issue that does not include exploit details, secrets, or private data.

Include:

- affected file or agent
- what can go wrong
- steps to reproduce using public-safe data
- whether external accounts, file deletion, or private data are involved
- suggested fix if known

Do not post real secrets, tokens, or private user data in an issue.

## Release Safety

Before publishing a release copy, run:

```bash
npm run release:build -- --version v0-preview --force
```

The release builder scans for private/generated artifacts and writes:

```text
dist/agent-computer-v0-preview/RELEASE_MANIFEST.md
```
