## Summary

Cleanup after completing the usability proposal work (Issues 1–6). No behavior changes.

## Changes

### Remove issue references from codebase
- **Source comments & JSDoc:** Dropped "(Issue N)" from comments in `src/` (design-system.css, systemVoice.js, SystemHintContext, SystemHint, WebsiteAnalysisStepStandalone, PostsTab, DashboardLayout, ContentGenerationStep-v2). Comments keep their descriptive text only.
- **E2E:** Test names no longer include "(Issue N)" — e.g. "should show progress copy during analysis", "should show system hint after analysis complete".
- **Scripts / PR docs:** PR body templates and `create-branch-rebase-pr.sh` now use feature-focused wording without "Issue N" in titles/summaries. `docs/GITHUB_ISSUES_FROM_USABILITY_PROPOSAL.md` and `scripts/create-usability-proposal-issues.sh` unchanged (canonical issue definitions).

### Remove unused / backup files
- **Deleted:** `src/components/Dashboard/DashboardTab-backup.js` (placeholder backup, not imported).
- **Deleted:** `src/contexts/WorkflowModeContext.js.backup` (full backup, not imported).
- **Deleted:** `src/old/` — `App.js`, `NewPostTab.js`, `WorkflowContainer-v2.js` (old versions, not referenced).
- **Deleted:** `src/test-visual-suggestions.html` (standalone test page, not part of app).

## Testing

- `npm test` and `npm run test:e2e` — no changes to behavior; all tests should pass.
