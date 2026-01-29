## Summary

Implements **[UX] Light motion and transitions so the flow feels continuous** from the usability proposal (PR #47). Step changes, progressive headers, and topic cards use light CSS transitions so the flow feels like a continuous journey, not hard cuts.

## Changes

- **`src/styles/design-system.css`**
  - New tokens: `--transition-step`, `--transition-reveal`, `--stagger-delay`.
  - `.workflow-section-enter` — fade + slide when moving to next section.
  - `.reveal-stagger` — staggered reveal for topic cards / blocks (50–80ms per item).
  - `.success-highlight` — quick green ring after analysis complete.
  - `.progressive-step-enter` — slide down + fade for new progressive header steps.

- **DashboardLayout**
  - Audience and Posts sections use `workflow-section-enter` so they animate in when they appear.

- **ProgressiveStickyHeader & ProgressiveHeaders**
  - Each step row/card uses `progressive-step-enter` with staggered delay so new steps animate in.

- **PostsTab & TopicSelectionStep-v2**
  - Topic cards use `reveal-stagger` with per-card delay so results feel revealed, not dumped.

- **WebsiteAnalysisStepStandalone**
  - Analysis result card gets `success-highlight` for ~600ms when analysis completes.

## Testing

- `npm run test:e2e` — existing UX tests pass (no new E2E for motion; behavior unchanged).

## Related

- Closes #4 (when issue number is known; otherwise link manually).
