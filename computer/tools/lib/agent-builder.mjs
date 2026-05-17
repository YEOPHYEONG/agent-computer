import { resolve } from 'node:path';
import { ensureDir, exists, readText, writeText } from './files.mjs';
import { computerPath } from './workspace.mjs';

export async function buildAgent(root, name, options = {}) {
  const safeName = name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  const category = ['system', 'work', 'personal'].includes(options.category) ? options.category : 'work';
  const dir = computerPath(root, 'agents', category, safeName);
  if (exists(dir)) throw new Error(`Agent already exists: ${dir}`);
  await ensureDir(dir);

  const files = {
    'README.md': `# ${title(safeName)}\n\nThis agent app was created by agent-builder. Define its exact job, inputs, outputs, executable tools, and QA path before publishing it as a default agent.\n`,
    'agent.md': `# ${title(safeName)}\n\n## Role\n\nYou are the ${safeName} agent.\n\n## Best For\n\n- Requests that match this agent's defined job.\n\n## Principles\n\n- Use workspace files and executable tools when they are relevant.\n- Preserve important source content unless the user asks for summarization.\n- Separate facts, assumptions, and recommendations.\n\n## Boundaries\n\n- Do not perform external actions without user approval.\n- Do not claim a tool ran unless it actually ran.\n`,
    'workflow.md': `# Workflow\n\n1. Understand the request.\n2. Inspect relevant workspace files.\n3. Use tools or templates as needed.\n4. Create durable outputs.\n5. Run self-check or QA.\n`,
    'output-template.md': `# Output\n\n## Summary\n\n\n## Details\n\n\n## Files\n\n\n## Next Actions\n\n\n`
  };

  for (const [file, content] of Object.entries(files)) {
    await writeText(resolve(dir, file), content);
  }

  if (options.withTools) {
    await writeText(resolve(dir, 'tools/README.md'), `# ${safeName} Tools\n\nStore executable tools for this agent here. Keep them local-first, documented, and smoke-testable.\n`);
    await writeText(resolve(dir, 'tests/README.md'), `# ${safeName} Tests\n\nStore smoke tests and QA checks for this agent here.\n`);
    await writeText(resolve(dir, 'examples/README.md'), `# ${safeName} Examples\n\nStore public-safe examples for this agent here.\n`);
  }

  await updateRegistry(root, safeName, category, dir);
  return `# Agent Built

- Agent: \`${safeName}\`
- Category: \`${category}\`
- Path: \`${dir}\`
- Tools scaffolded: ${options.withTools ? 'yes' : 'no'}

Smoke test: ask the workspace-router to route a task to \`${safeName}\`.`;
}

async function updateRegistry(root, name, category) {
  const path = computerPath(root, 'system/agent-registry.md');
  const text = await readText(path, '');
  const section = category === 'system' ? '## System Agents' : category === 'personal' ? '## Personal Agents' : '## Work Agents';
  if (text.includes(`| ${name} |`)) return;
  const row = `| ${name} | \`computer/agents/${category}/${name}\` | Newly built agent app; see its README and workflow. |`;
  const lines = text.split('\n');
  const index = lines.findIndex((line) => line.trim() === section);
  if (index === -1) {
    await writeText(path, `${text.trim()}\n\n${section}\n\n| Agent | Path | Purpose |\n|---|---|---|\n${row}\n`);
    return;
  }
  let insert = index + 1;
  while (insert < lines.length && lines[insert].trim() !== '' && !lines[insert].startsWith('## ')) insert++;
  lines.splice(insert, 0, row);
  await writeText(path, lines.join('\n'));
}

function title(name) {
  return name.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}
