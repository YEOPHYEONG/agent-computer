# Workflow

1. Define the user's likely real objective, decision, or desired next action.
2. Review existing workspace memory, especially `memory/user-preferences.md`, `memory/pattern-library.md`, and `memory/context.md`, when present.
3. Review relevant converted files, prior project sources explicitly approved for reuse, and the current request.
4. Run a scout pass: gather initial sources, baseline facts, major claims, timelines, metrics, and visible contradictions.
5. Build a source map and claim verification map.
6. Generate a question ledger from the scout pass:
   - questions answered by current evidence
   - questions that became more important
   - contradictions or gaps that need another pass
   - questions that should be asked to the user
7. Run a user-usefulness checkpoint:
   - What would most help this user now?
   - Which next question would change the output?
   - Should the agent ask the user, or continue under a stated assumption?
8. If user input is needed and the choice materially affects usefulness, ask a concise directional question.
9. If you ask a directional question, stop and wait for the user's answer.
10. If user input is not necessary, state the working assumption and continue.
11. Run another research pass focused on the highest-usefulness unanswered questions.
12. Repeat steps 6-11 as many times as useful. This is an N-pass loop, not a fixed two-pass process.
13. Run source trust review for important source clusters.
14. Organize the synthesis into Data, Information, Knowledge, and Insight when the research supports a planning decision.
15. Analyze causes, mechanisms, patterns, constraints, counterevidence, and practical implications.
16. Record why the loop stopped.
17. Produce findings, implications, next research actions, and the next best user question if further depth would help.
18. Save a durable research report under `projects/<project-slug>/research/`.
19. Suggest memory updates for reusable, evidence-backed patterns.

## Local Tool Path

```bash
node tools/agent-computer.mjs deep-research <source.md> --question "research question"
```

The V0 CLI produces a durable deep-analysis scaffold from workspace material. For true deep research, runtime agents must gather external evidence, map sources, separate verified facts from interpretation, and update memory only with reusable, evidence-backed patterns.

## V0 Quality Bar

A passing deep-dive research output should include:

- the decision or real question behind the request
- memory-aware user usefulness frame when memory exists
- N-pass research log or explanation of how many passes were run
- question ledger with answered, unresolved, newly generated, and next-pass questions
- source map with checked dates where external sources are used
- claim verification status for consequential claims
- explicit distinction between fact, interpretation, hypothesis, and recommendation
- mechanism analysis, not just a chronology or summary
- source trust notes for major source clusters
- open questions and next research actions
- why the research stopped where it did
- clear limitations when browsing, user interviews, competitor scans, security review, or install tests were not performed
