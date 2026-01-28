---
name: GitHub Actions - Testing
about: Add automated testing workflow
title: '[HIGH] Add Automated Testing Workflow'
labels: ['high-priority', 'ci/cd', 'automation']
assignees: ''
---

## Problem

No automated testing in CI. Breaking changes can be merged without verification.

**Current State:**
- Test scripts exist in `package.json`
- No CI testing
- Manual testing only

**Impact:** High - breaking changes can be merged

## Proposed Solution

### Workflow Setup
- [ ] Create `.github/workflows/test.yml`
- [ ] Run `npm test` on every PR
- [ ] Run tests on push to main
- [ ] Generate coverage report (optional)
- [ ] Comment on PR with test results

### Implementation
- [ ] Ensure test script works: `npm test`
- [ ] Configure test coverage thresholds (optional)
- [ ] Set up test matrix for different Node versions (optional)
- [ ] Add test result badges to README

## Files to Create

- `.github/workflows/test.yml` - **NEW**

## Files to Modify

- `package.json` - Ensure test script exists and works

## Success Criteria

- [ ] Tests run on every PR
- [ ] Test failures block merge (optional)
- [ ] Coverage tracked (optional)

## References

- GitHub Actions Quick Wins: #3
