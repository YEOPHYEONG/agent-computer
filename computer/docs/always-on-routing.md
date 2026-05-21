# Always-On Routing

Agent Computer should stay active throughout the whole conversation.

Routing is not only a first-message or boot-time behavior. Every meaningful user work request should be checked and routed through the right installed agent or agent chain, even when it appears mid-conversation.

## Core Rule

Route every meaningful work request through Agent Computer.

Do not route every casual message. Do route any message that asks Agent Computer to create, transform, inspect, organize, send, research, verify, remember, build, or improve something.

## Routing Modes

### New Work

The user introduces a new work item.

Examples:

- `Research newsletter success cases and make a PPT.`
- `Convert this PDF into an agent-readable document.`
- `Create a new agent for Instagram growth analysis.`

Default behavior:

- route through `workspace-router`
- create a fresh project by default
- apply `computer/docs/human-in-the-loop.md`

### Continuation Work

The user asks to continue, revise, transform, or build from current conversation context.

Examples:

- `Good. Now turn this into a PPT.`
- `그럼 방금 보고서를 웹페이지로도 만들어줘.`
- `이걸 차니한테 보낼 메일로 써줘.`

Default behavior:

- route through `workspace-router`
- use active conversation context when clear
- ask what source to use if the reference is ambiguous
- do not reuse old project artifacts unless the user clearly asks or approves

### Correction

The user corrects a previous direction, assumption, audience, or scope.

Examples:

- `No, this is for internal operators, not investors.`
- `아니, 성공사례 목록이 아니라 실행 공식 중심이야.`

Default behavior:

- update the current work contract
- do not create a new project unless the correction includes a new deliverable
- reroute only the affected agent chain when a revision is requested

### Question-Only Or Conversation

The user asks for explanation, reacts, or continues conceptual discussion without requesting an artifact.

Examples:

- `좋아.`
- `What does that mean?`
- `왜 이게 중요해?`

Default behavior:

- answer in chat
- do not create a project
- do not force an agent chain

## Mixed Messages

If a message contains both casual language and a work request, route the work request.

Example:

```text
좋아. 그럼 이걸 PPT로 만들어줘.
```

`좋아` is conversational. `이걸 PPT로 만들어줘` is continuation work and should route to `ppt-builder`.

## Relationship To Human-in-the-Loop

Always-on routing answers:

```text
Does this message contain work that should route to an agent?
```

Human-in-the-loop answers:

```text
Should the routed work proceed, ask, or stop for confirmation?
```

Use both together:

```text
New user message
-> detect routing mode
-> route meaningful work
-> classify intent sensitivity
-> proceed, ask, or wait
```

## Project Isolation

Always-on routing does not override project isolation.

If the user is clearly continuing the current artifact, continue that project. If the user starts a new topic or new deliverable, create a fresh project. If a pronoun like "this", "that", "이거", or "그거" is ambiguous, ask which source or project to use and wait.
