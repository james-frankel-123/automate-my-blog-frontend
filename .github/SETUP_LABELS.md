# GitHub Labels Setup Guide

This document lists all labels needed for the issue templates. Use this to set up labels in your GitHub repository.

## Quick Setup

### Option 1: Using GitHub CLI (gh)
```bash
# Install GitHub CLI if needed: https://cli.github.com/
gh label create "high-priority" --description "Critical issues that need immediate attention" --color d73a4a
gh label create "medium-priority" --description "Important but not urgent" --color fbca04
gh label create "low-priority" --description "Nice to have, can be deferred" --color 0e8a16
gh label create "bug" --description "Something isn't working" --color d73a4a
gh label create "feature" --description "New feature or request" --color a2eeef
gh label create "enhancement" --description "New feature or enhancement" --color a2eeef
gh label create "ux" --description "User experience improvements" --color c5def5
gh label create "frontend" --description "Frontend related work" --color 1d76db
gh label create "backend" --description "Backend related work" --color 0e8a16
gh label create "security" --description "Security related issues" --color b60205
gh label create "performance" --description "Performance improvements" --color fbca04
gh label create "accessibility" --description "Accessibility improvements (a11y)" --color 1d76db
gh label create "analytics" --description "Analytics and tracking related" --color c5def5
gh label create "refactor" --description "Code refactoring" --color e99695
gh label create "ci/cd" --description "CI/CD pipeline improvements" --color 0052cc
gh label create "automation" --description "Automation improvements" --color 0e8a16
gh label create "documentation" --description "Documentation improvements" --color d4c5f9
gh label create "testing" --description "Testing related" --color f9d0c4
gh label create "dependencies" --description "Dependency updates" --color 0366d6
gh label create "blocked" --description "Blocked by another issue or dependency" --color d73a4a
gh label create "good first issue" --description "Good for newcomers" --color 7057ff
gh label create "help wanted" --description "Extra attention is needed" --color 008672
gh label create "wontfix" --description "This will not be worked on" --color ffffff
gh label create "duplicate" --description "This issue or pull request already exists" --color cccccc
gh label create "invalid" --description "This doesn't seem right" --color e4e669
gh label create "question" --description "Further information is requested" --color d876e3
```

### Option 2: Using GitHub API
You can use the GitHub API to create labels in bulk. See `labels.json` for the full configuration.

### Option 3: Manual Setup
Go to your repository → Settings → Labels → New label, and create each label manually.

## Label Categories

### Priority Labels
- `high-priority` (red) - Critical issues
- `medium-priority` (yellow) - Important but not urgent
- `low-priority` (green) - Nice to have

### Type Labels
- `bug` (red) - Something isn't working
- `feature` (light blue) - New feature
- `enhancement` (light blue) - Enhancement to existing feature
- `question` (purple) - Question or discussion

### Area Labels
- `frontend` (blue) - Frontend work
- `backend` (green) - Backend work
- `ux` (light blue) - User experience
- `security` (dark red) - Security issues
- `performance` (yellow) - Performance
- `accessibility` (blue) - Accessibility (a11y)
- `analytics` (light blue) - Analytics/tracking
- `refactor` (pink) - Code refactoring
- `ci/cd` (blue) - CI/CD
- `automation` (green) - Automation
- `documentation` (purple) - Documentation
- `testing` (peach) - Testing
- `dependencies` (blue) - Dependencies

### Status Labels
- `blocked` (red) - Blocked
- `good first issue` (purple) - Good for newcomers
- `help wanted` (teal) - Needs help
- `wontfix` (white) - Won't fix
- `duplicate` (gray) - Duplicate
- `invalid` (yellow) - Invalid

## Labels Used by Issue Templates

### High Priority Issues
- `high-priority`, `ux`, `frontend` - Job Progress Tracking
- `high-priority`, `analytics`, `frontend` - Analytics Instrumentation
- `high-priority`, `security`, `frontend` - Security Token Storage
- `high-priority`, `ci/cd`, `automation` - GitHub Actions (Linting, Testing, Dependabot)

### Medium Priority Issues
- `medium-priority`, `feature`, `frontend` - Recommendation Board, Project Settings
- `medium-priority`, `refactor`, `frontend` - React Router
- `medium-priority`, `bug`, `frontend` - Autosave Conflict Resolution
- `medium-priority`, `ux`, `frontend` - Error Recovery UI
- `medium-priority`, `performance`, `ci/cd` - Bundle Size Monitoring
- `medium-priority`, `security`, `ci/cd`, `automation` - Security Scanning
- `medium-priority`, `accessibility`, `frontend` - Accessibility Focus Management

### Low Priority Issues
- `low-priority`, `ux`, `frontend` - Empty States, Loading Skeletons
- `low-priority`, `ci/cd`, `automation` - Stale PRs

## Notes

- All color codes are hex values (without #)
- Some labels may already exist in your repository
- You can customize colors and descriptions as needed
- Labels help with filtering, automation, and project management
