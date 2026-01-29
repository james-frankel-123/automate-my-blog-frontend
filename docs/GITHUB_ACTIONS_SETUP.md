# GitHub Actions E2E Test Integration

## ✅ Setup Complete

E2E tests are now integrated into GitHub Actions and **will block deployment** if tests fail.

## Workflow Structure

### 1. E2E Tests Workflow (`e2e-tests.yml`)
- **Standalone workflow** that can run independently
- Runs on: pushes to main/feat/fix branches, PRs, manual trigger
- Installs Playwright and browsers
- Runs all E2E tests
- Uploads test artifacts (reports, videos, screenshots)

### 2. Deploy Workflow (`deploy.yml`) - **BLOCKS ON FAILURE**
- **Requires E2E tests to pass** before deployment
- Uses `needs: e2e-tests` to create dependency
- If E2E tests fail → Deployment **will not run**
- If E2E tests pass → Proceeds with Vercel deployment

### 3. CI Workflow (`ci.yml`)
- Runs on all PRs and pushes
- Runs both E2E and unit tests
- Provides early feedback

## How It Works

```
┌─────────────────────────────────────────┐
│  Push to main / PR to main              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  e2e-tests job starts                   │
│  - Install dependencies                 │
│  - Install Playwright                   │
│  - Run E2E tests                        │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │               │
       ▼               ▼
   ✅ PASS         ❌ FAIL
       │               │
       │               └───► Deployment BLOCKED
       │                       (job does not run)
       │
       ▼
┌─────────────────────────────────────────┐
│  deploy job starts                      │
│  - Build project                        │
│  - Deploy to Vercel                     │
└─────────────────────────────────────────┘
```

## Key Features

### ✅ Deployment Blocking
The `deploy.yml` workflow uses:
```yaml
jobs:
  e2e-tests:
    # ... test steps ...
    
  deploy:
    needs: e2e-tests  # ⚠️ CRITICAL: Blocks deployment if tests fail
```

**If E2E tests fail:**
- ❌ The `deploy` job will **not execute**
- ✅ GitHub will show failed status on PR/commit
- ✅ Test artifacts available for debugging
- ✅ No code will be deployed

### ✅ Test Artifacts
On failure, the following are uploaded:
- **playwright-report/** - HTML test report (always)
- **test-videos/** - Video recordings (on failure)
- **test-screenshots/** - Screenshots (on failure)
- **e2e-results.json** - JSON results (always)

### ✅ Automatic Server Management
Playwright's `webServer` config automatically:
- Starts the dev server before tests
- Waits for server to be ready
- Stops server after tests complete
- Handles errors gracefully

## Testing the Setup

### 1. Test Locally First
```bash
# Make sure tests pass locally
npm run test:e2e
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Add E2E tests with GitHub Actions"
git push origin main
```

### 3. Check GitHub Actions
1. Go to your repository on GitHub
2. Click "Actions" tab
3. Watch the workflow run
4. Verify E2E tests run before deployment

### 4. Test Failure Scenario
To verify blocking works:
1. Temporarily break a test
2. Push to main
3. Verify deployment job doesn't run
4. Fix test and push again
5. Verify deployment proceeds

## Workflow Files

```
.github/workflows/
├── e2e-tests.yml      # Standalone E2E test workflow
├── deploy.yml         # Deployment (depends on e2e-tests)
├── ci.yml             # General CI workflow
└── README.md          # Detailed documentation
```

## Configuration

### Playwright Config
- Automatically starts dev server via `webServer` config
- Uses Chromium browser
- Retries 2x on CI
- Captures screenshots/videos on failure
- Generates HTML and JSON reports

### GitHub Actions
- Node.js 18
- Ubuntu latest
- 30-minute timeout for E2E tests
- Artifact retention: 30 days (reports), 7 days (videos/screenshots)

## Troubleshooting

### Tests fail in CI but pass locally
1. Check Node.js version (should be 18)
2. Verify `npm ci` installs correctly
3. Check if backend API is accessible
4. Review test artifacts (videos/screenshots)

### Deployment not blocked
1. Verify `needs: e2e-tests` is in deploy.yml
2. Check workflow syntax is correct
3. Ensure e2e-tests job name matches

### Tests timeout
1. Increase `timeout-minutes` in workflow
2. Check server startup logs
3. Verify Playwright browsers installed
4. Check for resource constraints

### Server won't start
1. Verify `npm start` works locally
2. Check for port conflicts
3. Review Playwright webServer config
4. Check environment variables

## Next Steps

1. **Push to GitHub** to trigger workflows
2. **Monitor first run** to ensure everything works
3. **Review test results** and adjust as needed
4. **Add branch protection rules** (optional):
   - Require E2E tests to pass before merge
   - Require status checks to pass

## Branch Protection (Optional)

To further enforce test requirements:

1. Go to repository Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Select "e2e-tests" check
5. Save

This ensures PRs can't be merged if E2E tests fail.

## Summary

✅ E2E tests run automatically on every push/PR  
✅ Deployment is **blocked** if tests fail  
✅ Test artifacts uploaded for debugging  
✅ Server management handled automatically  
✅ Ready for production use  

The setup ensures only tested, working code gets deployed! 🚀
