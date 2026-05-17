export function heading(title, level = 1) {
  return `${'#'.repeat(level)} ${title}`;
}

export function mdEscape(text) {
  return String(text ?? '').replace(/\r\n/g, '\n');
}

export function stripMarkdown(text) {
  return mdEscape(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractHeadings(text) {
  return [...mdEscape(text).matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
    level: match[1].length,
    title: match[2].trim()
  }));
}

export function splitSentences(text) {
  return stripMarkdown(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function section(title, body = '') {
  return `## ${title}\n\n${body.trim()}\n`;
}

export function bulletList(items) {
  return items.filter(Boolean).map((item) => `- ${item}`).join('\n');
}
