---
name: Recommendation Board
about: Build kanban-style recommendation board for user engagement
title: '[MEDIUM] Build Recommendation Board (Kanban UI)'
labels: ['medium-priority', 'feature', 'frontend']
assignees: ''
---

## Problem

Feature completely missing (mentioned in roadmap). No "suggested next actions" to drive user engagement and retention.

**Current State:**
- No kanban/recommendation UI exists
- No "suggested actions" component
- Closest: `SandboxTab.js` has "Content Discovery" but super-admin only

## Proposed Solution

### UI Design
- **Layout:** 3 columns (Now / Next / Later) OR (To Do / In Progress / Done)
- **Cards:** Each recommendation includes:
  - Title
  - Reason/description ("You haven't published in 7 days")
  - CTA button ("Create Post", "View Analytics", etc.)
  - Dismiss button (X)
  - Priority badge (High/Medium/Low)

### Component Structure
```
src/components/Recommendations/
  ├── RecommendationsBoard.js (main container)
  ├── RecommendationCard.js (individual card)
  ├── RecommendationColumn.js (column wrapper)
  └── hooks/
      └── useRecommendations.js (data fetching)
```

### API Requirements
- [ ] `GET /api/v1/recommendations` - Get user recommendations
- [ ] `POST /api/v1/recommendations/:id/dismiss` - Dismiss recommendation
- [ ] `POST /api/v1/recommendations/:id/complete` - Mark as complete

### Integration Points
- [ ] Add "Recommendations" to sidebar menu (`DashboardLayout.js`)
- [ ] Show notification badge if high-priority recommendations exist
- [ ] Support deep linking from emails: `?open=recommendations&id=rec_123`

### Features
- [ ] Optimistic UI updates (immediate feedback, then sync)
- [ ] Auto-refresh every 5 minutes or on user actions
- [ ] Empty states for no recommendations
- [ ] Loading states during fetch

## Files to Create

- `src/components/Recommendations/RecommendationsBoard.js` - **NEW**
- `src/components/Recommendations/RecommendationCard.js` - **NEW**
- `src/components/Recommendations/RecommendationColumn.js` - **NEW**
- `src/components/Recommendations/hooks/useRecommendations.js` - **NEW**

## Files to Modify

- `src/components/Dashboard/DashboardLayout.js` - Add recommendations tab
- `src/services/api.js` - Add recommendation API methods

## Success Criteria

- [ ] 50% of users view recommendations within 7 days
- [ ] 20% click-through rate on recommendations
- [ ] Average time to complete recommendation <5 minutes

## References

- Frontend Audit: Section B.8
- Implementation Plan: Section C
