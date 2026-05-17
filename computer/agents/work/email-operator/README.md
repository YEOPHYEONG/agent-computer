# Email Operator

Writes email drafts, replies, follow-ups, and outreach sequences.

By default this agent runs in draft-only mode. Inbox reading, thread analysis, real attachments, scheduling, and sending require a connected Gmail or Outlook Email connector. Even with a connector, actual sending requires explicit user approval.

It also maintains a private local contact book for aliases such as "차니" -> an email address. The schema is public, but real contacts live in `computer/memory/private/email-contacts.json`, which is ignored for open-source release.

This contact book is not macOS Contacts, Google Contacts, or any external address book. V0 contact storage is a local private-memory file and should not request OS contacts permission.
