---
name: GitHub Actions - Stale PRs
about: Add stale PR and branch cleanup automation
title: '[LOW] Add Stale PR and Branch Cleanup'
labels: ['low-priority', 'ci/cd', 'automation']
assignees: ''
---

## Problem

Old PRs and branches clutter the repository. Unclear what's active.

**Current State:**
- Manual cleanup of old PRs
- Many stale branches
- Unclear what's active

**Impact:** Low - mental overhead, clutter

## Proposed Solution

### Stale Action Setup
- [ ] Use `stale` GitHub Action
- [ ] Configure timeframes (e.g., 30 days stale, 7 days to close)
- [ ] Whitelist important branches (main, develop)
- [ ] Add labels for stale items
- [ ] Auto-close after grace period

### Configuration
- [ ] Set stale threshold (30 days)
- [ ] Set close threshold (7 days after stale)
- [ ] Configure exempt labels
- [ ] Set up notifications

## Files to Create

- `.github/workflows/stale.yml` - **NEW**

## Success Criteria

- [ ] Old PRs marked as stale automatically
- [ ] Stale PRs closed after grace period
- [ ] Repository stays clean

## References

- GitHub Actions Quick Wins: #6
