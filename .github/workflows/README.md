# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD.

## Workflows

### `e2e-tests.yml`
Standalone E2E test workflow that can be triggered independently or as part of CI/CD.

**Triggers:**
- Push to main, feat/**, or fix/** branches
- Pull requests to main
- Manual dispatch

**What it does:**
- Installs dependencies
- Installs Playwright browsers
- Runs all E2E tests
- Uploads test artifacts (reports, videos, screenshots)

### `deploy.yml`
Deployment workflow that runs unit tests, build, and Vercel deploy. E2E is **not** run here; the standalone **E2E Tests** workflow runs once per push/PR. Require **"E2E Tests"** as a status check in branch protection so deployment only proceeds when E2E has passed.

**Triggers:**
- Push to main
- Pull requests to main

**What it does:**
1. Runs unit tests and lint
2. Verifies build
3. Deploys to preview (PRs) or production (main branch)

**Important:** In branch protection for `main`, require **"Run E2E Tests"** (from the E2E Tests workflow). If you still have **"E2E Tests (Required)"** listed, remove it—that was the old deploy job and no longer exists.

### `ci.yml`
General CI workflow for running tests on all PRs and pushes.

**Triggers:**
- Push to main, feat/**, or fix/** branches
- Pull requests to main
- **merge_group** – when a PR is in the merge queue (so required checks run on the merge group ref)

**What it does:**
- Runs E2E tests
- Runs unit tests (if available)

## Workflow Dependencies

```
┌─────────────┐
│   Push/PR   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  e2e-tests   │   │  unit-tests  │
│   (CI)       │   │   (CI)       │
└──────────────┘   └──────────────┘
       │
       │ (if main branch)
       ▼
┌──────────────┐
│   deploy     │
│  (Vercel)    │
└──────────────┘
```

## Blocking Deployment

E2E is enforced by **branch protection**, not by a job inside `deploy.yml` (avoids running E2E twice).

1. **Settings → Branches** → Add or edit rule for `main`
2. Enable **"Require status checks to pass before merging"**
3. Add **"E2E Tests"** (the workflow name from `e2e-tests.yml`) and any other required checks (e.g. "Run Tests", "Verify Build")
4. Save

If E2E tests fail:
- ❌ The "E2E Tests" check will be red; PRs cannot merge until it passes
- ✅ Test artifacts are uploaded by the E2E Tests workflow for debugging
- ✅ Deploy workflow still runs unit tests and build; merge/deploy is blocked until E2E passes

## Test Artifacts

When tests fail, the following artifacts are uploaded:

1. **playwright-report/** - HTML test report (always uploaded)
2. **test-videos/** - Video recordings of failed tests
3. **test-screenshots/** - Screenshots of failed tests
4. **e2e-results.json** - JSON test results

These can be downloaded from the GitHub Actions run page.

## Manual Testing

To manually trigger E2E tests:

1. Go to Actions tab in GitHub
2. Select "E2E Tests" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Troubleshooting

### Tests fail in CI but pass locally

- Check Node.js version matches (18.x)
- Verify all dependencies are installed (`npm ci`)
- Check if backend API is accessible (tests may need backend)
- Review test artifacts (videos/screenshots)

### Deployment blocked by tests

- Fix failing tests first
- Check test artifacts for details
- Ensure backend is accessible if required
- Review test logs in GitHub Actions

### Tests timeout

- Increase timeout in workflow file (`timeout-minutes`)
- Check if server starts properly
- Verify Playwright browsers are installed
- Check for hanging processes

## Environment Variables

Required secrets (for deployment):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Optional (for tests):
- `PLAYWRIGHT_BASE_URL` - Override base URL (default: http://localhost:3000)
- `TEST_USER_EMAIL` - Test user email (if needed)
- `TEST_USER_PASSWORD` - Test user password (if needed)
