---
name: Empty States
about: Add helpful empty states with guidance
title: '[LOW] Improve Empty States with Guidance'
labels: ['low-priority', 'ux', 'frontend']
assignees: ''
---

## Problem

Empty lists show Ant Design `<Empty />` component but no guidance on "what to do next". New users confused about next steps.

**Current State:**
- Empty states use generic `<Empty />` component
- No actionable guidance
- No "getting started" hints

**Impact:** Low-Medium - new users confused about next steps

## Proposed Solution

### Enhanced Empty States
- [ ] Create custom empty state components with:
  - Clear message about what's missing
  - Actionable next steps
  - Links to relevant sections
  - Example: "No posts yet. Create your first post to get started!"

### Components to Update
- [ ] `PostsTab` - "No posts yet" with "Create Post" button
- [ ] `DashboardTab` - "No projects yet" with "Analyze Website" button
- [ ] `AudienceSegmentsTab` - "No audience segments" with guidance
- [ ] `RecommendationsBoard` - "No recommendations" (when implemented)

### Design
- [ ] Use illustrations/icons
- [ ] Include primary CTA button
- [ ] Add helpful tips or links to docs

## Files to Create

- `src/components/EmptyStates/EmptyState.js` - **NEW** - Reusable empty state component

## Files to Modify

- `src/components/Dashboard/PostsTab.js` - Replace `<Empty />` with custom component
- `src/components/Dashboard/DashboardTab.js` - Add empty state
- `src/components/Dashboard/AudienceSegmentsTab.js` - Add empty state

## Success Criteria

- [ ] All empty states have clear guidance
- [ ] Users know what to do next
- [ ] Empty states include actionable CTAs

## References

- Frontend Audit: Section C.4
