import { safeTopicName, writeText } from './files.mjs';
import { projectPath } from './project-paths.mjs';

export async function startPlanning(root, idea, options = {}) {
  const cleanIdea = String(idea || '').trim();
  if (!cleanIdea) throw new Error('planning requires an idea.');
  const project = safeTopicName(options.project || cleanIdea);
  const lenses = selectPlanningLenses(cleanIdea);
  const now = new Date().toISOString();

  const files = [
    ['planning-state.md', renderPlanningState(cleanIdea, lenses, now)],
    ['question-ledger.md', renderQuestionLedger(cleanIdea, lenses)],
    ['assumption-map.md', renderAssumptionMap(cleanIdea)],
    ['blindspot-review.md', renderBlindspotReview(cleanIdea)],
    ['research-needed.md', renderResearchNeeded(cleanIdea)],
    ['planning-brief.md', renderPlanningBrief(cleanIdea, lenses)],
    ['next-actions.md', renderNextActions(cleanIdea)]
  ];

  const written = [];
  for (const [name, body] of files) {
    const file = projectPath(root, project, 'planning', name);
    await writeText(file, body);
    written.push(file);
  }

  return {
    project,
    file: written[0],
    files: written,
    text: `Planning workspace created for \`${project}\`.\n\nHighest-leverage next question: ${highestLeverageQuestion(cleanIdea)}`
  };
}

function selectPlanningLenses(idea) {
  const text = idea.toLowerCase();
  const lenses = [];
  const add = (lens) => {
    if (!lenses.includes(lens)) lenses.push(lens);
  };

  if (/(app|service|product|tool|platform|workflow|서비스|앱|제품|툴|플랫폼|기능)/i.test(text)) add('product-strategy');
  if (/(content|newsletter|youtube|tiktok|instagram|media|essay|콘텐츠|뉴스레터|유튜브|인스타|미디어|글쓰기|채널)/i.test(text)) add('content-media');
  if (/(brand|positioning|identity|category|브랜드|포지셔닝|정체성|카테고리)/i.test(text)) add('brand-culture');
  if (/(market|launch|growth|marketing|sales|distribution|go-to-market|런칭|성장|마케팅|세일즈|유통|채널|고객획득)/i.test(text)) add('growth-marketing');
  if (/(community|membership|cohort|forum|커뮤니티|멤버십|코호트|모임)/i.test(text)) add('community');
  if (/(habit|daily|repeat|retention|behavior|습관|매일|반복|리텐션|행동|온보딩)/i.test(text)) add('behavior-design');
  if (/(psychology|motivation|identity|anxiety|desire|심리|동기|정체성|불안|욕망)/i.test(text)) add('user-psychology');
  if (/(meaning|philosophy|culture|worldview|language|철학|문화|세계관|의미|언어)/i.test(text)) add('philosophy-meaning');
  if (/(revenue|pricing|business|subscription|paid|monetize|수익|가격|비즈니스|구독|유료|판매)/i.test(text)) add('business-model');

  if (!lenses.length) {
    add('decision');
    add('user-psychology');
    add('product-strategy');
  }

  if (!lenses.includes('decision')) lenses.unshift('decision');
  return lenses.slice(0, 4);
}

function highestLeverageQuestion(idea) {
  if (/(content|콘텐츠|뉴스레터|youtube|유튜브|채널)/i.test(idea)) {
    return 'Who should return repeatedly, and what promise makes them come back?';
  }
  if (/(app|service|product|서비스|앱|제품)/i.test(idea)) {
    return 'What urgent job should the first user hire this for?';
  }
  if (/(brand|브랜드|positioning|포지셔닝)/i.test(idea)) {
    return 'What category or cultural expectation should this refuse to be trapped inside?';
  }
  return 'What decision or change should this idea help create for the user?';
}

function renderPlanningState(idea, lenses, now) {
  return `# Planning State

## Current Idea

${idea}

## Likely Real Objective

To be confirmed through conversation. The first task is to discover whether this idea is meant to become a service, content project, brand, community, business, internal tool, creative project, or exploration.

## Current Planning Moment

Idea intake and intent discovery.

## Selected Lenses

${lenses.map((lens) => `- ${lens}`).join('\n')}

## Confirmed Decisions

- None yet.

## Open Ambiguities

- Who is the first audience or user?
- What decision, behavior, or feeling should the idea create?
- What would make this worth repeating, buying, sharing, or trusting?
- What is the weakest assumption?

## Strongest Current Hypothesis

The idea needs sharper intent, first audience, and repeat-use or repeat-consumption logic before a full plan is written.

## Most Important Next Question

${highestLeverageQuestion(idea)}

## Next Action

Ask the most important next question, wait for the user's answer, then update this planning state, the question ledger, the assumption map, and the planning brief.

## Last Updated

${now}
`;
}

function renderQuestionLedger(idea, lenses) {
  const questions = [
    [highestLeverageQuestion(idea), 'This answer changes the first planning direction.', 'Ask User Now'],
    ['What would make this idea fail even if it is well-made?', 'Find the weakest assumption early.', 'Explore In Conversation'],
    ['What outside evidence would change the plan?', 'Separate planning from unsupported belief.', 'Research Needed']
  ];
  return `# Planning Question Ledger

## Idea

${idea}

## Selected Lenses

${lenses.map((lens) => `- ${lens}`).join('\n')}

| Question | Why it matters | Lane | Status | Answer or next action |
|---|---|---|---|---|
${questions.map(([question, why, lane]) => `| ${escapeTable(question)} | ${escapeTable(why)} | ${lane} | Open |  |`).join('\n')}
`;
}

function renderAssumptionMap(idea) {
  return `# Assumption Map

## Idea

${idea}

| Assumption | Why it matters | Confidence | How to test or clarify |
|---|---|---|---|
| There is a specific first audience with a real need. | Without a first audience, planning becomes generic. | Low | Ask the user, then research comparable audiences if needed. |
| The idea creates repeat value, not only first-use curiosity. | Repeat behavior often determines sustainability. | Low | Map behavior loop or editorial ritual. |
| The idea has a credible differentiation path. | Weak differentiation creates distribution and pricing problems. | Low | Compare alternatives and define what this refuses to be. |
`;
}

function renderBlindspotReview(idea) {
  return `# Blindspot Review

## Idea

${idea}

| Area | Possible blind spot | Why it matters | Next action |
|---|---|---|---|
| User/customer | The first user may be too broad. | Broad audiences produce vague products and messages. | Identify the first narrow wedge. |
| Motivation | The user may like the idea but not feel urgency. | Low urgency weakens adoption. | Clarify pain, desire, identity, or timing. |
| Repeat behavior | The plan may not explain why people return. | Retention or recurring attention needs a loop. | Design a ritual, habit, or ongoing value path. |
| Differentiation | Alternatives may already satisfy the job. | The idea must beat current behavior, not only competitors. | Map substitutes and competing habits. |
| Distribution | The first channel may be assumed, not designed. | Good ideas stall without reachable audiences. | Identify where the first audience already gathers. |
| Trust/risk | Users may need proof before trying or paying. | Trust affects conversion and retention. | Define credibility assets and proof points. |
| Operations | The hidden manual workload may be high. | Operational burden can break small teams. | Separate manual, automated, and later work. |
| Timing/culture | The idea may need a sharper "why now." | Timing makes messages feel necessary. | Connect to a current cultural, market, or behavior shift. |
`;
}

function renderResearchNeeded(idea) {
  return `# Research Needed

## Idea

${idea}

| Research question | Why it matters | Suggested agent | Priority | Status |
|---|---|---|---|---|
| What comparable products, services, content formats, or communities already serve this job? | Avoid planning in a vacuum. | quick-researcher | Medium | Open |
| What audience segment has the strongest urgency or identity fit? | Defines the first wedge. | deep-dive-researcher | Medium | Open |
| What distribution or growth pattern has worked in adjacent cases? | Helps choose practical launch moves. | deep-dive-researcher | Low | Open |
`;
}

function renderPlanningBrief(idea, lenses) {
  return `# Planning Brief

## Planning Contract

- Objective: turn the idea into a clearer plan through multi-turn conversation.
- Audience/user: unknown.
- Output needed: planning state first; formal brief later.
- Current stage: idea intake.
- Success criteria: the user understands the real objective, first audience, weakest assumptions, needed research, and next action.

## Idea

${idea}

## Selected Lenses

${lenses.map((lens) => `- ${lens}`).join('\n')}

## Problem Or Opportunity

To be clarified.

## First Audience Or Wedge

To be clarified.

## Concept / Offer / Format

To be clarified.

## Why It Might Work

- The user has enough initial interest to explore the idea.
- The selected lenses suggest multiple possible planning angles.

## Why It Might Fail

- The first audience may be too broad.
- The repeat-use or repeat-consumption loop may be unclear.
- Differentiation and distribution may be assumed rather than designed.

## Assumptions

- The idea is early enough that questions are more useful than a final plan.

## Research Needed

- See \`research-needed.md\`.

## Next Actions

- Answer the highest-leverage question in \`planning-state.md\`.
- Update the planning state after the answer.

## Downstream Handoff

- Research handoff should include this brief, question ledger, assumption map, and blindspot review.
`;
}

function renderNextActions(idea) {
  return `# Next Actions

## Idea

${idea}

## Do Next

- Answer the highest-leverage planning question.
- Name the first audience as concretely as possible.
- Identify the weakest assumption.

## Decide Next

- Is this primarily a service, content project, brand, community, business, creative project, or exploration?
- Should the next step be conversation, quick research, deep research, a report, a deck, or a web concept page?

## Research Next

- Use \`research-needed.md\` if external evidence would change the plan.

## Handoff Options

- quick-researcher: narrow benchmark or fact check.
- deep-dive-researcher: market, category, positioning, or strategy research.
- report-writer: formal planning report.
- web-builder: concept page or interactive planning artifact.
- ppt-builder: pitch or strategy deck.
- email-operator: interview, outreach, launch, or partnership email.
`;
}

function escapeTable(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}
