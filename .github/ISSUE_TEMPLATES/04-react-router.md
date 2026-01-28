---
name: React Router Implementation
about: Add React Router for proper URL state and navigation
title: '[MEDIUM] Implement React Router for URL State Management'
labels: ['medium-priority', 'refactor', 'frontend']
assignees: ''
---

## Problem

No routing library means no shareable URLs, no browser back/forward, and tab state is lost on refresh.

**Current State:**
- Single-page app with tab-based navigation
- Uses scroll-based section navigation with Intersection Observer
- No React Router or routing library
- Tab state lost on page refresh

**Impact:** Medium - poor UX for bookmarking, sharing, navigation

## Proposed Solution

### Implementation Steps
- [ ] Install `react-router-dom`
- [ ] Define routes for main sections:
  - `/` or `/dashboard` - Dashboard/Home
  - `/audience` - Audience Segments
  - `/posts` - Posts/Content
  - `/settings` - Settings
  - `/recommendations` - Recommendations (when implemented)
- [ ] Convert tab navigation to route navigation
- [ ] Add deep linking support for:
  - `/posts/:postId` - Open specific post
  - `/recommendations/:id` - Open specific recommendation
  - Query params for filters, search, etc.
- [ ] Preserve scroll position on navigation
- [ ] Add browser back/forward support

### Migration Strategy
- [ ] Keep existing Intersection Observer for scroll-based highlighting
- [ ] Map routes to existing tab system
- [ ] Update `DashboardLayout` to use routes instead of tab state
- [ ] Test all navigation flows

## Files to Modify

- `package.json` - Add `react-router-dom` dependency
- `src/App.js` - Add Router wrapper
- `src/components/Dashboard/DashboardLayout.js` - Convert to route-based navigation
- All tab components - Update navigation calls

## Considerations

- Need to maintain backward compatibility with existing URLs
- Consider URL structure carefully (nested routes vs flat)
- May need to update deep link handling

## References

- Frontend Audit: Section C.2
