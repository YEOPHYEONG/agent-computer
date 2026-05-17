# Workflow

1. Read the user request.
2. Read the produced output.
3. Compare output against requirements.
4. Check evidence and uncertainty.
5. Check formatting and file outputs.
6. Report issues by severity.
7. Recommend fixes.

## Local Tool Path

```bash
node tools/agent-computer.mjs qa <output-file>
```

The V0 CLI checks Markdown/text outputs for common quality risks and checks PPTX files for a valid package signature, presentation file, and slide XML files. Manual visual QA is still required for final design judgment.
