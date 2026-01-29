## Summary

Thorough cleanup on a fresh branch from `main`: remove unused code, trim dead state, update comments and references. No behavior change to the live app; all unit and E2E tests pass.

## Removed (unused)

### Workflow entry points
- **WorkflowContainer.js** — never imported or rendered
- **WorkflowRenderer.js** — never imported or rendered
- **WorkflowComponent.js** — never imported or rendered

### Hooks
- **useWorkflowState.js**, **useWorkflowState-v2.js** — never imported; workflow state lives in `WorkflowModeContext`

### Components
- **ChangesSummary.js** — only used by `WorkflowContainer` (removed)
- **Non–v2 steps** (only used by `WorkflowContainer`):  
  `WebsiteAnalysisStep`, `CustomerStrategyStep`, `TopicSelectionStep`, `ContentGenerationStep`, `ContentEditingStep`, `ExportStep`
- **-v2 steps** (only used by `WorkflowRenderer`):  
  `WebsiteAnalysisStep-v2`, `CustomerStrategyStep-v2`, `TopicSelectionStep-v2`, `ContentGenerationStep-v2`, `ContentEditingStep-v2`, `ExportStep-v2`
- **Standalone steps** (never imported):  
  `TopicSelectionStepStandalone`, `ContentGenerationStepStandalone`, `AudienceSelectionStepStandalone`, `EnhancedContentGenerationStep`

### Kept (in use)
- **WebsiteAnalysisStepStandalone** — used by `DashboardTab`
- **WorkflowComponentInterface** (ComponentHelpers) — used by `PostsTab`, `AudienceSegmentsTab`, `WebsiteAnalysisStepStandalone`
- **ModeToggle** / **WorkflowGuidance** — `WorkflowGuidance` used by `PostsTab`

## Other changes

- **AudienceSegmentsTab:** Removed `bundlePricing` state and bundle-fetch block; removed unused keyword-editing state and handlers (`editingKeywords`, `editedKeywords`, `savingKeywords`, `handleStartEditingKeywords`, etc.). Fixed regex `[^\$]` → `[^$]` (no-useless-escape).
- **PostsTab:** Removed unused `Empty` import and `manualCTAPromptShown` / `setManualCTAPromptShown` state.
- **WorkflowModeContext:** Simplified comments; removed references to deleted `useWorkflowState-v2` and `WorkflowContainer-v2`.
- **systemVoice.js:** Updated topic-section comment (`TopicSelectionStep-v2` → `PostsTab`).
- **e2e/e2e.spec.js:** Updated “Why we suggested this” comment (`TopicSelectionStep-v2` → `PostsTab`).
- **scripts/phase1a-frontend-test.js:** File-existence check now uses `WebsiteAnalysisStepStandalone.js` instead of `WebsiteAnalysisStep.js`.

## Testing

- **Unit:** `npm test` — 8 suites, 96 tests, all pass.
- **E2E:** `npm run test:e2e` — workflow, dashboard, content, and full-flow tests pass (including “full workflow: analyze → audience → content step shows topic section (not blank)”).
- **Build:** `npm run build` — succeeds; bundle size slightly smaller.

## Notes

- The app’s workflow is implemented via **DashboardLayout** → **DashboardTab** (home + `WebsiteAnalysisStepStandalone`), **AudienceSegmentsTab**, and **PostsTab**. The removed WorkflowContainer / WorkflowRenderer / step components were legacy and unused.
- Existing lint warnings (e.g. `react-hooks/exhaustive-deps`, some `no-unused-vars`) remain; this PR does not change lint configuration.
