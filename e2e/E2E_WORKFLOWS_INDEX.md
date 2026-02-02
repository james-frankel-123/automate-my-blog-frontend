# E2E Test Coverage – Workflows

All e2e tests live in **`e2e/e2e.spec.js`** and use a **mocked backend**.

## Workflows Covered

| Workflow | Describe | Notes |
|----------|----------|-------|
| **Auth (logged out)** | Auth (logged out) | Login form, sign up form. |
| **Auth (logged in)** | Auth (logged in) | Persist login, logout. |
| **Workflow** | Workflow | Homepage steps, start analysis, results, persistence, **smoke** (analyze → audience → strategy → posts), **full** (analyze → … → export). |
| **Worker queue & progress** | Worker queue & progress | Content generation progress bar/step label, website analysis progress bar, 503 queue unavailable, retry modal on job failure. |
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
