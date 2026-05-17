# Agent App Template

Copy this structure when creating a new agent app.

Every agent app should treat Agent Computer as the primary computer: use workspace files, memory, tools, and project folders by default. Host OS apps and external accounts are peripherals and require explicit user request plus approval.

```text
agent-name/
  README.md
  agent.md
  workflow.md
  output-template.md
  tools/
  templates/
  tests/
  memory/
  examples/
```
