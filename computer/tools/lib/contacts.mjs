import { resolve } from 'node:path';
import { readText, writeText } from './files.mjs';
import { computerPath } from './workspace.mjs';

const CONTACT_BOOK_REL = 'memory/private/email-contacts.json';
const CONTACT_BOOK_DISPLAY = 'computer/memory/private/email-contacts.json';
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function contactBookPath(root) {
  return computerPath(root, CONTACT_BOOK_REL);
}

export async function loadEmailContacts(root) {
  const file = contactBookPath(root);
  const text = await readText(file, '');
  if (!text.trim()) return emptyBook();
  const parsed = JSON.parse(text);
  return {
    version: parsed.version || 1,
    updatedAt: parsed.updatedAt || '',
    contacts: Array.isArray(parsed.contacts) ? parsed.contacts.map(normalizeContactRecord).filter(Boolean) : []
  };
}

export async function saveEmailContacts(root, book) {
  const normalized = {
    version: 1,
    updatedAt: new Date().toISOString(),
    contacts: [...book.contacts].sort((a, b) => contactKey(a.alias).localeCompare(contactKey(b.alias)))
  };
  await writeText(contactBookPath(root), `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

export async function upsertEmailContact(root, input = {}) {
  const alias = normalizeVisible(input.alias || input.name || input.displayName);
  const displayName = normalizeVisible(input.displayName || input.name || alias);
  const email = normalizeEmail(input.email);
  const label = normalizeVisible(input.label || 'primary');
  const notes = normalizeVisible(input.notes || input.note || '');

  if (!alias) throw new Error('email-contact add requires --alias.');
  if (!isEmail(email)) throw new Error('email-contact add requires a valid --email.');

  const book = await loadEmailContacts(root);
  const now = new Date().toISOString();
  const existing = book.contacts.find((contact) => matchesAlias(contact, alias));
  const emailEntry = { address: email, label, verifiedByUser: true };
  let status = 'created';

  if (existing) {
    const sameEmail = (existing.emails || []).some((item) => normalizeEmail(item.address) === email);
    if (!sameEmail && !input.replace) {
      throw new Error(`Contact alias "${alias}" already exists with a different email. Re-run with --replace to change it.`);
    }
    existing.alias = existing.alias || alias;
    existing.aliases = [...new Set([...(existing.aliases || []), alias])];
    existing.displayName = displayName || existing.displayName || alias;
    existing.emails = input.replace
      ? [emailEntry]
      : mergeEmailEntries(existing.emails || [], emailEntry);
    existing.notes = notes || existing.notes || '';
    existing.updatedAt = now;
    status = sameEmail ? 'updated' : 'replaced';
  } else {
    book.contacts.push({
      alias,
      aliases: [alias],
      displayName,
      emails: [emailEntry],
      notes,
      createdAt: now,
      updatedAt: now
    });
  }

  const saved = await saveEmailContacts(root, book);
  const contact = saved.contacts.find((item) => matchesAlias(item, alias));
  return { status, contact, file: contactBookPath(root) };
}

export async function saveEmailContactFromText(root, text, options = {}) {
  const parsed = parseContactRequest(text);
  if (!parsed.email || !parsed.alias) {
    throw new Error('Could not parse contact request. Provide --alias and --email, or write like: "person@example.com을 차니라는 연락처로 저장해줘."');
  }
  return upsertEmailContact(root, { ...parsed, replace: options.replace });
}

export function parseContactRequest(text) {
  const source = normalizeVisible(text);
  const email = firstEmail(source);
  const withoutEmail = normalizeVisible(source.replace(email, ' '));
  const patterns = [
    /(?:을|를)\s*["'“”‘’]?([^"'“”‘’\s]+)["'“”‘’]?(?:이라는|라는|이라고|라고)\s*(?:연락처|이름|별칭|contact)?(?:로|으로)?\s*(?:저장|기억|등록)/i,
    /["'“”‘’]?([^"'“”‘’\s]+)["'“”‘’]?(?:이라는|라는|이라고|라고)\s*(?:연락처|이름|별칭|contact)?(?:로|으로)?\s*(?:저장|기억|등록)/i,
    /(?:as|called|named)\s+["'“”‘’]?([^"'“”‘’]+?)["'“”‘’]?\s*(?:contact)?(?:\s|$)/i,
    /(?:alias|name|contact)\s*[:=]\s*["'“”‘’]?([^"'“”‘’]+?)["'“”‘’]?(?:\s|$)/i
  ];
  const match = patterns.map((pattern) => withoutEmail.match(pattern)).find(Boolean);
  const alias = normalizeVisible(match?.[1] || '');
  return {
    email: normalizeEmail(email),
    alias,
    displayName: alias
  };
}

export async function listEmailContacts(root) {
  const book = await loadEmailContacts(root);
  return book.contacts.map(publicContact);
}

export async function getEmailContact(root, alias) {
  const book = await loadEmailContacts(root);
  const matches = findContactMatches(book.contacts, alias);
  return matches.map(publicContact);
}

export async function resolveEmailRecipient(root, recipient) {
  const input = normalizeVisible(recipient || 'Recipient');
  const rawEmail = firstEmail(input);
  if (rawEmail) {
    const displayName = normalizeVisible(input.replace(rawEmail, '').replace(/[<>()]/g, '')) || '';
    return {
      status: 'raw-email',
      input,
      displayName,
      address: normalizeEmail(rawEmail),
      maskedAddress: maskEmail(rawEmail),
      reportLabel: displayName ? `${displayName} <${maskEmail(rawEmail)}>` : maskEmail(rawEmail),
      greetingName: displayName,
      note: 'Raw email was provided for this draft. Consider saving an alias if this recipient will be reused.'
    };
  }

  const book = await loadEmailContacts(root);
  const matches = findContactMatches(book.contacts, input);
  if (matches.length === 1) {
    const contact = matches[0];
    const primary = primaryEmail(contact);
    return {
      status: primary ? 'saved-contact' : 'saved-contact-without-email',
      input,
      alias: contact.alias,
      displayName: contact.displayName || contact.alias || input,
      address: primary?.address || '',
      maskedAddress: primary ? maskEmail(primary.address) : '',
      reportLabel: primary
        ? `${contact.displayName || contact.alias} <${maskEmail(primary.address)}>`
        : `${contact.displayName || contact.alias} (saved contact, no email)`,
      greetingName: contact.displayName || contact.alias || input,
      note: primary
        ? `Saved contact resolved from private contact book. Raw email stays in ${CONTACT_BOOK_DISPLAY}.`
        : 'Saved contact exists, but no email address is available.'
    };
  }

  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      input,
      reportLabel: maskEmailsInText(input),
      greetingName: input,
      matches: matches.map(publicContact),
      note: 'Multiple saved contacts matched. Ask the user to choose one before sending.'
    };
  }

  return {
    status: 'unresolved',
    input,
    reportLabel: maskEmailsInText(input),
    greetingName: input === 'Recipient' ? '' : input,
    note: 'No saved contact matched. Ask for an email address or save this recipient before sending.'
  };
}

export function renderRecipientResolution(resolution) {
  if (resolution.status === 'saved-contact') {
    return [
      `- Status: saved contact resolved`,
      `- Alias/display name: ${resolution.displayName}`,
      `- Primary email: ${resolution.maskedAddress}`,
      `- Privacy: raw email is stored only in \`${CONTACT_BOOK_DISPLAY}\`, not in this package`
    ].join('\n');
  }
  if (resolution.status === 'raw-email') {
    return [
      '- Status: raw email provided',
      `- Email: ${resolution.maskedAddress}`,
      '- Reuse note: ask whether to save an alias if this contact will be used again'
    ].join('\n');
  }
  if (resolution.status === 'ambiguous') {
    return [
      '- Status: ambiguous contact',
      '- Action needed: ask the user which saved contact to use',
      ...resolution.matches.map((contact) => `- Candidate: ${contact.displayName} (${contact.alias}) ${contact.primaryEmail}`)
    ].join('\n');
  }
  return [
    '- Status: unresolved contact',
    `- Requested recipient: ${maskEmailsInText(resolution.input)}`,
    '- Action needed: ask the user for the email address or save this recipient first'
  ].join('\n');
}

export function formatContactAddResult(result) {
  const contact = publicContact(result.contact);
  return `# Email Contact ${titleCase(result.status)}

- Alias: ${contact.alias}
- Display name: ${contact.displayName}
- Primary email: ${contact.primaryEmail}
- Private store: \`${CONTACT_BOOK_DISPLAY}\`
- Contact app boundary: no macOS, Google, or device Contacts app was accessed.
- Safety: the raw email is stored in ignored private memory. Actual sending still requires explicit approval and a connected Gmail/Outlook connector.`;
}

export function formatContactList(contacts) {
  if (!contacts.length) {
    return `# Email Contacts

No saved contacts found.

Private contact book path: \`${CONTACT_BOOK_DISPLAY}\``;
  }
  return `# Email Contacts

Private contact book path: \`${CONTACT_BOOK_DISPLAY}\`

${contacts.map((contact) => `- ${contact.displayName} (${contact.alias}) -> ${contact.primaryEmail}`).join('\n')}`;
}

export function maskEmailsInText(text) {
  return String(text || '').replace(EMAIL_RE, (email) => maskEmail(email));
}

export function redactEmailsForStorageName(text) {
  return String(text || '').replace(EMAIL_RE, 'email-contact');
}

export function maskEmail(email) {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return normalized;
  const visible = local.length <= 1 ? local : `${local[0]}***`;
  return `${visible}@${domain}`;
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function emptyBook() {
  return { version: 1, updatedAt: '', contacts: [] };
}

function normalizeContactRecord(contact) {
  if (!contact || typeof contact !== 'object') return null;
  const alias = normalizeVisible(contact.alias || contact.name || contact.displayName);
  const displayName = normalizeVisible(contact.displayName || contact.name || contact.alias);
  const rawEmails = Array.isArray(contact.emails)
    ? contact.emails
    : contact.email
      ? [{ address: contact.email, label: 'primary', verifiedByUser: true }]
      : [];
  const emails = rawEmails
    .map((item) => ({
      address: normalizeEmail(item.address || item.email || item),
      label: normalizeVisible(item.label || 'primary'),
      verifiedByUser: item.verifiedByUser !== false
    }))
    .filter((item) => isEmail(item.address));
  if (!alias && !displayName && !emails.length) return null;
  return {
    alias: alias || displayName,
    aliases: [...new Set([...(contact.aliases || []), alias || displayName].filter(Boolean))],
    displayName: displayName || alias,
    emails,
    notes: normalizeVisible(contact.notes || contact.note || ''),
    createdAt: contact.createdAt || contact.created_at || '',
    updatedAt: contact.updatedAt || contact.updated_at || contact.createdAt || contact.created_at || ''
  };
}

function publicContact(contact) {
  const primary = primaryEmail(contact);
  return {
    alias: contact.alias || '',
    displayName: contact.displayName || contact.alias || '',
    aliases: contact.aliases || [],
    primaryEmail: primary ? maskEmail(primary.address) : '(no email)',
    emailCount: (contact.emails || []).length,
    updatedAt: contact.updatedAt || ''
  };
}

function findContactMatches(contacts, value) {
  const key = contactKey(value);
  if (!key) return [];
  return contacts.filter((contact) => matchesAlias(contact, key) || contactKey(contact.displayName) === key);
}

function matchesAlias(contact, alias) {
  const key = contactKey(alias);
  return contactKey(contact.alias) === key || (contact.aliases || []).some((item) => contactKey(item) === key);
}

function primaryEmail(contact) {
  const emails = contact.emails || [];
  return emails.find((item) => item.label === 'primary') || emails[0] || null;
}

function mergeEmailEntries(existing, next) {
  const filtered = existing.filter((item) => normalizeEmail(item.address) !== normalizeEmail(next.address));
  return [next, ...filtered];
}

function firstEmail(value) {
  return String(value || '').match(EMAIL_RE)?.[0] || '';
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeVisible(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').normalize('NFC');
}

function contactKey(value) {
  return normalizeVisible(value).toLocaleLowerCase('ko-KR');
}

function titleCase(value) {
  return String(value || '').replace(/^\w/, (letter) => letter.toUpperCase());
}
