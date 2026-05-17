# Email Operator Contact Schema

Real user contacts are private workspace data. Public repositories may include this schema, but must not include the actual contact book.

## Private Store

```text
computer/memory/private/email-contacts.json
```

This path is ignored by `.gitignore`.

Do not use macOS Contacts, Google Contacts, device contacts, browser address books, or any external contacts app for V0 contact storage. The email-operator contact book is a local Agent Computer private-memory file.

## Shape

```json
{
  "version": 1,
  "updatedAt": "2026-05-17T00:00:00.000Z",
  "contacts": [
    {
      "alias": "example-alias",
      "aliases": ["example-alias"],
      "displayName": "Example Person",
      "emails": [
        {
          "address": "person@example.com",
          "label": "primary",
          "verifiedByUser": true
        }
      ],
      "notes": "",
      "createdAt": "2026-05-17T00:00:00.000Z",
      "updatedAt": "2026-05-17T00:00:00.000Z"
    }
  ]
}
```

## Commands

```bash
node tools/agent-computer.mjs email-contact add --alias "차니" --email "person@example.com" --name "차니"
node tools/agent-computer.mjs email-contact save "person@example.com을 차니라는 연락처로 저장해줘"
node tools/agent-computer.mjs email-contact list
node tools/agent-computer.mjs email-contact get --alias "차니"
node tools/agent-computer.mjs email --purpose "..." --recipient "차니"
```

## Safety Rules

- Save contacts only when the user explicitly asks.
- Do not ask for OS Contacts permission.
- Mask email addresses in durable reports and draft packages.
- Do not overwrite an alias with a different email unless the user explicitly confirms replacement.
- Do not send email just because a contact resolved successfully.
- Actual sending still requires a connected Gmail/Outlook connector and explicit user approval.

## Compatibility

The official schema uses `alias`, `displayName`, and `emails`. V0 tools also tolerate older simple records shaped like `{ "name": "...", "email": "..." }` so manually saved contact books can still resolve.
