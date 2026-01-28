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
Deployment workflow that **requires E2E tests to pass** before deploying.

**Triggers:**
- Push to main
- Pull requests to main

**What it does:**
1. **Runs E2E tests first** (blocks deployment on failure)
2. If tests pass, proceeds with Vercel deployment
3. Deploys to preview (PRs) or production (main branch)

**Important:** Deployment will **fail** if E2E tests fail. This ensures only tested code is deployed.

### `ci.yml`
General CI workflow for running tests on all PRs and pushes.

**Triggers:**
- Push to main, feat/**, or fix/** branches
- Pull requests to main

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

The `deploy.yml` workflow uses the `needs` keyword to ensure E2E tests must pass:

```yaml
jobs:
  e2e-tests:
    # ... test steps ...
    
  deploy:
    needs: e2e-tests  # ⚠️ Blocks deployment if tests fail
    # ... deploy steps ...
```

If E2E tests fail:
- ❌ Deployment job will not run
- ✅ Test artifacts will be uploaded for debugging
- ✅ GitHub will show the failed status on the PR/commit

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
