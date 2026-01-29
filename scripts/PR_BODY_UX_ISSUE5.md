## Summary

Implements **[UX] One consistent place for hints, empty states, and errors** from the usability proposal (PR #47). A single **system hint strip** below the header shows one line at a time for contextual hints, confirmations, and non-critical errors—same voice and style everywhere.

## Visuals: SystemHint component

**Success** (e.g. after analysis complete):
![SystemHint — success](docs/pr-screenshots/issue-5/issue5-system-hint-success.png)

**Hint** (e.g. "Complete website analysis first..."):
![SystemHint — hint](docs/pr-screenshots/issue-5/issue5-system-hint-hint.png)

**Error** (e.g. analysis failed):
![SystemHint — error](docs/pr-screenshots/issue-5/issue5-system-hint-error.png)

## Changes

- **`src/copy/systemVoice.js`**
  - New `hint.savedProgress`, `hint.chooseAudienceNext` for the strip.

- **`src/contexts/SystemHintContext.js`**
  - `SystemHintProvider` and `useSystemHint()` — one-line hint state, `setHint(message, variant?, duration?)`, auto-dismiss via ref.

- **`src/components/Dashboard/SystemHint.js`**
  - Thin bar below header: icon by variant (info / success / error), message, dismiss (×). `data-testid="system-hint"`.

- **App.js**
  - Wraps app with `SystemHintProvider`.

- **DashboardLayout**
  - Renders `SystemHint` below progress header; uses `setHint` for save project and Create New Post flows (with/without analysis).

- **WebsiteAnalysisStepStandalone**
  - Sets hint on analysis success, fallback, and failure (plus existing toasts).

## Testing

- Unit: `SystemHintContext.test.js` (provider, SystemHint display, no-op outside provider); DashboardLayout tests wrapped with `SystemHintProvider`.
- E2E: "should show system hint after analysis complete" — strip visible with "We've got your site" / "Choose your audience" after Analyze.

## Related

- Closes #5 (when issue number is known; otherwise link manually).
