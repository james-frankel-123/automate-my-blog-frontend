---
name: Analytics Instrumentation
about: Add comprehensive frontend analytics tracking
title: '[HIGH] Implement Frontend Analytics Instrumentation'
labels: ['high-priority', 'analytics', 'frontend']
assignees: ''
---

## Problem

Analytics infrastructure exists (`AnalyticsContext.js`) but is minimally used. We have no visibility into user behavior, funnel conversion, or feature usage.

**Current State:**
- `AnalyticsContext.js` exists with event batching
- Backend endpoints available: `/api/v1/analytics/track` and `/api/v1/analytics/track-batch`
- `useAnalytics()` hook available but rarely used
- No tracking of key user actions

## Proposed Solution

### Core Events to Track (10-20 events)

#### Authentication Events
- [ ] `signup_started` - Track when user starts registration
- [ ] `signup_completed` - Track successful registration
- [ ] `login_completed` - Track successful login

#### Navigation Events
- [ ] `page_view` - Track tab/section navigation
- [ ] Track on every tab switch in `DashboardLayout.handleTabChange()`

#### Content Generation Events
- [ ] `scrape_started` - Track website analysis start
- [ ] `analysis_viewed` - Track when analysis results are viewed
- [ ] `draft_viewed` - Track when draft is opened
- [ ] `draft_edited` - Track content edits (via autosave)

#### Publishing Events
- [ ] `publish_clicked` - Track export button clicks
- [ ] `publish_success` - Track successful exports
- [ ] `publish_failed` - Track failed exports

#### Project Events
- [ ] `project_created` - Track project creation
- [ ] `source_connected` - Track data source connection

#### Recommendation Events (when implemented)
- [ ] `recommendation_viewed`
- [ ] `recommendation_clicked`
- [ ] `recommendation_dismissed`
- [ ] `recommendation_completed`

#### SEO Strategy Events
- [ ] `seo_strategy_selected` - Track strategy selection

### Funnel Metrics
- [ ] Calculate activation funnel: `signup_started` → `signup_completed` → `project_created` → `draft_viewed`
- [ ] Track time-to-value metrics:
  - `time_to_first_draft`
  - `time_to_first_publish`
  - `time_to_second_post`

## Files to Modify

- `src/contexts/AnalyticsContext.js` - Ensure user ID included in all events
- `src/components/Auth/RegisterModal.js` - Add signup tracking
- `src/contexts/AuthContext.js` - Add login/register tracking
- `src/components/Dashboard/DashboardLayout.js` - Add page view tracking
- `src/components/Dashboard/PostsTab.js` - Add content generation tracking
- `src/components/ExportModal/ExportModal.js` - Add publishing tracking
- `src/components/Dashboard/AudienceSegmentsTab.js` - Add strategy tracking

## Success Criteria

- [ ] 100% of key user actions tracked
- [ ] Events visible in backend analytics within 5 seconds
- [ ] Zero analytics errors breaking user flows
- [ ] Funnel metrics available in analytics dashboard

## References

- Implementation Plan: Section A
