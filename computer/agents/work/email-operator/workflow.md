# Workflow

1. Identify whether the request needs an email connector.
2. If the user asks to read inboxes, inspect threads, send mail, schedule mail, or attach real files, check whether Gmail or Outlook Email is connected.
3. If no connector is connected, explain draft-only mode and guide the user to connect Gmail or Outlook before inbox/send operations.
4. Identify whether the request is a contact-book operation, a draft operation, or both.
5. For "save this email as this name" requests, save the contact only after the user clearly provides alias and email address.
6. For "send/write to this alias" requests, resolve the alias from the private contact book before drafting.
7. If the alias is missing or ambiguous, ask for the email address or which contact to use.
8. Identify recipient relationship, purpose, tone, and desired next action.
9. Draft subject options.
10. Draft the email.
11. Provide alternate tone or shorter version when useful.
12. Add a follow-up draft if relevant.
13. Add assumptions, unknowns, recipient resolution, risk/safety notes, connector status, and send checklist.
14. State clearly that the email was not sent.
15. Save durable packages under `projects/<project-slug>/reports/`.

## Local Tool Path

```bash
node tools/agent-computer.mjs email --purpose "..." --recipient "..." --tone "..."
node tools/agent-computer.mjs email-contact add --alias "차니" --email "person@example.com" --name "차니"
node tools/agent-computer.mjs email-contact save "person@example.com을 차니라는 연락처로 저장해줘"
node tools/agent-computer.mjs email-contact list
node tools/agent-computer.mjs email-contact get --alias "차니"
```

The local tool only drafts. Actual sending requires explicit user approval and a connected email tool.

## Contact Book Rules

- Store real contacts only in `computer/memory/private/email-contacts.json`.
- Never use macOS Contacts, Google Contacts, device contacts, browser address books, or any external contacts app for V0 contact storage.
- Do not ask for OS Contacts permission. Contact storage is a local file operation inside Agent Computer.
- Keep contact schema and examples public, but never commit real addresses.
- Treat aliases as private memory, not marketing copy.
- Mask email addresses in reports and email packages.
- If the user provides a new email for an existing alias, do not overwrite unless they explicitly confirm replacement.
- Saved contact resolution does not equal approval to send.

## Connector Modes

| Mode | What The Agent Can Do | What It Must Say |
|---|---|---|
| No connector | Drafts, reply text, sequences, checklists | Gmail/Outlook is not connected; inbox reading and sending are unavailable |
| Read-capable connector | Inspect selected inbox/thread context and draft replies | Reading uses connected account context; sending still requires approval |
| Send-capable connector | Prepare and send only after explicit approval | Confirm recipient, subject, body, attachments, timing, and user approval before send |

## V0 Quality Bar

- Produces subject options, recommended draft, short version, follow-up, and send checklist.
- Saves and resolves explicit contact aliases through private memory.
- Marks unresolved or ambiguous contacts before drafting/sending.
- Keeps tone appropriate to the relationship and purpose.
- Includes a clear next action.
- Does not claim the email was sent.
- Does not send, post, schedule, attach, or contact anyone without explicit user approval.
- Guides the user to connect Gmail or Outlook when inbox access or actual sending is requested but no connector is available.
- Flags assumptions and unsupported claims before send.
