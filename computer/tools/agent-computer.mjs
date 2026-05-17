#!/usr/bin/env node
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ensureDir, readText, writeText } from './lib/files.mjs';
import { resolveWorkspacePath, userPath, workspaceRoot } from './lib/workspace.mjs';
import { routeRequest } from './lib/registry.mjs';
import { buildWorkspaceIndex } from './lib/files.mjs';
import { organizeWorkspace, undoLastOrganize } from './lib/organization.mjs';
import { ingestFile } from './lib/ingest.mjs';
import { curateMemory } from './lib/memory.mjs';
import { verifyFile } from './lib/qa.mjs';
import { buildAgent } from './lib/agent-builder.mjs';
import { formatContactAddResult, formatContactList, getEmailContact, listEmailContacts, saveEmailContactFromText, upsertEmailContact } from './lib/contacts.mjs';
import { quickResearch, deepResearch, writeReport, writeEmailPackage, writeReflection } from './lib/research.mjs';
import { buildPremiumDeckFromFile, planPremiumDeckFromFile } from './lib/deck.mjs';

const root = workspaceRoot();
const [command, ...args] = process.argv.slice(2);

function help() {
  return `Agent Computer

Usage:
  node computer/tools/agent-computer.mjs route "<request>"
  node computer/tools/agent-computer.mjs index
  node computer/tools/agent-computer.mjs organize [--dry-run] [--policy hybrid|project-based|function-based|output-type-based|date-based] [--yes]
  node computer/tools/agent-computer.mjs undo-last-organize
  node computer/tools/agent-computer.mjs ingest <file>
  node computer/tools/agent-computer.mjs curate-memory <file>
  node computer/tools/agent-computer.mjs qa <file>
  node computer/tools/agent-computer.mjs build-agent <name> [--category work|system|personal] [--with-tools]
  node computer/tools/agent-computer.mjs quick-research <file> [--question "..."]
  node computer/tools/agent-computer.mjs deep-research <file> [--question "..."]
  node computer/tools/agent-computer.mjs report <file> [--audience "..."]
  node computer/tools/agent-computer.mjs ppt <file> [--title "..."] [--max-slides 18] [--plan-only]
  node computer/tools/agent-computer.mjs email-contact add --alias "..." --email "..." [--name "..."] [--replace]
  node computer/tools/agent-computer.mjs email-contact save "person@example.com을 차니라는 연락처로 저장해줘"
  node computer/tools/agent-computer.mjs email-contact list
  node computer/tools/agent-computer.mjs email-contact get --alias "..."
  node computer/tools/agent-computer.mjs email --purpose "..." [--recipient "..."] [--tone "..."]
  node computer/tools/agent-computer.mjs counsel --text "..."
  node computer/tools/agent-computer.mjs demo

Local-first rule: commands write inside this workspace only.`;
}

function option(name, fallback = '') {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function has(name) {
  return args.includes(name);
}

function firstValue() {
  return args.find((arg) => !arg.startsWith('--'));
}

function printResult(result) {
  if (typeof result === 'string') {
    console.log(result);
    return;
  }
  if (result?.text) console.log(result.text);
  if (result?.file) console.log(`File: ${result.file}`);
  if (result?.agentFile) console.log(`Agent Markdown: ${result.agentFile}`);
  if (result?.logFile) console.log(`Log: ${result.logFile}`);
  if (result?.pptx) console.log(`PPTX: ${result.pptx}`);
  if (result?.specs?.length) {
    console.log('Specs:');
    for (const spec of result.specs) console.log(`- ${spec}`);
  }
  if (result?.files?.length) {
    console.log('Files:');
    for (const file of result.files) console.log(`- ${file}`);
  }
}

async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(help());
    return;
  }

  if (command === 'route') {
    const request = args.join(' ').trim();
    if (!request) throw new Error('route requires a user request.');
    console.log(routeRequest(root, request));
    return;
  }

  if (command === 'index') {
    const out = await buildWorkspaceIndex(root);
    console.log(`Wrote ${out}`);
    return;
  }

  if (command === 'organize') {
    const result = await organizeWorkspace(root, {
      dryRun: has('--dry-run'),
      yes: has('--yes'),
      policy: option('--policy', '')
    });
    console.log(result);
    return;
  }

  if (command === 'undo-last-organize') {
    console.log(await undoLastOrganize(root));
    return;
  }

  if (command === 'ingest') {
    const file = firstValue();
    if (!file) throw new Error('ingest requires a file path.');
    const result = await ingestFile(root, resolveWorkspacePath(root, file));
    console.log(`Wrote ${result.agentFile}`);
    console.log(`Log ${result.logFile}`);
    return;
  }

  if (command === 'curate-memory') {
    const file = firstValue();
    if (!file) throw new Error('curate-memory requires a file path.');
    printResult(await curateMemory(root, resolveWorkspacePath(root, file)));
    return;
  }

  if (command === 'qa') {
    const file = firstValue();
    if (!file) throw new Error('qa requires a file path.');
    printResult(await verifyFile(root, resolveWorkspacePath(root, file), { request: option('--request', '') }));
    return;
  }

  if (command === 'build-agent') {
    const name = firstValue();
    if (!name) throw new Error('build-agent requires an agent name.');
    console.log(await buildAgent(root, name, {
      category: option('--category', 'work'),
      withTools: has('--with-tools')
    }));
    return;
  }

  if (command === 'quick-research') {
    const file = firstValue();
    if (!file) throw new Error('quick-research requires a file path.');
    printResult(await quickResearch(root, resolveWorkspacePath(root, file), { question: option('--question', '') }));
    return;
  }

  if (command === 'deep-research') {
    const file = firstValue();
    if (!file) throw new Error('deep-research requires a file path.');
    printResult(await deepResearch(root, resolveWorkspacePath(root, file), { question: option('--question', '') }));
    return;
  }

  if (command === 'report') {
    const file = firstValue();
    if (!file) throw new Error('report requires a file path.');
    printResult(await writeReport(root, resolveWorkspacePath(root, file), { audience: option('--audience', 'general reader') }));
    return;
  }

  if (command === 'ppt') {
    const file = firstValue();
    if (!file) throw new Error('ppt requires a file path.');
    const deckOptions = { title: option('--title', ''), maxSlides: option('--max-slides', '') };
    if (has('--plan-only')) {
      printResult(await planPremiumDeckFromFile(root, resolveWorkspacePath(root, file), deckOptions));
      return;
    }
    const result = await buildPremiumDeckFromFile(root, resolveWorkspacePath(root, file), deckOptions);
    const qa = await verifyFile(root, result.pptx, { request: 'Verify ppt-builder editable PPTX output.' });
    result.files.push(qa.file);
    printResult(result);
    return;
  }

  if (command === 'email') {
    const purpose = option('--purpose', '');
    if (!purpose) throw new Error('email requires --purpose.');
    printResult(await writeEmailPackage(root, {
      purpose,
      recipient: option('--recipient', 'Recipient'),
      tone: option('--tone', 'clear and professional')
    }));
    return;
  }

  if (command === 'email-contact' || command === 'contacts') {
    const action = firstValue();
    if (action === 'add') {
      const alias = option('--alias', '');
      const email = option('--email', '');
      if (!alias && !email) {
        printResult({
          text: formatContactAddResult(await saveEmailContactFromText(root, args.slice(1).join(' '), { replace: has('--replace') }))
        });
        return;
      }
      printResult({
        text: formatContactAddResult(await upsertEmailContact(root, {
          alias,
          email,
          displayName: option('--name', ''),
          note: option('--note', ''),
          replace: has('--replace')
        }))
      });
      return;
    }
    if (action === 'list') {
      printResult({ text: formatContactList(await listEmailContacts(root)) });
      return;
    }
    if (action === 'get') {
      printResult({ text: formatContactList(await getEmailContact(root, option('--alias', ''))) });
      return;
    }
    if (action === 'save' || action === '저장') {
      printResult({
        text: formatContactAddResult(await saveEmailContactFromText(root, args.slice(1).join(' '), { replace: has('--replace') }))
      });
      return;
    }
    if (args.join(' ').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)) {
      printResult({
        text: formatContactAddResult(await saveEmailContactFromText(root, args.join(' '), { replace: has('--replace') }))
      });
      return;
    }
    throw new Error('email-contact requires add, save, list, or get.');
  }

  if (command === 'counsel') {
    const text = option('--text', args.join(' '));
    if (!text) throw new Error('counsel requires --text.');
    printResult(await writeReflection(root, text));
    return;
  }

  if (command === 'demo') {
    await runDemo();
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${help()}`);
}

async function runDemo() {
  const inputDir = userPath(root, 'inbox/demo-input');
  await ensureDir(inputDir);
  const sample = resolve(inputDir, 'sample.md');
  await writeText(sample, `# Sample Source

Agent Computer is a file-based workspace where agents act like apps. The strongest demo flow is source material to converted Markdown, quick research, report, deck, QA, and workspace organization.

## Key Points

- Agents should be executable apps, not prompt files.
- Important source content should be preserved unless summarization is requested.
- File Organizer should use dry-run before bulk moves and keep reversible move manifests.
- Document Ingestor should create agent-readable Markdown with conversion logs.
`);

  const ingest = await ingestFile(root, sample);
  const quick = await quickResearch(root, ingest.agentFile, { question: 'What is Agent Computer and why does it matter?' });
  const report = await writeReport(root, quick.file, { audience: 'open-source users' });
  const deck = await buildPremiumDeckFromFile(root, report.file, { title: 'Agent Computer Demo' });
  const deckQa = await verifyFile(root, deck.pptx, { request: 'Verify demo editable PPTX output.' });
  const qa = await verifyFile(root, report.file, { request: 'Create a report from the demo research.' });
  const index = await buildWorkspaceIndex(root);

  console.log(`# Demo complete

- Ingested: ${ingest.agentFile}
- Quick research: ${quick.file}
- Report: ${report.file}
- PPTX: ${deck.pptx}
- PPT workflow files: ${deck.files.join(', ')}
- PPTX QA: ${deckQa.file}
- QA: ${qa.file}
- Index: ${index}

Open ${pathToFileURL(resolve(root)).href} to inspect the generated files.`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
