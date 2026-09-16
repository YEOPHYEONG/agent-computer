# Workflow

1. Read the user request.
2. Read the produced output.
3. Compare output against requirements.
4. Check evidence and uncertainty.
5. For deep research and strategy reports, inspect the output and same-project `research/` artifacts, then check whether the final synthesis uses the question ledger:
   - question routing lanes are visible
   - questions that changed the recommendation are included
   - assumptions being carried are explicit
   - a Claim-Evidence-Confidence-Caveat matrix is summarized in the main report
   - validation-later items appear only when real-world behavior evidence is actually needed
   - research-backed reports are not thin briefs unless the user explicitly requested a brief
   - `reports/*.md` files are checked as reports even when the filename is not `<topic>_report.md`
   - subagent result files use canonical `research/subagent-results/ac-<role>.md` paths
   - subagent-backed research preserves `ac-intent-analyst.md` and `ac-research-architect.md` before investigation synthesis
   - subagent-backed final reports include `ac-report-composer.md`
   - any report claiming `ac-report-composer` authorship/composition is blocked if `ac-report-composer.md` is missing or only a template
   - non-canonical subagent files, nicknames, or combined role filenames are reported as trace issues
6. For HTML/web report requests, check that:
   - the deep research/report artifact exists separately as Markdown
   - web implementation files live under `workspace/projects/<project-slug>/web/`
   - the page preserves the approved report's core conclusions, caveats, and evidence boundaries
   - local HTML/CSS/JS can be opened without hidden external account dependencies
7. Check formatting and file outputs.
8. Report issues by severity.
9. Recommend fixes.

## Local Tool Path

```bash
node tools/agent-computer.mjs qa <output-file>
```

The V0 CLI checks Markdown/text outputs for common quality risks, deep-research question-to-synthesis trace, and PPTX files for a valid package signature, presentation file, and slide XML files. Manual visual QA is still required for final design judgment.
