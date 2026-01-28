---
name: Loading Skeletons
about: Add loading skeletons for better perceived performance
title: '[LOW] Add Loading Skeletons for Data Fetching'
labels: ['low-priority', 'ux', 'frontend']
assignees: ''
---

## Problem

Loading state shows spinner but no skeleton UI. Content jumps when data loads, creating poor perceived performance.

**Current State:**
- `loading` state shows spinner
- No skeleton UI
- Content layout shifts when data loads

**Impact:** Low - perceived performance issues

## Proposed Solution

### Skeleton Components
- [ ] Create skeleton components for:
  - Post list items
  - Post cards
  - Table rows
  - Chart placeholders
- [ ] Use Ant Design `Skeleton` component
- [ ] Match skeleton layout to actual content layout

### Components to Update
- [ ] `PostsTab` - Skeleton for post list
- [ ] `DashboardTab` - Skeleton for dashboard cards
- [ ] `AudienceSegmentsTab` - Skeleton for strategy cards
- [ ] Chart components - Skeleton for charts

## Files to Create

- `src/components/Skeletons/PostListSkeleton.js` - **NEW**
- `src/components/Skeletons/CardSkeleton.js` - **NEW**
- `src/components/Skeletons/TableSkeleton.js` - **NEW**

## Files to Modify

- `src/components/Dashboard/PostsTab.js` - Replace spinner with skeleton
- `src/components/Dashboard/DashboardTab.js` - Add skeletons
- Chart components - Add chart skeletons

## Success Criteria

- [ ] No content layout shift on load
- [ ] Skeletons match actual content layout
- [ ] Better perceived performance

## References

- Frontend Audit: Section C.5
