---
name: GitHub Actions - Dependabot
about: Enable Dependabot for automated dependency updates
title: '[HIGH] Enable Dependabot for Dependency Updates'
labels: ['high-priority', 'ci/cd', 'automation', 'security']
assignees: ''
---

## Problem

Manual dependency management is time-consuming and security vulnerabilities can go unnoticed.

**Current State:**
- Manual dependency updates
- No automated security updates
- "Big bang" updates that break things

**Impact:** High - security and maintenance burden

## Proposed Solution

### Dependabot Setup
- [ ] Enable Dependabot in GitHub repository settings
- [ ] Create `.github/dependabot.yml` configuration
- [ ] Configure update frequency (daily/weekly)
- [ ] Set up grouping for related dependencies

### Configuration
- [ ] Configure for npm dependencies
- [ ] Set update schedule
- [ ] Configure PR labels
- [ ] Set up auto-merge for patch updates (optional)

## Files to Create

- `.github/dependabot.yml` - **NEW**

## Success Criteria

- [ ] Dependabot opens PRs for updates
- [ ] Security updates prioritized
- [ ] Dependency updates automated

## References

- GitHub Actions Quick Wins: #1
