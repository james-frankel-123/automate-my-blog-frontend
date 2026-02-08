# E2E Test Coverage – Workflows

E2E tests live under **`e2e/`** and use a **mocked backend**. Main suite: **`e2e/e2e.spec.js`**. **`e2e/onboarding-funnel.spec.js`** covers the guided funnel (Issue #261).

## Workflows Covered

| Workflow | Describe | Notes |
|----------|----------|-------|
| **Onboarding funnel (#261)** | Onboarding funnel (Issue #261) | URL → Analyze → Confirm & Continue → audience → topic → signup (register). See `e2e/onboarding-funnel.spec.js`. |
| **Auth (logged out)** | Auth (logged out) | Login form, sign up form, **website analysis section nav (#168)** (granular nav, smooth scroll, scroll spy, mobile horizontal nav). |
| **Auth (logged in)** | Auth (logged in) | Persist login, logout, **section nav after analysis (#168)**. |
| **Workflow** | Workflow | Homepage steps, start analysis, results, persistence, **smoke** (analyze → audience → strategy → posts), **full** (analyze → … → export). |
| **Worker queue & progress** | Worker queue & progress | Content generation progress bar/step label, website analysis progress bar, **503 queue unavailable** (re-enabled), retry modal on job failure, **posts and credits load in parallel** on dashboard mount. Some tests (full workflow to editor, progress bar, retry modal) remain skipped pending topic→content selector stability. |
| **Dashboard** | Dashboard | Layout, tab nav (Dashboard, Posts, Audience, Analytics, Settings), user menu, workflow indicators, sidebar toggle (mobile). |
| **Content management** | Content management | Posts list, create, edit, toolbar, preview, export, filter/search. |
| **Full scenarios** | Full workflow scenarios | Dashboard tabs flow, create → edit → preview → export. |

## Demo Video

**`e2e/videos/complete-workflow-demo.webm`** — recorded run of the “full workflow” test.

Regenerate:

```bash
npm run test:e2e:record
```

## Commands

```bash
npm run test:e2e       # run all e2e
npm run test:e2e:record   # record full-workflow video
npm run test:e2e:report   # open HTML report
```
