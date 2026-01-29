## Summary

Implements **[UX] Show what's happening during analysis and generation (no black-box waiting)** from the usability proposal (PR #47). Users see clear progress copy and time expectations instead of generic spinners.

## Changes

- **`src/copy/systemVoice.js`**
  - **Analysis:** `loadingTitle`, existing `defaultProgress` (30–60 seconds).
  - **Audience:** `audience.generatingStrategies`, `audience.generatingStrategiesWithTime`.
  - **Topics:** `generatingTopics`, `generatingTopicsWithTime` (time hint).
  - **Content:** `generatingWithTime`, `progressSteps` (Structuring → Matching your voice → Polishing), `progressLabel`.

- **WebsiteAnalysisStepStandalone**
  - Loading title uses system voice ("Reading your site…"). Subtitle shows time expectation. Skeleton-style placeholder lines during load.

- **ContentGenerationStep-v2**
  - Title and paragraph use system voice; "What we're doing" shows plain-language steps.

- **PostsTab**
  - Topic and content generation loading use system voice + time hints.

- **AudienceSegmentsTab**
  - "Generating Audience Strategies" copy replaced with system voice + time hint.

- **E2E**
  - New test: "should show progress copy during analysis". Topic flow selector updated for new copy.

## Testing

- `npm run test:e2e` — System voice (UX) tests pass, including new progress copy test.

## Related

- Closes #3 (when issue number is known; otherwise link manually).
