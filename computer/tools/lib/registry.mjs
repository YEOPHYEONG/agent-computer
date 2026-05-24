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
  const reuseRequested = /\b(continue|update|improve|revise|modify|edit|existing|previous|reuse)\b|\bbased on\b|이어|이어서|계속|수정|고쳐|개선|기존|(?:^|\s)(?:이전|전에|전에 만든|기반)|(?:compare|비교).*(?:\bexisting\b|\bprevious\b|기존|(?:^|\s)이전)|(?:\bexisting\b|\bprevious\b|기존|(?:^|\s)이전).*(?:compare|비교)/.test(text);
  const helpRequest = isHowToUseRequest(request);
  const wantsAgentBuild = /(agent|에이전트|agent\s*app|에이전트\s*앱).*(build|create|만들|생성)|(?:build|create|만들|생성|새로운|새).*(agent|에이전트|agent\s*app|에이전트\s*앱)/.test(text);
  const wantsWebArtifact = /(web\s*page|webpage|website|landing\s*page|html|interactive\s*web|web\s*report|웹페이지|웹\s*페이지|웹사이트|랜딩\s*페이지|인터랙티브\s*웹|html로|웹으로)/.test(text);
  const transformsExistingReportToWeb = wantsWebArtifact && /\b(this|current|existing|previous)\s+(report|memo|document)\b|(?:이|그|위|방금|기존|이전|해당)\s*(?:보고서|리포트|문서)/.test(text);
  const wantsPlanning = !wantsAgentBuild && /(idea|concept|planning|plan|planner|brainstorm|service concept|content concept|business idea|campaign|community idea|아이디어|기획|구상|플래닝|사업화|서비스\s*(?:만들|기획|구상)|콘텐츠\s*(?:만들|기획|구상)|브랜드\s*(?:기획|구상)|캠페인\s*(?:기획|구상)|커뮤니티\s*(?:기획|구상)|같이\s*생각|같이\s*기획)/.test(text);

  const explicit = [
    'workspace-router', 'agent-builder', 'document-ingestor', 'file-organizer',
    'memory-curator', 'qa-verifier', 'quick-researcher', 'deep-dive-researcher',
    'report-writer', 'web-builder', 'ppt-builder', 'email-operator', 'friend-counselor',
    'planning-partner',
    'instagram-growth-analyst'
  ].find((agent) => text.includes(agent));
  if (explicit) add(explicit);

  if (/(pdf|pptx|docx|image|convert|ingest|markdown)/.test(text)) add('document-ingestor');
  if (wantsPlanning) add('planning-partner');
  if (!wantsAgentBuild && /(instagram|insta|인스타|인스타그램|reel|reels|릴스).*(growth|grow|analysis|analytics|audit|성장|분석|진단|감사)|(?:growth|grow|analysis|analytics|audit|성장|분석|진단).*(instagram|insta|인스타|인스타그램|reel|reels|릴스)/.test(text)) add('instagram-growth-analyst');
  if (!wantsAgentBuild && /(quick|fast|brief|간단|빠른)/.test(text) && /(research|조사|find|look up)/.test(text)) add('quick-researcher');
  if (!wantsAgentBuild && !chain.includes('instagram-growth-analyst') && /(deep|dive|research|리서치|조사|분석|비교|탐색|investigate)/.test(text)) add(text.includes('quick') ? 'quick-researcher' : 'deep-dive-researcher');
  if (/(report|보고서|docx|memo|write up)/.test(text) && !transformsExistingReportToWeb) add('report-writer');
  if (wantsWebArtifact) add('web-builder');
  if (/(ppt|deck|slides|presentation|발표|슬라이드)/.test(text)) add('ppt-builder');
  if (/(email|mail|메일|reply|follow-up|outreach|contact|연락처|주소록)/.test(text)) add('email-operator');
  if (/(에게|한테).*(보내|발송|send)|(?:보내|발송|send).*(에게|한테|email|mail|메일)/.test(text)) add('email-operator');
  if (/(organize|cleanup|clean up|folder|index|archive|files?|workspace|폴더|파일|워크스페이스|구조|인덱스|아카이브).*(정리|정돈|분류|organize|cleanup|index|archive)|(?:정리|정돈|분류).*(폴더|파일|워크스페이스|구조|인덱스|산출물)/.test(text)) add('file-organizer');
  if (/(memory|remember|기억|preference)/.test(text)) add('memory-curator');
  if (/(qa|verify|검수|check|review)/.test(text)) add('qa-verifier');
  if (wantsAgentBuild) add('agent-builder');
  if (/(고민|상담|friend|counsel|reflect)/.test(text)) add('friend-counselor');

  if (chain.includes('ppt-builder') && !chain.includes('report-writer') && (chain.includes('deep-dive-researcher') || chain.includes('quick-researcher') || chain.includes('document-ingestor'))) {
    add('report-writer');
  }
  if (chain.includes('web-builder') && !chain.includes('report-writer') && (chain.includes('deep-dive-researcher') || chain.includes('quick-researcher') || chain.includes('document-ingestor'))) {
    add('report-writer');
  }

  if (helpRequest && chain.length === 0) add('workspace-router');
  if (chain.length === 0) add('workspace-router');
  if (!chain.includes('qa-verifier') && (
    chain.includes('report-writer')
    || chain.includes('web-builder')
    || chain.includes('ppt-builder')
    || chain.includes('deep-dive-researcher')
    || chain.includes('quick-researcher')
    || chain.includes('planning-partner')
  )) add('qa-verifier');
  if (chain.includes('agent-builder') && !chain.includes('qa-verifier')) add('qa-verifier');
  sortChain(chain);
  const routing = routingDecision(request, chain, helpRequest, reuseRequested);
  const intent = intentDecision(request, chain, helpRequest);
  const researchMode = researchModeDecision(request, chain);
  const researchArchitecture = researchArchitectureDecision(request, chain);
  const researchRuntime = researchRuntimeDecision(request, chain, researchMode, researchArchitecture);
  const executionGate = executionGateDecision(request, chain, intent, routing, researchMode, researchArchitecture);
  const checkpoints = chainCheckpoints(chain, intent, routing, request);

  return `# Routing Plan

## Request

${request}

## Agent Chain

${chain.map((agent, index) => `${index + 1}. \`${agent}\``).join('\n')}

## Routing Mode

${renderRoutingMode(routing)}

## Intent Check

${renderIntentCheck(intent)}

## Execution Gate

${renderExecutionGate(executionGate)}

## Research Mode

${renderResearchMode(researchMode)}

## Research Architecture

${renderResearchArchitecture(researchArchitecture)}

## Runtime Subagent Execution

${renderResearchRuntime(researchRuntime)}

## Chain Checkpoints

${renderChainCheckpoints(checkpoints)}

## Project Decision

${projectDecision(request, reuseRequested, chain, helpRequest, routing)}

## Expected Outputs

${expectedOutputs(chain, request, helpRequest, routing)}

## Boundary Check

- Workspace-native path used first: yes.
- External app/account needed by default: no.
- Approval needed before external action: yes, if the task later requires host apps, external accounts, sending, publishing, deletion, payments, account changes, or actual file moves.

## Notes

- If the user explicitly named an agent, use it first.
- Add prerequisite agents when the task needs conversion, reporting, deck building, or QA.
- Agent Computer is the primary computer; host OS apps and external accounts are peripherals, not defaults.
- Always-on routing applies to meaningful work requests even mid-conversation.
- Multi-agent chains should include handoff artifacts, quality gates, and final QA criteria.
- New requests get a fresh project by default; similar existing projects are optional context only unless the user explicitly asks to reuse them.
- Actual sending, publishing, deletion, payment, account changes, host-app automation, or file moves require explicit approval before execution.`;
}

function routingDecision(request, chain, helpRequest, reuseRequested) {
  const text = request.toLowerCase().trim();
  const correction = isCorrectionRequest(text);
  const contextRef = hasContextReference(text);
  const continuationMarker = hasContinuationMarker(text) || reuseRequested;
  const meaningfulWork = hasMeaningfulWorkRequest(text, chain, helpRequest);
  const activeContextRequired = correction || (meaningfulWork && (contextRef || continuationMarker));
  const activeContextClear = activeContextRequired
    ? 'unknown in static routing; use current thread context, and ask if the source/project is ambiguous'
    : 'not required';

  if (helpRequest || (!meaningfulWork && !correction)) {
    return {
      mode: 'question-only',
      meaningfulWork,
      activeContextRequired: 'no',
      activeContextClear: 'not applicable',
      priorProjectReuseAllowed: 'not applicable',
      ambiguousContextAction: 'no project or agent chain needed unless the user asks to save work'
    };
  }

  if (correction && !meaningfulWork) {
    return {
      mode: 'correction',
      meaningfulWork: false,
      activeContextRequired: 'yes',
      activeContextClear,
      priorProjectReuseAllowed: 'current work contract only; do not create a new project unless the user asks for a revision artifact',
      ambiguousContextAction: 'ask which assumption, artifact, or project should be corrected, then wait'
    };
  }

  if (correction) {
    return {
      mode: 'correction',
      meaningfulWork: true,
      activeContextRequired: 'yes',
      activeContextClear,
      priorProjectReuseAllowed: 'only the active work being corrected; ask before reading unrelated prior projects',
      ambiguousContextAction: 'ask which artifact or project should be revised if unclear, then wait'
    };
  }

  if (activeContextRequired) {
    return {
      mode: 'continuation work',
      meaningfulWork: true,
      activeContextRequired: 'yes',
      activeContextClear,
      priorProjectReuseAllowed: 'only when the user clearly continues the active thread/project; otherwise ask',
      ambiguousContextAction: 'ask which source, artifact, or project to use, then wait'
    };
  }

  return {
    mode: 'new work',
    meaningfulWork: true,
    activeContextRequired: 'no',
    activeContextClear: 'not required',
    priorProjectReuseAllowed: 'no; create a fresh project unless the user explicitly asks to reuse prior work',
    ambiguousContextAction: 'not applicable'
  };
}

function renderRoutingMode(routing) {
  return [
    `- Mode: ${routing.mode}`,
    `- Meaningful work request detected: ${routing.meaningfulWork ? 'yes' : 'no'}`,
    `- Active context required: ${routing.activeContextRequired}`,
    `- Active context clear: ${routing.activeContextClear}`,
    `- Prior project reuse allowed: ${routing.priorProjectReuseAllowed}`,
    `- If context is ambiguous, ask and wait: ${routing.ambiguousContextAction}`
  ].join('\n');
}

function hasMeaningfulWorkRequest(text, chain, helpRequest) {
  if (helpRequest) return false;
  if (chain.some((agent) => agent !== 'workspace-router')) return true;
  return /(create|make|build|write|draft|turn|convert|inspect|organize|send|research|verify|remember|improve|revise|summarize|analyze|read|check|qa|report|ppt|deck|slides|email|agent|webpage|website|markdown|docx|pdf|만들|작성|초안|바꿔|변환|읽|정리|보내|발송|리서치|조사|검수|기억|개선|수정|요약|분석|비교|탐색|보고서|발표|웹페이지|문서)/.test(text);
}

function hasContextReference(text) {
  return /\b(this|that|it|above|previous|current|same|those|these)\b|이거|이걸|그거|그걸|그것|방금|위에|앞에서|앞서|그 자료|그 결과|그 내용|방금.*것|이 내용|그 내용/.test(text);
}

function hasContinuationMarker(text) {
  return /^(좋아|좋다|오케이|그래|응|ㅇㅋ|okay|ok|good|great|then|now)\b|그럼|그러면|이어서|계속|바탕으로|기반으로|based on|from that|turn this|now make|now turn/.test(text);
}

function isCorrectionRequest(text) {
  if (/질문하지\s*말고|묻지\s*말고|안\s*물어보고|without asking|do not ask|don't ask/i.test(text)) return false;
  return /^(아니|아냐|그건 아니|no,|not\b)|아니라|대신|정정|수정하면|틀렸|wrong|correction|revise the assumption|(?:^|\s)말고(?:\s|$)/.test(text);
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
  if (chain.includes('ppt-builder') || chain.includes('deep-dive-researcher') || chain.includes('agent-builder') || chain.includes('friend-counselor') || chain.includes('planning-partner')) {
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

function executionGateDecision(request, chain, intent, routing, researchMode, researchArchitecture) {
  if (routing.mode === 'question-only') {
    return {
      state: 'PROCEED_CHAT_ONLY',
      reason: 'The request is usage help or conversation, not a durable work artifact.',
      allowedBeforeAnswer: ['answer in chat'],
      blockedBeforeAnswer: [],
      askNow: 'No intent question needed.'
    };
  }

  const explicitAssumptionPermission = hasExplicitAssumptionPermission(request);
  const highIntent = intent.sensitivity === 'high';
  const materialChain = chain.some((agent) => ['deep-dive-researcher', 'ppt-builder', 'agent-builder', 'friend-counselor', 'planning-partner'].includes(agent));
  if (highIntent && !explicitAssumptionPermission) {
    return {
      state: 'STOP_BEFORE_EXECUTION',
      reason: 'High intent-sensitivity work can produce materially different outputs depending on audience, objective, evidence standard, narrative, or success criteria.',
      allowedBeforeAnswer: [
        'read routing and agent instructions',
        'draft a chain contract',
        'create preflight-only notes if needed'
      ],
      blockedBeforeAnswer: [
        'final research report',
        'strategy recommendation',
        'PPT/deck',
        'web page',
        'email/send package',
        'agent implementation'
      ],
      askNow: primaryIntentGateQuestion(intent, researchMode, researchArchitecture, chain)
    };
  }

  if (highIntent && explicitAssumptionPermission) {
    return {
      state: 'PROCEED_WITH_EXPLICIT_ASSUMPTIONS',
      reason: 'The user explicitly allowed reasonable assumptions or asked not to stop for clarification.',
      allowedBeforeAnswer: ['execute under named assumptions', 'record assumptions in the project artifacts'],
      blockedBeforeAnswer: ['unapproved external actions'],
      askNow: 'No blocking question; state the assumptions before executing.'
    };
  }

  if (intent.sensitivity === 'medium' || materialChain) {
    return {
      state: 'ASK_IF_MATERIAL',
      reason: 'Proceed only when missing context would not materially change the artifact.',
      allowedBeforeAnswer: ['execute low-risk parts', 'state assumptions'],
      blockedBeforeAnswer: ['direction changes based on unconfirmed hidden intent'],
      askNow: intent.questions[0] || 'Ask only if the answer changes the output.'
    };
  }

  return {
    state: 'PROCEED',
    reason: 'Low intent-sensitivity or sufficiently bounded request.',
    allowedBeforeAnswer: ['execute inside workspace'],
    blockedBeforeAnswer: ['unapproved external actions'],
    askNow: 'No blocking question needed.'
  };
}

function renderExecutionGate(gate) {
  return [
    `- Gate state: ${gate.state}`,
    `- Why: ${gate.reason}`,
    '- Allowed before user answer:',
    ...gate.allowedBeforeAnswer.map((item) => `  - ${item}`),
    '- Blocked before user answer:',
    ...(gate.blockedBeforeAnswer.length ? gate.blockedBeforeAnswer : ['none']).map((item) => `  - ${item}`),
    `- Ask now: ${gate.askNow}`,
    '- Rule: if the gate state is STOP_BEFORE_EXECUTION, ask the question and wait. Do not continue into final deliverables in the same turn.'
  ].join('\n');
}

function hasExplicitAssumptionPermission(request) {
  return /(assume and proceed|proceed under assumptions|use reasonable assumptions|no need to ask|do not ask|don't ask|without asking|가정하고\s*진행|합리적.*가정|적절히.*가정|질문하지\s*말고|묻지\s*말고|안\s*물어보고|알아서\s*가정)/i.test(request);
}

function primaryIntentGateQuestion(intent, researchMode, researchArchitecture, chain) {
  if (chain.includes('deep-dive-researcher') && (chain.includes('ppt-builder') || /presentation|deck|slides|ppt/i.test(intent.surface))) {
    return `I think this may be about ${intent.hiddenGoal} Confirm the audience and what the output should help them decide before I research and build the deck.`;
  }
  if (chain.includes('deep-dive-researcher')) {
    const architecture = researchArchitecture?.architecture && researchArchitecture.architecture !== 'not applicable'
      ? ` I would start with ${researchArchitecture.architecture}.`
      : '';
    const mode = researchMode?.mode && researchMode.mode !== 'not applicable'
      ? ` Research mode would be ${researchMode.mode}.`
      : '';
    return `${intent.questions[0] || 'What decision or next action should this research support?'}${architecture}${mode} Is that direction correct?`;
  }
  if (chain.includes('ppt-builder')) return intent.questions[0] || 'Who is the audience, and what should they believe or do afterward?';
  if (chain.includes('agent-builder')) return intent.questions[0] || 'What job should this agent perform, and what tools or tests are required?';
  if (chain.includes('planning-partner')) return intent.questions[0] || 'What decision should this planning conversation help you make first?';
  if (chain.includes('friend-counselor')) return intent.questions[0] || 'Do you want reflection, practical next steps, or help naming the real tension first?';
  return intent.questions[0] || 'What outcome should this work optimize for?';
}

function researchModeDecision(request, chain) {
  if (!chain.includes('deep-dive-researcher')) {
    return {
      applicable: false,
      mode: 'not applicable',
      reason: 'No deep-dive research agent selected.',
      artifacts: []
    };
  }
  const text = request.toLowerCase();
  const numberSignals = [...text.matchAll(/\b(\d{2,})\b/g)].map((match) => Number(match[1])).filter((value) => value >= 10);
  const broadCoverage = numberSignals.length > 0 || /(many|list|compare|comparison|table|matrix|dataset|profiles?|examples?|cases?|여러|목록|비교|표|데이터셋|사례|케이스|도구|회사|브랜드)/i.test(text);
  const synthesis = /(formula|framework|pattern|principle|strategy|recommend|positioning|공식|프레임|패턴|전략|추천|포지셔닝|시사점|성공\s*공식)/i.test(text);
  const judgment = /(which|decide|judge|tradeoff|vs\.?|versus|conflict|contradiction|뭐가|어떤|판단|결정|상충|모순|트레이드오프)/i.test(text);
  if (broadCoverage && synthesis) {
    return {
      applicable: true,
      mode: 'Hybrid',
      reason: 'Broad case/item coverage appears necessary before deriving a formula, pattern, strategy, or recommendation.',
      artifacts: ['research-contract.md', 'architecture-decision.md', 'runtime-subagent-plan.md', 'subagent-orchestration.md', 'subagent-results/', 'worker-packets/', 'source-map.md', 'evidence-store.md', 'hypothesis-map.md', 'red-team-critique.md', 'synthesis-plan.md', 'research-quality-control-plan.md', 'claim-verification-map.md', 'question-ledger.md']
    };
  }
  if (broadCoverage && !judgment) {
    return {
      applicable: true,
      mode: 'Wide',
      reason: 'The request appears to involve many independent items that should share one rubric/schema.',
      artifacts: ['research-contract.md', 'architecture-decision.md', 'runtime-subagent-plan.md', 'subagent-orchestration.md', 'subagent-results/', 'worker-packets/', 'source-map.md', 'evidence-store.md', 'hypothesis-map.md', 'red-team-critique.md', 'synthesis-plan.md', 'research-quality-control-plan.md', 'claim-verification-map.md', 'question-ledger.md']
    };
  }
  return {
    applicable: true,
    mode: 'Deep',
    reason: judgment
      ? 'The request appears to require judgment, tradeoff analysis, or conflict resolution around one main question.'
      : 'The request appears to center on one main question where evidence depth and mechanism analysis matter more than item coverage.',
    artifacts: ['research-contract.md', 'architecture-decision.md', 'runtime-subagent-plan.md', 'subagent-orchestration.md', 'subagent-results/', 'worker-packets/', 'source-map.md', 'evidence-store.md', 'hypothesis-map.md', 'red-team-critique.md', 'synthesis-plan.md', 'research-quality-control-plan.md', 'claim-verification-map.md', 'question-ledger.md']
  };
}

function renderResearchMode(researchMode) {
  if (!researchMode.applicable) {
    return '- Not applicable: no deep-dive research route selected.';
  }
  return [
    `- Selected research mode: ${researchMode.mode}`,
    `- Why: ${researchMode.reason}`,
    `- Required research artifacts: ${researchMode.artifacts.map((item) => `\`${item}\``).join(', ')}`,
    '- Confirmation rule: ask and wait before changing the research mode or research contract if the change would alter the output.'
  ].join('\n');
}

function researchArchitectureDecision(request, chain) {
  if (!chain.includes('deep-dive-researcher')) {
    return {
      applicable: false,
      architecture: 'not applicable',
      reason: 'No deep-dive research agent selected.',
      confirmation: 'not applicable'
    };
  }

  const text = request.toLowerCase();
  const pick = (architecture, reason) => ({
    applicable: true,
    architecture,
    reason,
    confirmation: 'Ask and wait if this architecture would change audience, scope, evidence strategy, narrative, output artifact, or recommendation.'
  });

  if (/(cases?|examples?|benchmarks?|compare|comparison|matrix|formula|framework|pattern|success formula|사례|성공사례|벤치마크|비교|공식|프레임워크|패턴)/i.test(text)) {
    return pick('Wide Benchmark To Deep Synthesis', 'The request appears to need broad cases or examples before deriving a formula, pattern, or recommendation.');
  }
  if (/(how .*grew|growth journey|growth history|milestones?|viral|community|brand growth|newsletter growth|creator growth|성장\s*과정|성장\s*여정|전환점|마일스톤|바이럴|커뮤니티|브랜드\s*성장)/i.test(text)) {
    return pick('Growth Case Reconstruction', 'The request appears to ask how an entity grew across milestones and mechanisms.');
  }
  if (/(product|gtm|go[-\s]?to[-\s]?market|launch|pricing|channel|positioning|business model|retention|onboarding|monetization|sales|activation|제품|시장\s*전략|출시|가격|채널|포지셔닝|비즈니스\s*모델|리텐션|온보딩|수익|세일즈|활성화)/i.test(text)) {
    return pick('Product / GTM Strategy Research', 'The request appears to affect product, launch, positioning, channel, monetization, retention, or business-model decisions.');
  }
  if (/(market|competitor|competitive|landscape|category|alternatives?|whitespace|segment|tam|sam|시장|경쟁|경쟁사|카테고리|대안|화이트스페이스|세그먼트)/i.test(text)) {
    return pick('Market / Competitive Landscape', 'The request appears to map a category, market, competitors, alternatives, or whitespace.');
  }
  if (/(api|sdk|implementation|implement|integrat|debug|configure|architecture|official docs?|install|error|code|technical|기술|구현|연동|통합|설치|디버그|공식\s*문서|아키텍처)/i.test(text)) {
    return pick('Technical / Implementation Research', 'The request appears to depend on exact technical implementation, docs, environment, or verification.');
  }
  if (/(pdf|pptx|deck|slides?|paper|report|transcript|document|source file|based on this|based on the source|자료|문서|보고서|논문|덱|원본|첨부|파일)/i.test(text)) {
    return pick('Source-Heavy Evidence Review', 'The request appears to depend on preserving and interpreting a provided source.');
  }
  return pick('Strategic Decision Research', 'The request appears to need judgment, options, criteria, tradeoffs, or a recommendation.');
}

function renderResearchArchitecture(researchArchitecture) {
  if (!researchArchitecture.applicable) {
    return '- Not applicable: no deep-dive research route selected.';
  }
  return [
    `- Selected research architecture: ${researchArchitecture.architecture}`,
    `- Why: ${researchArchitecture.reason}`,
    '- Required artifact: `architecture-decision.md`',
    `- Confirmation rule: ${researchArchitecture.confirmation}`
  ].join('\n');
}

function researchRuntimeDecision(request, chain, researchMode, researchArchitecture) {
  if (!chain.includes('deep-dive-researcher')) {
    return {
      applicable: false,
      mode: 'not applicable',
      reason: 'No deep-dive research agent selected.',
      explicitNativeRequest: false,
      roles: []
    };
  }
  const explicitNativeRequest = hasExplicitSubagentRequest(request);
  const broadOrHighValue = ['Wide', 'Hybrid'].includes(researchMode.mode)
    || /(deep|comprehensive|thorough|strategy|decision|benchmark|성공\s*공식|전략|의사결정|깊게|철저|벤치마크)/i.test(request);
  const roles = rolesForRoutedArchitecture(researchArchitecture.architecture, researchMode.mode);
  return {
    applicable: true,
    mode: explicitNativeRequest ? 'native-if-available' : broadOrHighValue ? 'worker-packets-with-native-proposal' : 'worker-packets',
    reason: explicitNativeRequest
      ? 'The user explicitly asked for subagents, delegation, or parallel agent work.'
      : broadOrHighValue
        ? 'The request is broad or high-value, so specialist worker packets should be created and the agent may propose native subagents.'
        : 'The request can run through the deep-dive researcher with specialist worker packets as needed.',
    explicitNativeRequest,
    roles
  };
}

function renderResearchRuntime(runtime) {
  if (!runtime.applicable) return '- Not applicable: no deep-dive research route selected.';
  return [
    `- Execution policy: ${runtime.mode}`,
    `- Why: ${runtime.reason}`,
    `- Explicit native-subagent permission: ${runtime.explicitNativeRequest ? 'yes' : 'no'}`,
    `- Specialist roles to prepare: ${runtime.roles.map((role) => `\`ac-${role}\``).join(', ')}`,
    '- Required artifact: `runtime-subagent-plan.md` plus `subagent-orchestration.md`, `subagent-results/`, and `worker-packets/ac-*.md`.',
    '- Native result path: `workspace/projects/<project-slug>/research/subagent-results/ac-*.md` when native subagents actually run.',
    '- Preflight roles: `ac-intent-analyst`, `ac-research-architect`.',
    '- Codex rule: native subagents may be spawned only when the user explicitly asks for subagents, delegation, or parallel agent work.',
    '- Claude Code rule: `.claude/agents/ac-*.md` files may be materialized only after explicit user approval.'
  ].join('\n');
}

function hasExplicitSubagentRequest(request) {
  return /(subagents?|sub-agents?|parallel agents?|parallel work|delegate|delegation|spawn|서브\s*에이전트|서브에이전트|병렬|위임|나눠서|여러\s*에이전트)/i.test(request);
}

function rolesForRoutedArchitecture(architecture, mode) {
  const map = {
    'Strategic Decision Research': ['intent-analyst', 'research-architect', 'source-scout', 'evidence-verifier', 'mechanism-analyst', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
    'Product / GTM Strategy Research': ['intent-analyst', 'research-architect', 'source-scout', 'market-mapper', 'gtm-strategist', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
    'Growth Case Reconstruction': ['intent-analyst', 'research-architect', 'source-scout', 'case-benchmark-worker', 'mechanism-analyst', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
    'Market / Competitive Landscape': ['intent-analyst', 'research-architect', 'source-scout', 'market-mapper', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
    'Technical / Implementation Research': ['intent-analyst', 'research-architect', 'technical-docs-reader', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
    'Source-Heavy Evidence Review': ['intent-analyst', 'research-architect', 'source-scout', 'evidence-verifier', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer'],
    'Wide Benchmark To Deep Synthesis': ['intent-analyst', 'research-architect', 'source-scout', 'case-benchmark-worker', 'evidence-verifier', 'mechanism-analyst', 'red-team-critic', 'synthesis-architect', 'research-quality-controller', 'report-composer']
  };
  const base = map[architecture] || map['Strategic Decision Research'];
  if (mode === 'Wide' || mode === 'Hybrid') return withRoleBeforeQualityGate(base, 'case-benchmark-worker');
  return base;
}

function withRoleBeforeQualityGate(base, roleKey) {
  if (base.includes(roleKey)) return base;
  const gateIndex = base.findIndex((key) => key === 'research-quality-controller' || key === 'report-composer');
  if (gateIndex === -1) return [...base, roleKey];
  return [...base.slice(0, gateIndex), roleKey, ...base.slice(gateIndex)];
}

function chainCheckpoints(chain, intent, routing, request) {
  if (routing.mode === 'question-only') {
    return {
      type: 'not applicable: question-only route',
      preflight: 'not applicable',
      confirmation: 'no',
      handoffs: ['not applicable'],
      directionChange: 'not applicable',
      qualityGates: ['not applicable'],
      finalQa: 'not required'
    };
  }
  const materialAgents = chain.filter((agent) => agent !== 'workspace-router' && agent !== 'qa-verifier');
  const hasFinalQa = chain.includes('qa-verifier');
  if (materialAgents.length <= 1 && !hasFinalQa) {
    return {
      type: 'single-agent route',
      preflight: 'not required unless the selected agent needs missing source/context',
      confirmation: intent.confirmationGate === 'yes' ? 'yes, if the agent asks an outcome-changing question' : 'no by default',
      handoffs: ['not applicable'],
      directionChange: 'handled inside the selected agent if evidence or context changes the work',
      qualityGates: ['selected agent self-checks only'],
      finalQa: 'not required unless requested'
    };
  }
  if (materialAgents.length <= 1 && hasFinalQa) {
    return {
      type: 'single-agent route with QA',
      preflight: preflightCheckpoint(chain, intent, routing, request),
      confirmation: confirmationRequirement(intent, routing),
      handoffs: handoffMap(chain),
      directionChange: 'ask and wait if the selected agent discovers a material direction change',
      qualityGates: [`${materialAgents[0] || 'selected agent'} self-check before qa-verifier`],
      finalQa: finalQaCriteria(chain)
    };
  }
  return {
    type: classifyChainType(chain),
    preflight: preflightCheckpoint(chain, intent, routing, request),
    confirmation: confirmationRequirement(intent, routing),
    handoffs: handoffMap(chain),
    directionChange: directionChangeCheckpoint(chain),
    qualityGates: qualityGates(chain),
    finalQa: finalQaCriteria(chain)
  };
}

function renderChainCheckpoints(checkpoints) {
  return [
    `- Chain type: ${checkpoints.type}`,
    `- Pre-flight checkpoint: ${checkpoints.preflight}`,
    `- User confirmation required before execution: ${checkpoints.confirmation}`,
    '- Handoff checkpoints:',
    ...checkpoints.handoffs.map((handoff) => `  - ${handoff}`),
    `- Direction-change checkpoint: ${checkpoints.directionChange}`,
    '- Internal QA gates:',
    ...checkpoints.qualityGates.map((gate) => `  - ${gate}`),
    `- Final QA: ${checkpoints.finalQa}`
  ].join('\n');
}

function classifyChainType(chain) {
  if (chain.includes('planning-partner') && chain.includes('deep-dive-researcher')) return 'planning-to-deep-research';
  if (chain.includes('planning-partner') && chain.includes('report-writer')) return 'planning-to-report';
  if (chain.includes('planning-partner') && chain.includes('web-builder')) return 'planning-to-web';
  if (chain.includes('planning-partner') && chain.includes('ppt-builder')) return 'planning-to-presentation';
  if (chain.includes('document-ingestor') && chain.includes('report-writer') && chain.includes('ppt-builder')) return 'document-to-report-to-presentation';
  if (chain.includes('deep-dive-researcher') && chain.includes('report-writer') && chain.includes('ppt-builder')) return 'deep-research-to-report-to-presentation';
  if (chain.includes('deep-dive-researcher') && chain.includes('report-writer') && chain.includes('web-builder')) return 'deep-research-to-report-to-web';
  if ((chain.includes('deep-dive-researcher') || chain.includes('quick-researcher')) && chain.includes('email-operator')) return 'research-to-email';
  if (chain.includes('agent-builder')) return 'agent-build-and-verify';
  if ((chain.includes('deep-dive-researcher') || chain.includes('quick-researcher')) && chain.includes('report-writer')) return 'research-to-report';
  if (chain.includes('report-writer') && chain.includes('web-builder')) return 'report-to-web';
  if (chain.includes('report-writer') && chain.includes('ppt-builder')) return 'report-to-presentation';
  return 'multi-agent workflow';
}

function preflightCheckpoint(chain, intent, routing, request) {
  if (routing.mode === 'question-only') return 'not applicable';
  if (chain.includes('document-ingestor') && chain.includes('report-writer') && chain.includes('ppt-builder')) {
    return 'Confirm audience/use case only if it materially changes the report or deck; otherwise ingest first and use the source as primary evidence.';
  }
  if (chain.includes('ppt-builder') && (chain.includes('deep-dive-researcher') || chain.includes('quick-researcher'))) {
    return `Consolidate before execution: ${intent.questions.join(' / ')}`;
  }
  if (chain.includes('web-builder') && (chain.includes('deep-dive-researcher') || chain.includes('quick-researcher'))) {
    return `Consolidate before execution: ${intent.questions.join(' / ')}`;
  }
  if ((chain.includes('deep-dive-researcher') || chain.includes('quick-researcher')) && chain.includes('email-operator')) {
    return 'Confirm target customer, relationship, desired action, and claim-safety standard before research-driven drafting.';
  }
  if (chain.includes('agent-builder')) {
    return 'Confirm job-to-be-done, required tools, inputs/outputs, safety boundaries, and smoke tests before building.';
  }
  if (chain.includes('planning-partner')) {
    return `Start with a planning state and ask only the outcome-changing question: ${intent.questions[0] || 'What decision should this planning conversation help you make first?'}`;
  }
  if (intent.sensitivity === 'high' || intent.sensitivity === 'medium') {
    return `Use the Intent Check questions before execution: ${intent.questions.join(' / ')}`;
  }
  return 'No broad pre-flight question needed; proceed with stated assumptions unless source/context is missing.';
}

function confirmationRequirement(intent, routing) {
  if (routing.mode === 'question-only') return 'no';
  if (intent.confirmationGate === 'yes') return 'yes; ask and stop before execution if the answer changes scope, audience, evidence strategy, or narrative';
  if (intent.confirmationGate.startsWith('if')) return intent.confirmationGate;
  return 'no by default; still ask and wait if a checkpoint question would change the outcome';
}

function handoffMap(chain) {
  const handoffs = [];
  const add = (from, to, description) => {
    if (chain.includes(from) && chain.includes(to)) handoffs.push(`${from} -> ${to}: ${description}`);
  };
  add('document-ingestor', 'report-writer', '`converted/source.agent.md`, `visual-review.md` when available, `conversion-log.md`, and extraction limitations');
  add('planning-partner', 'quick-researcher', 'planning brief, research-needed list, assumptions, and the narrow fact check to run');
  add('planning-partner', 'deep-dive-researcher', 'planning brief, real objective, selected lenses, assumptions, blind spots, and research-needed list');
  add('planning-partner', 'report-writer', 'planning brief, question ledger, assumption map, blindspot review, and must-preserve decisions');
  add('planning-partner', 'web-builder', 'planning brief, audience, page purpose, concept narrative, caveats, and source boundaries');
  add('planning-partner', 'ppt-builder', 'planning brief, core narrative, audience, decisions, assumptions, and must-preserve caveats');
  if (chain.includes('document-ingestor') && chain.includes('ppt-builder') && !chain.includes('report-writer')) {
    handoffs.push('document-ingestor -> ppt-builder: converted source, visual review, conversion log, and source-fidelity limits');
  }
  add('quick-researcher', 'report-writer', 'quick brief, source links, agreement/disagreement notes, uncertainty, and deep-dive recommendation');
  add('deep-dive-researcher', 'report-writer', 'research contract, selected research mode, research report, evidence store, source map, claim verification map, question ledger, unresolved evidence gaps, and recommended stance');
  add('quick-researcher', 'email-operator', 'source-backed facts, unsupported claims to avoid, target notes, and recommended message angle');
  add('deep-dive-researcher', 'email-operator', 'research evidence, target/customer insight, supported claims, risky claims, and recommended message angle');
  add('report-writer', 'web-builder', 'report, evidence map, source links, target audience, page purpose, must-preserve claims, and caveats');
  add('deep-dive-researcher', 'web-builder', 'only through an approved research/report handoff; web-builder should not replace the MI-grade Markdown research report');
  add('report-writer', 'ppt-builder', 'report, evidence map, core narrative, audience/use case, must-preserve content, and visible caveats');
  add('web-builder', 'qa-verifier', 'HTML/CSS/JS files, README, assets, screenshots or preview notes, responsive checks, accessibility notes, console status, and limitations');
  add('ppt-builder', 'qa-verifier', 'PPTX, content spec, design spec, build plan, prototype/preview paths, PPT QA, and render limitations');
  add('report-writer', 'qa-verifier', 'report, evidence map, assumptions, unresolved gaps, and source/reference notes');
  add('agent-builder', 'qa-verifier', 'agent folder, tools, templates, tests, examples, registry/doc updates, and smoke-test result or instructions');
  add('email-operator', 'qa-verifier', 'draft package, recipient resolution, assumptions, claim risks, send checklist, and connector/send status');
  if (handoffs.length === 0 && chain.includes('qa-verifier')) {
    const prior = chain.find((agent) => agent !== 'qa-verifier' && agent !== 'workspace-router') || 'selected agent';
    handoffs.push(`${prior} -> qa-verifier: final artifact, assumptions, limitations, and validation notes`);
  }
  return handoffs.length ? handoffs : ['not applicable'];
}

function directionChangeCheckpoint(chain) {
  if (chain.includes('deep-dive-researcher') || chain.includes('quick-researcher')) {
    return 'ask and wait if evidence changes the core mechanism, target audience, recommendation, or message angle';
  }
  if (chain.includes('report-writer') && chain.includes('ppt-builder')) {
    return 'ask and wait if the deck narrative must materially diverge from the report narrative';
  }
  if (chain.includes('report-writer') && chain.includes('web-builder')) {
    return 'ask and wait if the web page narrative must materially diverge from the research/report narrative';
  }
  if (chain.includes('document-ingestor')) {
    return 'ask and wait if extraction/rendering limitations make the requested downstream report or deck unreliable';
  }
  if (chain.includes('agent-builder')) {
    return 'ask and wait if the requested agent needs broader permissions, external accounts, or tools beyond the agreed scope';
  }
  if (chain.includes('planning-partner')) {
    return 'ask and wait if a planning hypothesis changes the audience, purpose, business model, product shape, content format, or launch direction';
  }
  return 'ask and wait whenever a downstream agent would change the agreed chain contract';
}

function qualityGates(chain) {
  const gates = [];
  if (chain.includes('document-ingestor')) gates.push('converted source and visual-review limitations are clear before downstream writing');
  if (chain.includes('planning-partner')) gates.push('planning state, question ledger, assumption map, blindspot review, and next actions are updated before downstream work');
  if (chain.includes('deep-dive-researcher')) gates.push('research contract, research mode, source policy, evidence store, claim map, and question ledger are complete before downstream claims');
  if (chain.includes('quick-researcher')) gates.push('research evidence and uncertainty are strong enough for downstream claims');
  if (chain.includes('report-writer')) gates.push('report has a clear narrative, evidence map, caveats, and must-preserve content before downstream deck/email work');
  if (chain.includes('web-builder')) gates.push('web-builder receives an approved report/research handoff before implementing HTML; web copy preserves caveats and source boundaries');
  if (chain.includes('ppt-builder')) gates.push('content spec, design spec, build plan, prototype/preview, and editable PPTX checks run before final QA');
  if (chain.includes('email-operator')) gates.push('draft package includes recipient resolution, assumptions, unsupported-claim warnings, and send checklist');
  if (chain.includes('agent-builder')) gates.push('new agent includes docs, workflow, tools/scaffolds when needed, examples, tests, and registry updates');
  if (chain.includes('qa-verifier')) gates.push('qa-verifier checks the original request and chain contract, not only file format');
  return gates.length ? gates : ['selected agent self-check'];
}

function finalQaCriteria(chain) {
  if (!chain.includes('qa-verifier')) return 'not required unless requested or the workflow becomes high-impact';
  const criteria = ['original request satisfaction', 'chain contract satisfaction', 'handoff completeness'];
  if (chain.includes('document-ingestor')) criteria.push('source fidelity and extraction/render limitations');
  if (chain.includes('planning-partner')) criteria.push('planning state, real objective, selected lenses, assumptions, blind spots, research-needed list, next actions, and handoff quality');
  if (chain.includes('deep-dive-researcher')) criteria.push('research contract, source policy, evidence store, question ledger, claim verification, evidence gaps, and uncertainty');
  if (chain.includes('quick-researcher')) criteria.push('evidence gaps and uncertainty');
  if (chain.includes('report-writer')) criteria.push('report structure, supported claims, and caveats');
  if (chain.includes('web-builder')) criteria.push('static HTML structure, responsive behavior, accessibility, source/caveat visibility, and no unsupported claim inflation');
  if (chain.includes('ppt-builder')) criteria.push('editable PPTX, no full-slide screenshot fallback, text/visual QA, and render limitations');
  if (chain.includes('email-operator')) criteria.push('claim safety, tone, next action, connector status, and no accidental send');
  if (chain.includes('agent-builder')) criteria.push('agent app completeness, executable capability, tests, and registry/docs updates');
  return criteria.join('; ');
}

function describeSurfaceRequest(chain) {
  if (chain.includes('ppt-builder') && chain.includes('deep-dive-researcher')) return 'Research a topic deeply and turn it into a presentation.';
  if (chain.includes('web-builder') && chain.includes('deep-dive-researcher')) return 'Research a topic deeply and turn it into a web page.';
  if (chain.includes('ppt-builder')) return 'Create a presentation deck.';
  if (chain.includes('web-builder')) return 'Create a local static web page.';
  if (chain.includes('planning-partner')) return 'Develop an idea through multi-turn planning.';
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
  if (chain.includes('web-builder') && chain.includes('deep-dive-researcher')) return 'Possibly create both a deep MI-grade research report and a separate web artifact; keep research depth separate from web presentation.';
  if (chain.includes('web-builder')) return 'Possibly explain, persuade, or guide action through a local static page; confirm audience and page purpose.';
  if (chain.includes('planning-partner')) return 'Possibly clarify the real objective, first audience, weakest assumptions, and next decision behind the idea.';
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
  if (chain.includes('web-builder') && chain.includes('deep-dive-researcher')) {
    return [
      'Who is the web page for, and what should the reader do after opening it?',
      'The default is an MI-grade Markdown report first, with the web page as a separate distilled interface. Is there any reason to deviate from that?',
      'Which claims must remain visible with evidence and caveats on the page?'
    ];
  }
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
  if (chain.includes('planning-partner')) {
    return [
      'What decision should this planning conversation help you make first?',
      'Who do you most want this idea to serve or affect?',
      'Should I challenge the idea hard now, or first help you develop the promising version?'
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
    'planning-partner',
    'quick-researcher',
    'deep-dive-researcher',
    'instagram-growth-analyst',
    'report-writer',
    'web-builder',
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

function projectDecision(request, reuseRequested, chain, helpRequest = false, routing = null) {
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
  if (routing?.mode === 'question-only') {
    return [
      '- New request or continuation: question-only or conversation.',
      '- Existing related project found: not applicable.',
      '- Default action: answer in chat without creating files or projects.',
      '- New project slug: not applicable.',
      '- Existing project reuse allowed: not applicable.',
      '- Reuse approval needed: no.'
    ].join('\n');
  }
  if (routing?.mode === 'correction' && !routing.meaningfulWork) {
    return [
      '- New request or continuation: correction to active context.',
      '- Existing related project found: use only the active work contract if clear.',
      '- Default action: update the current assumption, audience, goal, or scope; ask before revising files.',
      '- New project slug: not applicable unless the user asks for a new revision artifact.',
      '- Existing project reuse allowed: only the active artifact/project being corrected.',
      '- Reuse approval needed: yes if the affected artifact/project is unclear.'
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
  if (routing?.mode === 'continuation work') {
    return [
      '- New request or continuation: continuation work.',
      '- Existing related project found: use the active conversation project only if the reference is clear.',
      '- Default action: continue, transform, or extend the active artifact; ask if the source/project is ambiguous.',
      '- New project slug: use only if the user is actually starting a new topic or no active context is available.',
      '- Existing project reuse allowed: only for the active thread/project the user is continuing.',
      '- Reuse approval needed: yes if the reference could point to multiple prior artifacts or projects.'
    ].join('\n');
  }
  if (routing?.mode === 'correction') {
    return [
      '- New request or continuation: correction plus work request.',
      '- Existing related project found: use the active artifact/project being corrected when clear.',
      '- Default action: revise the work contract, then route the requested revision.',
      '- New project slug: only if the correction becomes a new work item.',
      '- Existing project reuse allowed: only the active artifact/project being corrected.',
      '- Reuse approval needed: yes if the affected artifact/project is unclear.'
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

function expectedOutputs(chain, request = '', helpRequest = false, routing = null) {
  if (helpRequest && chain.length === 1 && chain.includes('workspace-router')) {
    return [
      '- Chat answer explaining how to use Agent Computer.',
      '- Reference `START_HERE.md`, `README.md`, `AGENTS.md`, and `computer/docs/workspace-structure.md`.',
      '- No project folder is needed unless the user asks to save the guidance.'
    ].join('\n');
  }
  if (routing?.mode === 'question-only') {
    return [
      '- Chat answer only.',
      '- No project folder or durable output unless the user asks to save it.'
    ].join('\n');
  }
  if (routing?.mode === 'correction' && !routing.meaningfulWork) {
    return [
      '- Updated work contract or clarification in chat.',
      '- No file edits unless the user asks to revise an existing artifact.'
    ].join('\n');
  }
  const outputs = [];
  if (chain.includes('document-ingestor')) {
    outputs.push('- `workspace/projects/<project-slug>/converted/source.agent.md`');
    outputs.push('- `workspace/projects/<project-slug>/converted/conversion-log.md`');
    outputs.push('- `workspace/projects/<project-slug>/converted/visual-review.md` when pages/slides are rendered');
  }
  if (chain.includes('planning-partner')) {
    outputs.push('- `workspace/projects/<project-slug>/planning/planning-state.md`');
    outputs.push('- `workspace/projects/<project-slug>/planning/question-ledger.md`');
    outputs.push('- `workspace/projects/<project-slug>/planning/assumption-map.md`');
    outputs.push('- `workspace/projects/<project-slug>/planning/blindspot-review.md`');
    outputs.push('- `workspace/projects/<project-slug>/planning/research-needed.md`');
    outputs.push('- `workspace/projects/<project-slug>/planning/planning-brief.md`');
    outputs.push('- `workspace/projects/<project-slug>/planning/next-actions.md`');
  }
  if (chain.includes('quick-researcher')) outputs.push('- `workspace/projects/<project-slug>/research/<topic>_quick-research.md`');
  if (chain.includes('deep-dive-researcher')) {
    outputs.push('- `workspace/projects/<project-slug>/research/research-contract.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/architecture-decision.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/source-map.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/evidence-store.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/question-ledger.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/claim-verification-map.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/hypothesis-map.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/red-team-critique.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/synthesis-plan.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/research-quality-control-plan.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/runtime-subagent-plan.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/subagent-orchestration.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/subagent-results/README.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/subagent-results/_template.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/subagent-results/ac-*.md` when native subagents actually run');
    outputs.push('- `workspace/projects/<project-slug>/research/worker-packets/ac-*.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/retry-log.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/<topic>_deep-research.md`');
    outputs.push('- `workspace/projects/<project-slug>/research/<topic>_research-qa.md`');
  }
  if (chain.includes('instagram-growth-analyst')) {
    outputs.push('- `workspace/projects/<project-slug>/reports/instagram-growth-analysis-YYYY-MM-DD.md`');
    outputs.push('- optional experiment log from `computer/agents/work/instagram-growth-analyst/templates/experiment-log-template.md`');
  }
  if (chain.includes('report-writer')) outputs.push('- `workspace/projects/<project-slug>/reports/<topic>_report.md`');
  if (chain.includes('web-builder')) {
    outputs.push('- `workspace/projects/<project-slug>/web/<topic>/index.html`');
    outputs.push('- `workspace/projects/<project-slug>/web/<topic>/styles.css`');
    outputs.push('- `workspace/projects/<project-slug>/web/<topic>/app.js` when interaction is useful');
    outputs.push('- `workspace/projects/<project-slug>/web/<topic>/README.md`');
    outputs.push('- `workspace/projects/<project-slug>/web/<topic>/assets/`');
    outputs.push('- `workspace/projects/<project-slug>/qa/<topic>_web-qa-manifest.md` with `fast`, `standard`, or `premium` QA scope');
    outputs.push('- `workspace/projects/<project-slug>/qa/<topic>_web-qa.md`');
  }
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
