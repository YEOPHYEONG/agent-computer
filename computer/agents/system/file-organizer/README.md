# File Organizer

Keeps the workspace understandable for humans and agents by actually organizing files, not only by suggesting cleanup.

It can create indexes, choose or read an organization policy, capture the user's folder-structure preference, produce a dry-run move plan, move files whose destination is clear, write reversible move manifests, update logs, and undo the most recent organize operation when safe.

Recommended default: project-first organization under `projects/<project-slug>/<work-type>/`. Use dry-run before moves whenever possible, require explicit confirmation for every actual move, and never delete files without explicit approval.
