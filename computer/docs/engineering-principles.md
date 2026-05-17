# Engineering Principles

Agent Computer must be safe to clone, inspect, and run.

## Local-First

- Tools run inside the repository.
- Outputs are written inside the workspace.
- No hidden background services.
- No telemetry by default.
- No cloud service is required for V0.

## No Global Environment Mutation

Tools must not:

- install global npm packages
- modify shell profiles
- modify global Git config
- write to `/usr/local`, `/opt`, system folders, or user home config folders
- create background daemons
- silently install heavy dependencies
- store secrets in environment files

Allowed:

- local `package.json`
- local scripts under `tools/`
- local generated outputs under workspace folders
- clear dependency errors with installation instructions

## Dependency Policy

- Prefer Node.js standard library where reasonable.
- Add dependencies only when they materially improve reliability.
- Pin dependencies in `package.json` when used.
- Do not auto-install dependencies during normal commands.
- If a command needs Poppler, LibreOffice, Playwright, a vision helper, or another external tool, check availability first and fail clearly if missing.

## File Safety

- Do not write outside the workspace.
- Do not delete files without explicit user approval.
- File moves must be logged.
- Actual file moves require explicit confirmation.
- Bulk moves must support dry-run first.
- Destructive operations must be reversible where possible.

## Public Repo Safety

- Do not commit private memory.
- Do not commit private reports.
- Do not commit converted private documents.
- Do not commit secrets, API keys, tokens, cookies, or credentials.
- Public examples must use fictional, public-domain, or clearly licensed material.

## Tool Behavior

Every tool should:

- print what it did
- write predictable files
- fail loudly on missing dependencies
- avoid pretending a partial operation succeeded
- keep logs for operations that change files
