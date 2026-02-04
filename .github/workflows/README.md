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
Deployment workflow that runs lint, unit tests, build (one job), then Vercel deploy. E2E is **not** run here; the standalone **E2E Tests** workflow runs once per push/PR. Require **"Run E2E Tests"** and **"Test and Build"** in branch protection.

**Triggers:**
- Push to main
- Pull requests to main
- merge_group (for merge queue)

**What it does:**
1. **Test and Build** (one job): lint, unit tests, build — single `npm ci`
2. Deploys to preview (PRs) or production (main branch)

**Important:** In branch protection for `main`, require **"Run E2E Tests"** and **"Test and Build"**. Remove any old **"Run Tests"** / **"Verify Build"** if you upgraded from the two-job setup.

### `ci.yml`
General CI workflow for running tests on all PRs and pushes.

**Triggers:**
- Push to main, feat/**, or fix/** branches
- Pull requests to main
- **merge_group** – when a PR is in the merge queue (so required checks run on the merge group ref)

**What it does:**
- Runs E2E tests
- Runs unit tests on push to feat/** or fix/** only (on PR and main they run once in deploy.yml)

## Workflow Dependencies

```
┌─────────────┐
│   Push/PR   │
└──────┬──────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌──────────────┐   ┌─────────────────────┐
│  e2e-tests   │   │  deploy: Test and   │
│   (CI)       │   │  Build (lint+test+  │
│              │   │  build, one job)    │
└──────────────┘   └──────────┬──────────┘
       │                       │
       │                       │ (if main or PR)
       │                       ▼
       │              ┌──────────────┐
       │              │ deploy /     │
       │              │ preview      │
       └──────────────│ (Vercel)     │
                      └──────────────┘
```

## Blocking Deployment

E2E is enforced by **branch protection**, not by a job inside `deploy.yml` (avoids running E2E twice).

1. **Settings → Branches** → Add or edit rule for `main`
2. Enable **"Require status checks to pass before merging"**
3. Add **only** these required checks:
   - **Test and Build** (from deploy.yml)
   - **Run E2E Tests** (from e2e-tests.yml or CI)
4. **Do not** require **"Deploy to Vercel"** or **"Deploy Preview"** — they are skipped on PRs and on the merge queue, so requiring them will block the merge queue forever ("Some required checks haven't completed yet").
5. Save

If E2E or Test and Build fail:
- ❌ The failing check will be red; PRs cannot merge until it passes
- ✅ Test artifacts are uploaded by the E2E Tests workflow for debugging
- ✅ Merge/deploy is blocked until both checks pass

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

## Merge queue

When using **merge queue**, only require status checks that run on `merge_group`:

- **Test and Build** ✓  
- **Run E2E Tests** ✓  

Do **not** require **Deploy to Vercel** or **Deploy Preview**. Those jobs are skipped in the merge queue (they run only on `push` to main and `pull_request`). If they are required, the merge queue will never complete because it waits for checks that never run.

**Fix "Some required checks haven't completed yet":**  
Repo **Settings → Branches** → rule for `main` → **Require status checks** → remove "Deploy to Vercel" and "Deploy Preview" from the list; keep only **Test and Build** and **Run E2E Tests**.

## Speeding up CI

- **Concurrency:** All workflows use `concurrency: cancel-in-progress: true` per branch. New pushes cancel in-progress runs so you don’t wait on outdated jobs.
- **No duplicate unit tests:** CI runs its "Unit Tests" job only on push to feat/** or fix/**. On PR and push to main, unit tests run once in deploy.yml "Test and Build".
- **Single Test and Build job:** deploy.yml runs lint, unit tests, and build in one job with one `npm ci`, saving a full job (checkout + install + build) per run.
- **Optional (future):**
  - **Playwright browser cache:** Cache `~/.cache/ms-playwright` keyed by `package-lock.json` in e2e-tests.yml to avoid re-downloading Chromium (~1–2 min on cache hit).
  - **E2E sharding:** Run `playwright test --shard=1/2` and `--shard=2/2` in a matrix to cut E2E wall time; add all shard checks to branch protection.
  - **Coverage only when needed:** Run unit tests without `--coverage` on PR/merge for speed; run with coverage on main or in a separate job.

### Speeding up the merge queue

- **No duplicate unit tests on merge queue:** CI workflow skips its "Unit Tests" job on `merge_group`; deploy.yml "Run Tests" already runs unit tests, so merge queue runs them once.
- **Playwright browser cache:** E2E workflow caches `~/.cache/ms-playwright` keyed by `package-lock.json`; cache hits avoid re-downloading Chromium (~1–2 min saved).
- **Optional (future):** E2E sharding (`playwright test --shard=1/2` with a matrix) can run E2E in parallel across runners to cut E2E wall time; branch protection would need to require all shard checks.

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
