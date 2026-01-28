---
name: Bundle Size Monitoring
about: Add bundle size monitoring to prevent bloat
title: '[MEDIUM] Add Bundle Size Monitoring'
labels: ['medium-priority', 'performance', 'ci/cd']
assignees: ''
---

## Problem

No bundle analysis or monitoring. Large dependencies (Ant Design, TipTap, Recharts) could cause performance issues. No code splitting visible.

**Current State:**
- No bundle analysis
- No performance monitoring
- Large dependencies (Ant Design ~500KB+, TipTap, Recharts, Framer Motion)
- No code splitting
- Single bundle

**Impact:** Medium - potential performance issues

## Proposed Solution

### Bundle Analysis
- [ ] Add `webpack-bundle-analyzer` or `source-map-explorer`
- [ ] Generate bundle report in CI
- [ ] Set bundle size limits
- [ ] Alert on size increases

### Code Splitting
- [ ] Implement route-based code splitting
- [ ] Lazy load heavy components (charts, editor)
- [ ] Split vendor chunks
- [ ] Dynamic imports for large dependencies

### Monitoring
- [ ] Add bundle size check to PR workflow
- [ ] Comment on PR with size diff
- [ ] Set size budgets per route/chunk
- [ ] Track bundle size over time

## Files to Create

- `.github/workflows/bundle-size.yml` - **NEW** - Bundle size check workflow

## Files to Modify

- `package.json` - Add bundle analysis scripts
- `src/App.js` - Add lazy loading for routes
- `src/components/Dashboard/Analytics/` - Lazy load chart components
- `src/components/Editor/` - Lazy load editor

## Success Criteria

- [ ] Bundle size tracked in CI
- [ ] PRs show bundle size diff
- [ ] Code splitting implemented
- [ ] Bundle size stays within limits

## References

- Frontend Audit: Section D
- GitHub Actions Quick Wins: #4
