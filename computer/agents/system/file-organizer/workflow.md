# Workflow

1. Check whether `system/organization-policy.md` exists.
2. If no policy exists, ask the user to choose a policy and folder-structure preference, then stop and wait for the answer.
3. Recommend project-first unless the user chooses otherwise: `projects/<project-slug>/<work-type>/`.
4. Save the selected policy, preferred layout, and safety rules.
5. Scan the workspace.
6. Identify active files, generated outputs, stale files, archives, trash candidates, and ambiguous files.
7. Generate a move plan.
8. Run dry-run and show planned moves first whenever possible.
9. Move files whose destination is clear under the selected policy only after explicit confirmation, represented in the local CLI by `--yes`.
10. Put ambiguous files into a `review-needed/` area.
11. Write a reversible move manifest under `system/move-manifests/`.
12. Update workspace maps and indexes.
13. Write `system/file-move-log.md`.
14. Create daily or weekly summaries when scheduled.
15. Ask for approval before deleting files or performing destructive changes.

## Undo

Use the most recent move manifest to undo the last organize operation when possible. Never overwrite newer user edits during undo; if a destination has changed, stop and ask the user.

## Local Tool Path

```bash
node tools/agent-computer.mjs organize --policy hybrid --dry-run
node tools/agent-computer.mjs organize --policy hybrid --yes
node tools/agent-computer.mjs undo-last-organize
```

Default to dry-run. The move command requires `--yes` for every actual move, even a single file, and writes manifests so the last organize operation can be reversed when paths are still safe. Undo refreshes `system/workspace-index.md`.

For the preferred project-first policy, target:

```text
projects/<project-slug>/
  source/
  converted/
  research/
  reports/
  presentations/
  web/
  qa/
  assets/
  tasks/
  archive/
```
