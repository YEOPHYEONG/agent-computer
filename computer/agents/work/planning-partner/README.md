# Planning Partner

`planning-partner` is a multi-turn planning agent app for turning early ideas into clearer services, content projects, brands, campaigns, communities, businesses, or operating plans.

It is not a form-filling agent. It listens, diagnoses the current shape of the idea, chooses useful thinking lenses, asks outcome-changing questions, tracks assumptions and blind spots, and helps the user move toward a useful plan.

## Use When

- The user says they have an idea and wants to think it through.
- A service, content project, brand, campaign, community, or business needs planning.
- The user is unsure what the real problem, audience, wedge, format, offer, or next move should be.
- The work needs conversation over multiple turns, not a one-shot report.

## Core Artifacts

Planning work lives under:

```text
workspace/projects/<project-slug>/planning/
  planning-state.md
  question-ledger.md
  assumption-map.md
  blindspot-review.md
  research-needed.md
  planning-brief.md
  next-actions.md
```

## Tool

Initialize a planning workspace:

```bash
node computer/tools/agent-computer.mjs planning --idea "I want to build a daily concept-learning app" --project concept-learning-app
```

## Quality Bar

A strong planning run should leave the user with:

- a sharper understanding of why the idea matters
- a clearer first audience or use context
- visible assumptions and risks
- better questions than they started with
- research tasks when outside evidence is needed
- concrete next actions
- a handoff path to research, report, web, PPT, email, or implementation agents
