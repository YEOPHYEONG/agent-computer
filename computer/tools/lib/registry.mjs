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
  const reuseRequested = /\b(continue|update|improve|revise|modify|edit|compare|existing|previous|reuse)\b|\bbased on\b|이어|이어서|계속|수정|고쳐|개선|비교|기존|이전|전에|전에 만든|기반/.test(text);
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

  return `# Routing Plan

## Request

${request}

## Agent Chain

${chain.map((agent, index) => `${index + 1}. \`${agent}\``).join('\n')}

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
