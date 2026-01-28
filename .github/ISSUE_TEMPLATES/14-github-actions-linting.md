---
name: GitHub Actions - Linting
about: Add automated linting workflow
title: '[HIGH] Add Automated Linting Workflow'
labels: ['high-priority', 'ci/cd', 'automation']
assignees: ''
---

## Problem

No automated linting in CI. Code quality issues caught late or not at all.

**Current State:**
- ESLint configured but not run in CI
- Manual linting only
- "Oops, forgot to lint" moments

**Impact:** High - code quality issues

## Proposed Solution

### Workflow Setup
- [ ] Create `.github/workflows/lint.yml`
- [ ] Run `npm run lint` on every PR
- [ ] Optionally block merge if linting fails
- [ ] Comment on PR with linting results

### Implementation
- [ ] Add lint script if missing: `"lint": "eslint src/"`
- [ ] Configure ESLint rules
- [ ] Add linting to pre-commit hook (optional)
- [ ] Set up auto-fix on commit (optional)

## Files to Create

- `.github/workflows/lint.yml` - **NEW**

## Files to Modify

- `package.json` - Ensure lint script exists

## Success Criteria

- [ ] Linting runs on every PR
- [ ] Linting errors caught before merge
- [ ] Code quality improved

## References

- GitHub Actions Quick Wins: #2
