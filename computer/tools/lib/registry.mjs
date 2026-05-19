import { resolve } from 'node:path';
import { readText } from './files.mjs';
import { computerPath } from './workspace.mjs';

export async function readRegistry(root) {
  const text = await readText(computerPath(root, 'system/agent-registry.md'), '');
  const rows = [...text.matchAll(/^\|\s*([^|`]+?)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|$/gm)];
  return rows.map((row) => ({
    name: row[1].trim(),
    path: row[2].trim(),
    purpose: row[3].trim()
  })).filter((agent) => agent.name !== 'Agent');
}

export function routeRequest(root, request) {
  const text = request.toLowerCase();
  const chain = [];
  const add = (agent) => {
    if (!chain.includes(agent)) chain.push(agent);
  };
  const reuseRequested = /\b(continue|update|improve|revise|modify|edit|compare|existing|previous|reuse)\b|\bbased on\b|이어|이어서|계속|수정|고쳐|개선|비교|기존|(?:^|\s)(?:이전|전에|전에 만든|기반)/.test(text);
  const helpRequest = isHowToUseRequest(request);

  const explicit = [
    'workspace-router', 'agent-builder', 'document-ingestor', 'file-organizer',
    'memory-curator', 'qa-verifier', 'quick-researcher', 'deep-dive-researcher',
    'report-writer', 'ppt-builder', 'email-operator', 'friend-counselor',
    'instagram-growth-analyst'
  ].find((agent) => text.includes(agent));
  if (explicit) add(explicit);

  if (/(pdf|pptx|docx|image|convert|ingest|markdown)/.test(text)) add('document-ingestor');
  if (/(instagram|insta|인스타|인스타그램|reel|reels|릴스).*(growth|grow|analysis|analytics|audit|성장|분석|진단|감사)|(?:growth|grow|analysis|analytics|audit|성장|분석|진단).*(instagram|insta|인스타|인스타그램|reel|reels|릴스)/.test(text)) add('instagram-growth-analyst');
  if (/(quick|fast|brief|간단|빠른)/.test(text) && /(research|조사|find|look up)/.test(text)) add('quick-researcher');
  if (!chain.includes('instagram-growth-analyst') && /(deep|dive|research|조사|분석|investigate)/.test(text)) add(text.includes('quick') ? 'quick-researcher' : 'deep-dive-researcher');
  if (/(report|보고서|docx|memo|write up)/.test(text)) add('report-writer');
  if (/(ppt|deck|slides|presentation|발표|슬라이드)/.test(text)) add('ppt-builder');
  if (/(email|mail|메일|reply|follow-up|outreach|contact|연락처|주소록)/.test(text)) add('email-operator');
  if (/(에게|한테).*(보내|발송|send)|(?:보내|발송|send).*(에게|한테|email|mail|메일)/.test(text)) add('email-operator');
  if (/(organize|cleanup|clean up|folder|index|archive|files?|workspace|폴더|파일|워크스페이스|구조|인덱스|아카이브).*(정리|정돈|분류|organize|cleanup|index|archive)|(?:정리|정돈|분류).*(폴더|파일|워크스페이스|구조|인덱스|산출물)/.test(text)) add('file-organizer');
  if (/(memory|remember|기억|preference)/.test(text)) add('memory-curator');
  if (/(qa|verify|검수|check|review)/.test(text)) add('qa-verifier');
  if (/(agent|에이전트|앱).*(build|create|만들|생성)|(?:build|create|만들|생성|새로운|새).*(agent|에이전트|앱)/.test(text)) add('agent-builder');
  if (/(고민|상담|friend|counsel|reflect)/.test(text)) add('friend-counselor');

  if (chain.includes('ppt-builder') && !chain.includes('report-writer') && (chain.includes('deep-dive-researcher') || chain.includes('quick-researcher') || chain.includes('document-ingestor'))) {
    add('report-writer');
  }

  if (helpRequest && chain.length === 0) add('workspace-router');
  if (chain.length === 0) add('workspace-router');
  if (chain.length > 1 && !chain.includes('qa-verifier') && /(report|ppt|deck|research|조사|보고서|발표)/.test(text)) add('qa-verifier');
  if (chain.includes('agent-builder') && !chain.includes('qa-verifier')) add('qa-verifier');
  sortChain(chain);
  const intent = intentDecision(request, chain, helpRequest);

  return `# Routing Plan

## Request

${request}

## Agent Chain

${chain.map((agent, index) => `${index + 1}. \`${agent}\``).join('\n')}

## Intent Check

${renderIntentCheck(intent)}

## Project Decision

${projectDecision(request, reuseRequested, chain, helpRequest)}

## Expected Outputs

${expectedOutputs(chain, request, helpRequest)}

## Boundary Check

- Workspace-native path used first: yes.
- External app/account needed by default: no.
- Approval needed before external action: yes, if the task later requires host apps, external accounts, sending, publishing, deletion, payments, account changes, or actual file moves.

## Notes

- If the user explicitly named an agent, use it first.
- Add prerequisite agents when the task needs conversion, reporting, deck building, or QA.
- Agent Computer is the primary computer; host OS apps and external accounts are peripherals, not defaults.
- New requests get a fresh project by default; similar existing projects are optional context only unless the user explicitly asks to reuse them.
- Actual sending, publishing, deletion, payment, account changes, host-app automation, or file moves require explicit approval before execution.`;
}

function intentDecision(request, chain, helpRequest) {
  const text = request.toLowerCase();
  if (helpRequest) {
    return {
      sensitivity: 'low',
      surface: 'Usage/help request.',
      hiddenGoal: 'Understand how to use Agent Computer.',
      materialChange: 'no',
      questions: ['No clarification needed. Answer as Agent Computer.'],
      confirmationGate: 'no',
      stopIfAsked: 'yes'
    };
  }
  if (chain.length === 1 && chain.includes('document-ingestor')) {
    return {
      sensitivity: 'low',
      surface: 'Convert or ingest a document into agent-readable form.',
      hiddenGoal: 'Make source material usable by agents.',
      materialChange: 'no, unless the source file or output project is ambiguous',
      questions: ['No broad intent questions needed. Ask only if the source file or project target is missing.'],
      confirmationGate: 'no',
      stopIfAsked: 'yes'
    };
  }
  if (chain.includes('ppt-builder') || chain.includes('deep-dive-researcher') || chain.includes('agent-builder') || chain.includes('friend-counselor')) {
    return {
      sensitivity: 'high',
      surface: describeSurfaceRequest(chain),
      hiddenGoal: inferHiddenGoal(text, chain),
      materialChange: 'yes',
      questions: intentQuestions(text, chain),
      confirmationGate: 'yes',
      stopIfAsked: 'yes'
    };
  }
  if (chain.includes('report-writer') || chain.includes('email-operator') || chain.includes('quick-researcher') || chain.includes('file-organizer')) {
    return {
      sensitivity: 'medium',
      surface: describeSurfaceRequest(chain),
      hiddenGoal: inferHiddenGoal(text, chain),
      materialChange: 'maybe',
      questions: intentQuestions(text, chain),
      confirmationGate: 'if the agent proposes a direction that changes the output',
      stopIfAsked: 'yes'
    };
  }
  return {
    sensitivity: 'low',
    surface: describeSurfaceRequest(chain),
    hiddenGoal: 'No hidden goal detected that changes routing.',
    materialChange: 'no',
    questions: ['No clarification needed before routing.'],
    confirmationGate: 'no',
    stopIfAsked: 'yes'
  };
}

function renderIntentCheck(intent) {
  return [
    `- Intent sensitivity: ${intent.sensitivity}`,
    `- Surface request: ${intent.surface}`,
    `- Likely hidden goal: ${intent.hiddenGoal}`,
    `- Would hidden intent materially change the output: ${intent.materialChange}`,
    '- Questions needed before execution:',
    ...intent.questions.map((question) => `  - ${question}`),
    `- Confirmation gate needed: ${intent.confirmationGate}`,
    `- If a question is asked, stop and wait before execution: ${intent.stopIfAsked}`
  ].join('\n');
}

function describeSurfaceRequest(chain) {
  if (chain.includes('ppt-builder') && chain.includes('deep-dive-researcher')) return 'Research a topic deeply and turn it into a presentation.';
  if (chain.includes('ppt-builder')) return 'Create a presentation deck.';
  if (chain.includes('deep-dive-researcher')) return 'Research a topic deeply.';
  if (chain.includes('quick-researcher')) return 'Research a focused question quickly.';
  if (chain.includes('report-writer')) return 'Write a report or structured document.';
  if (chain.includes('email-operator')) return 'Draft or manage an email/contact workflow.';
  if (chain.includes('file-organizer')) return 'Organize workspace files.';
  if (chain.includes('agent-builder')) return 'Build a new executable agent app.';
  if (chain.includes('friend-counselor')) return 'Support reflective conversation.';
  return 'Route the request to an Agent Computer action.';
}

function inferHiddenGoal(text, chain) {
  if (chain.includes('ppt-builder') && /(사례|case|examples?)/.test(text) && /(공식|formula|성공|success|전략|strategy)/.test(text)) {
    return 'Possibly derive a reusable success formula, not just collect examples.';
  }
  if (chain.includes('ppt-builder')) return 'Possibly persuade, teach, decide, or create an execution plan; confirm which one matters.';
  if (chain.includes('deep-dive-researcher')) return 'Possibly support a decision or next action, not only gather information.';
  if (chain.includes('report-writer')) return 'Possibly turn rough material into decision-ready evidence and recommendations.';
  if (chain.includes('email-operator')) return 'Possibly achieve a specific relationship outcome, not only write text.';
  if (chain.includes('file-organizer')) return 'Possibly establish a durable folder preference, not only clean this once.';
  if (chain.includes('agent-builder')) return 'Possibly create a working app with tools and tests, not only instructions.';
  if (chain.includes('friend-counselor')) return 'Possibly clarify the real tension before choosing advice or next action.';
  return 'No strong hidden goal detected.';
}

function intentQuestions(text, chain) {
  if (chain.includes('ppt-builder') && chain.includes('deep-dive-researcher')) {
    if (/(사례|case|examples?)/.test(text) && /(공식|formula|성공|success)/.test(text)) {
      return [
        'Is the goal to derive a reusable success formula rather than collect cases?',
        'Who is the deck for, and what should they decide or do after seeing it?',
        'Should weak evidence trigger more research, or be marked as a limitation?'
      ];
    }
    return [
      'Who is the deck for, and what should they decide or do after seeing it?',
      'Should the output optimize for persuasion, teaching, execution, or auditability?',
      'How much source detail should stay visible on slides versus notes or appendix?'
    ];
  }
  if (chain.includes('deep-dive-researcher')) {
    return [
      'What decision or next action should this research support?',
      'Which uncertainty matters most: market, customer, message, channel, operation, evidence, or risk?'
    ];
  }
  if (chain.includes('ppt-builder')) {
    return [
      'Who is the audience, and what should they believe or do afterward?',
      'Should the deck be persuasive, educational, executive, or execution-focused?'
    ];
  }
  if (chain.includes('report-writer')) {
    return [
      'Who is the report for, and what decision should it support?',
      'Should unsupported claims be researched further or marked as gaps?'
    ];
  }
  if (chain.includes('email-operator')) {
    return [
      'What relationship and outcome should this email optimize for?',
      'Should the tone be warm, direct, formal, or casual?'
    ];
  }
  if (chain.includes('file-organizer')) {
    return [
      'Which folder policy should be durable: project-first, function-based, output-type-based, date-based, or hybrid?'
    ];
  }
  if (chain.includes('agent-builder')) {
    return [
      'What job should this agent actually perform, and what tools or tests are required?',
      'What actions are in scope, and what safety boundaries should it enforce?'
    ];
  }
  if (chain.includes('friend-counselor')) {
    return [
      'Do you want reflection, practical next steps, or help naming the real tension first?'
    ];
  }
  return ['No pre-execution question needed.'];
}

function sortChain(chain) {
  const order = [
    'workspace-router',
    'document-ingestor',
    'quick-researcher',
    'deep-dive-researcher',
    'instagram-growth-analyst',
    'report-writer',
    'ppt-builder',
    'email-operator',
    'file-organizer',
    'memory-curator',
    'agent-builder',
    'friend-counselor',
    'qa-verifier'
  ];
  chain.sort((a, b) => {
    const ai = order.includes(a) ? order.indexOf(a) : order.length;
    const bi = order.includes(b) ? order.indexOf(b) : order.length;
    return ai - bi;
  });
}

function projectDecision(request, reuseRequested, chain, helpRequest = false) {
  if (helpRequest && chain.length === 1 && chain.includes('workspace-router')) {
    return [
      '- New request or continuation: usage/help request.',
      '- Existing related project found: not applicable.',
      '- Default action: explain Agent Computer usage from `START_HERE.md`, `README.md`, `AGENTS.md`, and `computer/docs/workspace-structure.md`.',
      '- New project slug: not applicable for usage help.',
      '- Existing project reuse allowed: not applicable.',
      '- Reuse approval needed: no.'
    ].join('\n');
  }
  if (isContactOnlyRequest(request) && chain.length === 1 && chain.includes('email-operator')) {
    return [
      '- New request or continuation: workspace memory update.',
      '- Existing related project found: not applicable.',
      '- Default action: update the Agent Computer private contact book only.',
      '- New project slug: not applicable for contact storage.',
      '- Existing project reuse allowed: not applicable.',
      '- Reuse approval needed: no; external contact apps are still not used without explicit request and approval.'
    ].join('\n');
  }
  if (chain.length === 1 && chain.includes('file-organizer')) {
    return [
      '- New request or continuation: workspace maintenance request.',
      '- Existing related project found: not applicable unless specific loose files belong to a project.',
      '- Default action: run dry-run first, preserve `computer/`, and organize project outputs according to `computer/system/organization-policy.md`.',
      '- New project slug: not applicable for workspace-wide organization.',
      '- Existing project reuse allowed: not applicable.',
      '- Reuse approval needed: no; actual file moves still need explicit approval or `--yes`.'
    ].join('\n');
  }
  const slug = slugifyProject(request);
  if (reuseRequested) {
    return [
      '- New request or continuation: possible continuation/update request.',
      '- Existing related project found: inspect `workspace/projects/` only enough to identify candidates.',
      '- Default action: ask for or confirm the exact existing project before reading, merging, or overwriting prior artifacts.',
      `- New project slug if reuse is not confirmed: \`workspace/projects/${slug}/\`.`,
      '- Existing project reuse allowed: only after explicit user confirmation.',
      '- Reuse approval needed: yes, unless the request names the exact existing project or artifact.'
    ].join('\n');
  }
  return [
    '- New request or continuation: new request by default.',
    '- Existing related project found: mention as optional context only if discovered.',
    '- Default action: create a fresh project and keep prior project artifacts out of the evidence/source chain.',
    `- New project slug: \`workspace/projects/${slug}/\` unless a clearer slug is chosen from the source title.`,
    '- Existing project reuse allowed: no.',
    '- Reuse approval needed: yes.'
  ].join('\n');
}

function slugifyProject(request) {
  const ascii = request
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  const clipped = ascii.split('-').filter(Boolean).slice(0, 8).join('-');
  return clipped || 'new-project';
}

function isContactOnlyRequest(request) {
  const text = request.toLowerCase();
  return /(contact|연락처|주소록).*(save|add|store|저장|추가)|(?:save|add|store|저장|추가).*(contact|연락처|주소록)|@[a-z0-9.-]+\.[a-z]{2,}.*(연락처|주소록|저장|추가)/.test(text)
    && !/(?:^|[^a-z])(?:send|email|mail|reply|draft|outreach)(?:[^a-z]|$)|메일|보내|발송|초안/.test(text);
}

function isHowToUseRequest(request) {
  const text = request.toLowerCase().trim();
  return /^(how do i use(?: this| this workspace| this repo| this repository| agent computer)?|how to use(?: this| this workspace| this repo| this repository| agent computer)?|how do i get started|how should i start|what is this|what can you do|help|usage|start|getting started)\??$/.test(text)
    || /(어떻게\s*써|어떻게\s*사용|사용법|뭐부터\s*하면|뭘\s*할\s*수|무엇을\s*할\s*수|처음.*시작|시작.*방법|도움말)/.test(text);
}

function expectedOutputs(chain, request = '', helpRequest = false) {
  if (helpRequest && chain.length === 1 && chain.includes('workspace-router')) {
    return [
      '- Chat answer explaining how to use Agent Computer.',
      '- Reference `START_HERE.md`, `README.md`, `AGENTS.md`, and `computer/docs/workspace-structure.md`.',
      '- No project folder is needed unless the user asks to save the guidance.'
    ].join('\n');
  }
  const outputs = [];
  if (chain.includes('document-ingestor')) {
    outputs.push('- `workspace/projects/<project-slug>/converted/source.agent.md`');
    outputs.push('- `workspace/projects/<project-slug>/converted/conversion-log.md`');
    outputs.push('- `workspace/projects/<project-slug>/converted/visual-review.md` when pages/slides are rendered');
  }
  if (chain.includes('quick-researcher')) outputs.push('- `workspace/projects/<project-slug>/research/<topic>_quick-research.md`');
  if (chain.includes('deep-dive-researcher')) outputs.push('- `workspace/projects/<project-slug>/research/<topic>_deep-research.md`');
  if (chain.includes('instagram-growth-analyst')) {
    outputs.push('- `workspace/projects/<project-slug>/reports/instagram-growth-analysis-YYYY-MM-DD.md`');
    outputs.push('- optional experiment log from `computer/agents/work/instagram-growth-analyst/templates/experiment-log-template.md`');
  }
  if (chain.includes('report-writer')) outputs.push('- `workspace/projects/<project-slug>/reports/<topic>_report.md`');
  if (chain.includes('ppt-builder')) {
    outputs.push('- `workspace/projects/<project-slug>/presentations/<topic>_ppt-content-spec.md`');
    outputs.push('- `workspace/projects/<project-slug>/presentations/<topic>_ppt-design-spec.md`');
    outputs.push('- `workspace/projects/<project-slug>/presentations/<topic>_ppt-build-plan.md`');
    outputs.push('- prototype source under `workspace/projects/<project-slug>/presentations/prototype/`');
    outputs.push('- rendered previews/contact sheets under `workspace/projects/<project-slug>/presentations/preview/`');
    outputs.push('- deck-specific assets/layout work under `workspace/projects/<project-slug>/presentations/assets/` and `workspace/projects/<project-slug>/presentations/layout/` when needed');
    outputs.push('- approved premium PPTX reconstruction: `workspace/projects/<project-slug>/presentations/<topic>.pptx` with editable PPT elements');
    outputs.push('- `workspace/projects/<project-slug>/qa/<topic>_ppt-qa.md`');
  }
  if (chain.includes('email-operator')) {
    if (isContactOnlyRequest(request)) {
      outputs.push('- `computer/memory/private/email-contacts.json` for explicitly saved contacts');
    } else {
      outputs.push('- `workspace/projects/<project-slug>/reports/<topic>_email-package.md` for drafts and sequences');
      outputs.push('- `computer/memory/private/email-contacts.json` for explicitly saved contacts');
    }
  }
  if (chain.includes('agent-builder')) {
    outputs.push('- executable agent app under `computer/agents/<category>/<agent-name>/`');
    outputs.push('- build brief and tool/test notes under `workspace/projects/<agent-name>/tasks/`');
    outputs.push('- agent QA notes under `workspace/projects/<agent-name>/qa/`');
  }
  if (chain.includes('qa-verifier')) outputs.push('- `workspace/projects/<project-slug>/qa/<topic>_qa.md`');
  if (chain.includes('file-organizer')) {
    outputs.push('- dry-run plan at `computer/system/last-dry-run.md` when not explicitly approved');
    outputs.push('- `computer/system/workspace-index.md`, move logs, and move manifests only when actual organization is approved');
  }
  if (chain.includes('friend-counselor')) {
    outputs.push('- supportive response in chat, and only if useful: `workspace/projects/personal-reflections/reports/<topic>_reflection.md`');
  }
  return outputs.length ? outputs.join('\n') : '- A routed next action';
}
