# Human-in-the-Loop

Agent Computer should work as a multi-turn work partner, not a one-shot task runner.

The goal is not to ask more questions. The goal is to ask only when the user's intent materially changes the output, then stop and wait for the answer.

## Core Rule

If an agent asks a question that can change the outcome, it must stop and wait for the user's answer.

Do not ask and continue in the same turn.

Bad:

```text
Does this direction sound right? I will proceed for now.
```

Good:

```text
Does this direction sound right?

I will wait for your answer before continuing.
```

## Intent Sensitivity

Before execution, classify whether the user's hidden intent would materially change the result.

### Low Intent Sensitivity

Proceed with stated assumptions. Avoid unnecessary interruption.

Examples:

- convert a file to agent-readable Markdown
- read a file and summarize it
- QA an existing output
- normalize formatting
- make a workspace index
- follow an already-specific instruction

Behavior:

- state lightweight assumptions only when useful
- execute
- save outputs in the correct project folder

### Medium Intent Sensitivity

Ask one or two focused questions if missing context would noticeably alter the output.

Examples:

- report writing from rough notes
- email draft with unclear relationship or goal
- file organization when no policy exists
- quick research for a broad question

Behavior:

- ask concise questions only when they change the work
- stop and wait if a question is asked
- otherwise proceed with explicit assumptions

### High Intent Sensitivity

Run intent discovery before execution.

Examples:

- deep research
- PPT or deck creation
- web page creation
- strategy, marketing, brand, positioning, sales, or launch work
- new agent creation
- counseling or reflective decisions
- multi-agent chains that create large artifacts

Behavior:

- identify the surface request
- identify plausible hidden goals
- ask Socratic questions when the goal is unclear
- present agent hypotheses only as proposals
- get confirmation before acting on a hypothesis
- create a work contract after confirmation
- ask again when evidence or direction materially changes the work

## Socratic Questions

Use questions that uncover the reason behind the request.

Useful questions:

- What decision should this output help you make?
- Who is the audience, and what should they believe or do afterward?
- Is the real goal to understand examples, extract a reusable formula, persuade someone, or make an execution plan?
- What would make this useful enough that you would actually use it?
- Which uncertainty matters most: market, customer, message, channel, operation, evidence, or risk?
- Should this optimize for depth, speed, persuasion, implementation, or auditability?

Avoid:

- generic preference forms
- questions whose answers would not change the work
- asking multiple agents' questions separately when a router can consolidate them

## Confirmation Gate

When an agent infers hidden intent and that interpretation changes the output, confirmation is required.

Use this pattern:

```text
I think the core of this request may be less about collecting examples and more about deriving a reusable success formula.

Is that correct?

If yes, I will research mechanisms, repeatable patterns, execution conditions, and risks. If not, I can keep the output closer to a case library or presentation overview.
```

Then stop and wait.

Confirmation is required when the agent is about to change:

- output structure
- evidence strategy
- audience or tone
- safety or approval boundary
- research direction
- deck/report/web narrative
- success criteria
- scope of work

## Work Contract

After the user answers, restate the agreed direction before execution.

Example:

```text
Confirmed. I will treat this as:
- objective:
- audience:
- output:
- depth:
- evidence strategy:
- checkpoints:

I will start with the research pass now.
```

Keep this short when the task is small. Use the full contract for high-intent or multi-agent work.

## Multi-Agent Chains

For chained work, `workspace-router` should consolidate questions before execution.

Example chain:

```text
workspace-router -> deep-dive-researcher -> report-writer -> ppt-builder -> qa-verifier
```

Instead of each agent interrupting separately, the router should ask the few questions that determine the chain's direction.

If a downstream agent later discovers a material direction change, it should ask a checkpoint question and stop until the user answers.

## External Actions

External actions always require explicit approval:

- real email sending
- public posting
- account changes
- payments
- deletion
- host-app automation
- file moves when the organizer requires confirmation

Drafts, plans, dry-runs, and local workspace artifacts may be created without external approval unless the user asked to pause.
