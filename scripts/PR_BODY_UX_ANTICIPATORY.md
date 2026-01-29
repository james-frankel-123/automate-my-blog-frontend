## Summary

Implements **[UX] Suggest next steps so the app feels one step ahead** from the usability proposal (PR #47). Builds on one consistent voice and adds anticipatory copy so the app feels one step ahead.

## Changes

- **`src/copy/systemVoice.js`**  
  New `suggestions` object: `afterAnalysis`, `afterAudience`, `whySuggested`, `getWhySuggestedForTopic`, `welcomeBackCached`.

- **DashboardTab**  
  - Anticipatory line after website analysis: e.g. “Ready to create something for [audience]?”  
  - “Welcome back” hint strip when cached analysis exists: “Last time you were working on [context]. Continue or start something new?”

- **TopicSelectionStep-v2**  
  - “Why we suggested this” on each topic card (uses `topic.whySuggested` or fallback).  
  - Anticipatory empty state after audience selection.

- **PostsTab**  
  - “Why we suggested this” on topic cards in both workflow branches (`data-testid="topic-why-suggested"`).

- **E2E**  
  - Anticipatory line after analysis test.  
  - Topic-generation flow test (mock topics load after audience selection).  
  - Mocks: `MOCK_TOPICS` include `whySuggested` for copy.

- **Fix**  
  - `TopicSelectionStep-v2`: add `onAnalysisComplete` to props destructuring (lint).

## Testing

- `npm run test:e2e` — System voice (UX) tests pass, including anticipatory line and topic-generation flow.
- Unit tests updated/run as needed.

## Related

- One consistent voice: included in this branch via prior commits.
- Closes #2 (when issue number is known; otherwise link manually).
