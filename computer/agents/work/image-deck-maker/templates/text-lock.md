# Image Deck Text Lock

## Approval Status

- Approved by user: no
- Approval date:

## Exact Text Intended For Generated Images

| Slide | Exact text | Text role | Render mode | Risk level | Reason | Approved |
|---|---|---|---|---|---|---|
| 01 |  | title / thesis / block / label / source / CTA | pure-imagegen / hybrid-overlay |  |  | no |

## Risk Levels

- Low: short generic labels.
- Medium: Korean text, brand names, names, short factual phrases.
- High: prices, dates, numbers, URLs, legal/financial claims, reputational claims.

## Generation Rule

Default mode is `pure-imagegen`: approved visible text is rendered by `$imagegen` inside the final slide image.

Do not generate final slide images until high-risk or outcome-sensitive text is approved.

Do not silently switch to text-free visuals or local text overlays.

Use `hybrid-overlay` only when the user explicitly approves it for text accuracy. If `hybrid-overlay` is used, mark each affected string and disclose it in the final handoff.
