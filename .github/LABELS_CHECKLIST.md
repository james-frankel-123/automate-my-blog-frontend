# GitHub Labels Checklist

This document lists all labels required by the issue templates. Use this to verify all labels are set up in your repository.

## Required Labels (Used by Issue Templates)

### Priority Labels (Required)
- [ ] `high-priority` - Critical issues that need immediate attention
- [ ] `medium-priority` - Important but not urgent  
- [ ] `low-priority` - Nice to have, can be deferred

### Type Labels (Required)
- [ ] `bug` - Something isn't working
- [ ] `feature` - New feature or request
- [ ] `enhancement` - New feature or enhancement (optional but recommended)
- [ ] `question` - Further information is requested (optional but recommended)

### Area Labels (Required)
- [ ] `frontend` - Frontend related work
- [ ] `backend` - Backend related work (optional but recommended)
- [ ] `ux` - User experience improvements
- [ ] `security` - Security related issues
- [ ] `performance` - Performance improvements
- [ ] `accessibility` - Accessibility improvements (a11y)
- [ ] `analytics` - Analytics and tracking related
- [ ] `refactor` - Code refactoring
- [ ] `ci/cd` - CI/CD pipeline improvements
- [ ] `automation` - Automation improvements
- [ ] `documentation` - Documentation improvements (optional but recommended)
- [ ] `testing` - Testing related (optional but recommended)
- [ ] `dependencies` - Dependency updates (optional but recommended)

### Status Labels (Optional but Recommended)
- [ ] `blocked` - Blocked by another issue or dependency
- [ ] `good first issue` - Good for newcomers
- [ ] `help wanted` - Extra attention is needed
- [ ] `wontfix` - This will not be worked on
- [ ] `duplicate` - This issue or pull request already exists
- [ ] `invalid` - This doesn't seem right

## Labels Used by Each Issue Template

### High Priority Issues
1. **Job Progress Tracking** → `high-priority`, `ux`, `frontend`
2. **Analytics Instrumentation** → `high-priority`, `analytics`, `frontend`
3. **Security Token Storage** → `high-priority`, `security`, `frontend`
4. **GitHub Actions - Linting** → `high-priority`, `ci/cd`, `automation`
5. **GitHub Actions - Testing** → `high-priority`, `ci/cd`, `automation`
6. **GitHub Actions - Dependabot** → `high-priority`, `ci/cd`, `automation`, `security`

### Medium Priority Issues
7. **Recommendation Board** → `medium-priority`, `feature`, `frontend`
8. **React Router** → `medium-priority`, `refactor`, `frontend`
9. **Project Settings UX** → `medium-priority`, `feature`, `frontend`
10. **Email Preferences** → `medium-priority`, `feature`, `frontend`
11. **Autosave Conflict Resolution** → `medium-priority`, `bug`, `frontend`
12. **Error Recovery UI** → `medium-priority`, `ux`, `frontend`
13. **Bundle Size Monitoring** → `medium-priority`, `performance`, `ci/cd`
14. **Security Scanning** → `medium-priority`, `ci/cd`, `security`, `automation`
15. **Accessibility Focus Management** → `medium-priority`, `accessibility`, `frontend`

### Low Priority Issues
16. **Empty States** → `low-priority`, `ux`, `frontend`
17. **Loading Skeletons** → `low-priority`, `ux`, `frontend`
18. **Stale PRs** → `low-priority`, `ci/cd`, `automation`

## Quick Setup

### Using the Setup Script
```bash
# Make sure GitHub CLI is installed and authenticated
gh auth login

# Run the setup script
./.github/setup-labels.sh
```

### Manual Setup
Go to your repository → Settings → Labels → New label, and create each label with the colors and descriptions from `labels.json`.

### Using GitHub API
You can use the GitHub API to create labels in bulk. See `labels.json` for the full configuration.

## Verification

After setting up labels, verify they exist:
```bash
gh label list
```

Or check in GitHub: Repository → Issues → Labels
