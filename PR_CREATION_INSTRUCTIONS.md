# GitHub Actions PRs - Creation Instructions

## Summary

I've created 4 branches with GitHub Actions workflows, each addressing a specific issue:

1. **#15** - Automated Linting Workflow (`feat/github-actions-linting`)
2. **#17** - Dependabot Configuration (`feat/dependabot-config`)
3. **#18** - Security Scanning (`feat/security-scanning`)
4. **#19** - Stale PR Cleanup (`feat/stale-pr-cleanup`)

All branches have been pushed to `origin`. You can create PRs using one of the methods below.

## Option 1: Create PRs via GitHub CLI (Recommended)

First, authenticate if needed:
```bash
gh auth login
```

Then create the PRs:
```bash
# PR #1: Linting
gh pr create --base main --head feat/github-actions-linting \
  --title "[HIGH] Add Automated Linting Workflow" \
  --body "## Summary

Adds a dedicated GitHub Actions workflow for automated linting.

## Changes

- Creates \`.github/workflows/lint.yml\`
- Runs ESLint on every PR and push to main/develop
- Comments on PRs with lint results
- Blocks merge if linting fails

## Related

Closes #15"

# PR #2: Dependabot
gh pr create --base main --head feat/dependabot-config \
  --title "[HIGH] Enable Dependabot for Dependency Updates" \
  --body "## Summary

Enables Dependabot for automated dependency updates.

## Changes

- Creates \`.github/dependabot.yml\`
- Configures Dependabot for npm dependencies
- Configures Dependabot for GitHub Actions
- Weekly update schedule (Mondays at 9 AM)
- Groups production and dev dependencies separately

## Related

Closes #17"

# PR #3: Security Scanning
gh pr create --base main --head feat/security-scanning \
  --title "[MEDIUM] Add Automated Security Scanning" \
  --body "## Summary

Adds automated security scanning workflow.

## Changes

- Creates \`.github/workflows/security.yml\`
- Secret scanning using TruffleHog
- Dependency vulnerability scanning with npm audit
- CodeQL analysis for JavaScript security issues
- Runs on every push, PR, and weekly schedule

## Related

Closes #18"

# PR #4: Stale PR Cleanup
gh pr create --base main --head feat/stale-pr-cleanup \
  --title "[LOW] Add Stale PR and Branch Cleanup" \
  --body "## Summary

Adds automation to mark and close stale PRs and issues.

## Changes

- Creates \`.github/workflows/stale.yml\`
- Marks stale PRs after 30 days
- Closes stale PRs after 7 days of being marked stale
- Marks stale issues after 60 days
- Closes stale issues after 14 days
- Exempts important labels

## Related

Closes #19"
```

## Option 2: Create PRs via GitHub Web UI

Visit these URLs to create PRs:

1. **Linting**: https://github.com/james-frankel-123/automate-my-blog-frontend/pull/new/feat/github-actions-linting
2. **Dependabot**: https://github.com/james-frankel-123/automate-my-blog-frontend/pull/new/feat/dependabot-config
3. **Security Scanning**: https://github.com/james-frankel-123/automate-my-blog-frontend/pull/new/feat/security-scanning
4. **Stale PR Cleanup**: https://github.com/james-frankel-123/automate-my-blog-frontend/pull/new/feat/stale-pr-cleanup

## What Was Created

### 1. Linting Workflow (`.github/workflows/lint.yml`)
- Runs ESLint on every PR and push to main/develop
- Comments on PRs with lint results
- Fails the workflow if linting errors are found

### 2. Dependabot Configuration (`.github/dependabot.yml`)
- Weekly updates for npm dependencies (Mondays at 9 AM)
- Weekly updates for GitHub Actions
- Groups production and dev dependencies separately
- Limits to 10 open PRs at a time

### 3. Security Scanning (`.github/workflows/security.yml`)
- Secret scanning using TruffleHog
- Dependency vulnerability scanning with npm audit
- CodeQL analysis for JavaScript security issues
- Runs on push, PR, and weekly schedule

### 4. Stale PR Cleanup (`.github/workflows/stale.yml`)
- Marks stale PRs after 30 days, closes after 7 more days
- Marks stale issues after 60 days, closes after 14 more days
- Exempts important labels (work-in-progress, blocked, security, high-priority)
- Runs daily via cron schedule

## Next Steps

1. Create the PRs using one of the methods above
2. Review each PR
3. Merge them one at a time
4. Verify the workflows run correctly after merging
