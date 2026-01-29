## Summary

Implements **one consistent voice across the app so it feels like one helpful person** from the usability proposal (PR #47; see `docs/GITHUB_ISSUES_FROM_USABILITY_PROPOSAL.md`).

Target audience: people who are **not** marketers—builders, small businesses, solopreneurs. All copy uses plain language: no industry buzzwords or acronyms.

## Changes

- **New:** `src/copy/systemVoice.js` — single source of truth for step messages, progress text, toasts, errors, empty states. One personality: helpful, confident, a bit warm.
- **Updated to use systemVoice:**
  - `UnifiedWorkflowHeader.js` — step titles/descriptions, welcome back, project saved, CTAs
  - `WebsiteAnalysisStepStandalone.js` — progress messages, success/error toasts, analyze button/labels
  - `ProgressiveHeaders.js` — step labels (e.g. “We know your site”, “Audience locked in”, “Topic chosen”)
  - `TopicSelectionStep-v2.js` — topic ideas headline (no “high-impact” / “Based on your business analysis”)
  - `ContentGenerationStep-v2.js` — title and topic headline
  - `WorkflowRenderer.js` — all workflow toasts (analysis complete, strategy selected, content generated, etc.)

## Example copy changes

| Before | After |
|--------|--------|
| “Let's Create Your Perfect Blog Post” | “Your next post starts here” |
| “Analyzing website content…” | “Reading your site…” |
| “Website analysis completed successfully!” | “We've got the full picture. Pick your audience next.” |
| “Based on your business analysis, here are high-impact blog post ideas” | “Here's what we think will resonate with your audience right now” |
| “Website Analyzed” / “Audience Selected” | “We know your site” / “Audience locked in” |

## Testing

- Unit tests: `npm test` — all pass
- E2E tests: `npm run test:e2e` — all pass. **E2E updates (per CONTRIBUTING):**
  - **New:** `System voice (UX)` describe with two tests:
    - Header shows “Your next post starts here” when starting workflow
    - Success toast shows new message (“We've got the full picture” / “Pick your audience next”) after website analysis
  - **Updated:** “should display workflow steps on homepage” — added “Your next post starts here” as an accepted indicator so the new voice is covered.

## Checklist

- [x] Copy centralized in `src/copy/systemVoice.js`
- [x] All listed components use systemVoice
- [x] Plain language only; no buzzwords
- [x] Unit and E2E tests pass
- [x] E2E tests updated for new UI copy (CONTRIBUTING: update E2E when UI changes)
