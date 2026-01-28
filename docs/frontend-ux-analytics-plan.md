# Frontend UX & Analytics Implementation Plan

**Date:** January 26, 2026  
**Goal:** Implement frontend instrumentation, UX surfaces for recommendations, analytics visibility, and reliable job progress tracking

---

## A) Frontend Analytics Instrumentation MVP

### Existing Analytics Tooling
**Current State:**
- `AnalyticsContext.js` exists with event batching (5s flush or 10 events)
- Backend endpoint: `POST /api/v1/analytics/track` and `/api/v1/analytics/track-batch`
- `useAnalytics()` hook available but **minimally used** across components
- No third-party analytics (PostHog, Segment, Mixpanel, GA) integrated

**Recommendation:** Keep existing backend analytics, add PostHog for real-time debugging and user session replay (optional but valuable for debugging UX issues).

### Client-Side Events & Properties (10-20 Core Events)

#### 1. Page Navigation Events
```javascript
// Event: page_view
{
  eventType: 'page_view',
  eventData: {
    pageName: 'dashboard' | 'posts' | 'audience-segments' | 'settings',
    referrer: document.referrer,
    timestamp: new Date().toISOString()
  },
  metadata: {
    sessionId: string,
    userId: string | null,
    isAuthenticated: boolean
  }
}
```
**Instrumentation Points:**
- `src/components/Dashboard/DashboardLayout.js:369` (`handleTabChange()`)
- Track on every tab switch

#### 2. Authentication Events
```javascript
// Event: signup_started
{
  eventType: 'signup_started',
  eventData: {
    source: 'modal' | 'gate' | 'pricing_page',
    timestamp: new Date().toISOString()
  }
}

// Event: signup_completed
{
  eventType: 'signup_completed',
  eventData: {
    userId: string,
    hasOrganization: boolean,
    registrationContext: string,
    timestamp: new Date().toISOString()
  }
}

// Event: login_completed
{
  eventType: 'login_completed',
  eventData: {
    userId: string,
    loginContext: 'gate' | 'nav',
    timestamp: new Date().toISOString()
  }
}
```
**Instrumentation Points:**
- `src/components/Auth/RegisterModal.js` - track on form submit start
- `src/contexts/AuthContext.js:207` (`register()` method) - track on success
- `src/contexts/AuthContext.js:158` (`login()` method) - track on success

#### 3. Project/Site Creation Events
```javascript
// Event: project_created
{
  eventType: 'project_created',
  eventData: {
    projectId: string,
    projectName: string,
    source: 'website_analysis' | 'manual',
    timestamp: new Date().toISOString()
  }
}

// Event: source_connected
{
  eventType: 'source_connected',
  eventData: {
    sourceType: 'website_url' | 'cms_integration',
    websiteUrl: string,
    timestamp: new Date().toISOString()
  }
}
```
**Instrumentation Points:**
- `src/components/Dashboard/DashboardTab.js` - after website analysis completes
- `src/services/api.js:156` (`analyzeWebsite()` success callback)

#### 4. Content Generation Events
```javascript
// Event: scrape_started
{
  eventType: 'scrape_started',
  eventData: {
    websiteUrl: string,
    timestamp: new Date().toISOString()
  }
}

// Event: analysis_viewed
{
  eventType: 'analysis_viewed',
  eventData: {
    analysisId: string,
    businessType: string,
    timestamp: new Date().toISOString()
  }
}

// Event: draft_viewed
{
  eventType: 'draft_viewed',
  eventData: {
    postId: string,
    postTitle: string,
    status: 'draft' | 'published',
    timestamp: new Date().toISOString()
  }
}

// Event: draft_edited
{
  eventType: 'draft_edited',
  eventData: {
    postId: string,
    editDuration: number, // seconds
    changesCount: number,
    timestamp: new Date().toISOString()
  }
}
```
**Instrumentation Points:**
- `src/components/Dashboard/PostsTab.js:432` (`handleTopicSelection()` - when generation starts)
- `src/components/Dashboard/PostsTab.js:182` (`loadPosts()` - track when post opened)
- `src/components/Dashboard/PostsTab.js:194` (autosave - track edits)

#### 5. Publishing Events
```javascript
// Event: publish_clicked
{
  eventType: 'publish_clicked',
  eventData: {
    postId: string,
    cmsPlatform: string,
    timestamp: new Date().toISOString()
  }
}

// Event: publish_success
{
  eventType: 'publish_success',
  eventData: {
    postId: string,
    cmsPlatform: string,
    publishMethod: 'export' | 'webhook' | 'api',
    timestamp: new Date().toISOString()
  }
}

// Event: publish_failed
{
  eventType: 'publish_failed',
  eventData: {
    postId: string,
    cmsPlatform: string,
    errorMessage: string,
    timestamp: new Date().toISOString()
  }
}
```
**Instrumentation Points:**
- `src/components/ExportModal/ExportModal.js` - track export button clicks
- `src/services/exportService.js` - track success/failure

#### 6. Recommendation Board Events (New Feature)
```javascript
// Event: recommendation_viewed
{
  eventType: 'recommendation_viewed',
  eventData: {
    recommendationId: string,
    recommendationType: 'next_post' | 'audience_expansion' | 'seo_optimization',
    timestamp: new Date().toISOString()
  }
}

// Event: recommendation_clicked
{
  eventType: 'recommendation_clicked',
  eventData: {
    recommendationId: string,
    action: string,
    timestamp: new Date().toISOString()
  }
}

// Event: recommendation_dismissed
{
  eventType: 'recommendation_dismissed',
  eventData: {
    recommendationId: string,
    reason: 'not_relevant' | 'later' | 'completed',
    timestamp: new Date().toISOString()
  }
}

// Event: recommendation_completed
{
  eventType: 'recommendation_completed',
  eventData: {
    recommendationId: string,
    completionTime: number, // seconds from view to completion
    timestamp: new Date().toISOString()
  }
}
```

#### 7. SEO Strategy Events
```javascript
// Event: seo_strategy_selected
{
  eventType: 'seo_strategy_selected',
  eventData: {
    strategy: 'technical_seo' | 'content_seo' | 'link_building' | 'local_seo',
    audienceSegment: string,
    timestamp: new Date().toISOString()
  }
}
```
**Instrumentation Points:**
- `src/components/Dashboard/AudienceSegmentsTab.js:37` (`setSelectedStrategy()`)

### Funnel Metrics to Expose

**Activation Funnel:**
1. `signup_started` → `signup_completed` → `project_created` → `draft_viewed`
2. Conversion rate at each step
3. Time between steps

**Time-to-Value Metrics:**
- `time_to_first_draft`: Time from signup to first draft generation
- `time_to_first_publish`: Time from signup to first publish
- `time_to_second_post`: Time from first publish to second post (retention indicator)

**Implementation:**
- Calculate in backend analytics queries
- Display in `UserAnalyticsTab.js` (new section)

### Instrumentation Implementation Plan

**Day 1-2: Core Event Tracking**
- Add `trackEvent()` calls to authentication flows
- Add `trackEvent()` calls to content generation flows
- Update `AnalyticsContext` to include user ID in all events

**Day 3-4: Page View & Navigation Tracking**
- Add `trackPageView()` to `DashboardLayout.handleTabChange()`
- Add page view tracking on component mount for key components

**Day 5: Funnel & Publishing Events**
- Add publishing event tracking to `ExportModal`
- Add draft edit tracking to `PostsTab` autosave

**Day 6-7: Testing & Validation**
- Test event batching and flushing
- Verify events in backend analytics dashboard
- Add error handling for analytics failures (don't break app)

---

## B) UX for Long-Running Jobs (Critical)

### Current Approach
**Status:** ❌ **No job tracking**
- All API calls are synchronous with 60s timeout
- No job queue or status endpoints
- Users see spinner with no progress feedback

### Proposed Improvements

#### 1. Unified Job Status Model
```typescript
interface JobStatus {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  currentStep?: string; // "Analyzing website...", "Generating content..."
  error?: string;
  result?: any; // Job result data
  createdAt: string;
  updatedAt: string;
}
```

#### 2. Progress UI Patterns

**Component:** `src/components/JobProgress/JobProgressModal.js` (new)
```javascript
// Shows:
// - Progress bar (0-100%)
// - Current step message
// - Estimated time remaining
// - Cancel button (if supported)
// - Auto-dismisses on success, shows error on failure
```

**Component:** `src/components/JobProgress/JobStatusBadge.js` (new)
```javascript
// Small badge in header showing active jobs
// Click to open JobProgressModal
// Shows count: "2 jobs running"
```

#### 3. Reliable Resumption on Refresh
**Implementation:**
- Store active job IDs in `localStorage`: `activeJobs: string[]`
- On app load, check for active jobs and resume polling
- Show "Resuming job..." message if jobs found

**Location:** `src/contexts/JobContext.js` (new context)

#### 4. Error Recovery Paths
**UI Components:**
- "Retry" button in failed job modal
- "Regenerate section" for partial failures
- "Contact support" link with job ID pre-filled

**API Endpoints Needed:**
- `GET /api/v1/jobs/:jobId/status` - Get job status
- `POST /api/v1/jobs/:jobId/retry` - Retry failed job
- `POST /api/v1/jobs/:jobId/cancel` - Cancel running job

### Implementation Steps

**Step 1: Backend Job Queue Integration**
- Modify `analyzeWebsite()` to return job ID immediately
- Modify `generateContent()` to return job ID immediately
- Backend implements job queue with status updates

**Step 2: Frontend Job Polling**
- Create `JobContext` with polling logic (2-3s intervals)
- Poll `GET /api/v1/jobs/:jobId/status` until complete/failed
- Update UI with progress

**Step 3: Progress UI Components**
- Create `JobProgressModal` component
- Create `JobStatusBadge` for header
- Integrate into `DashboardLayout`

**Step 4: Persistence & Resumption**
- Save job IDs to `localStorage` on job start
- Check for active jobs on app load
- Resume polling for incomplete jobs

**Step 5: Error Handling**
- Show error modal with retry button
- Implement retry logic
- Add support contact link

**Timeline:** 2-3 days for frontend, depends on backend job queue implementation

---

## C) Recommendation Board (Kanban UI)

### Proposed Minimal UI

#### Layout
- **Route:** New route `/app/recommendations` (or tab in sidebar: "Recommendations")
- **Columns:** 3 columns (Now / Next / Later) OR (To Do / In Progress / Done)
- **Cards:** Each recommendation is a card with:
  - Title
  - Reason/description ("You haven't published in 7 days")
  - CTA button ("Create Post", "View Analytics", etc.)
  - Dismiss button (X)
  - Priority badge (High/Medium/Low)

#### Component Structure
```
src/components/Recommendations/
  ├── RecommendationsBoard.js (main container)
  ├── RecommendationCard.js (individual card)
  ├── RecommendationColumn.js (column wrapper)
  └── hooks/
      └── useRecommendations.js (data fetching)
```

#### API Needs
```javascript
// GET /api/v1/recommendations
// Returns:
{
  recommendations: [
    {
      id: string,
      type: 'next_post' | 'audience_expansion' | 'seo_optimization' | 'publish_reminder',
      title: string,
      description: string,
      priority: 'high' | 'medium' | 'low',
      cta: {
        label: string,
        action: string, // 'create_post', 'view_analytics', 'expand_audience'
        params: object
      },
      metadata: {
        projectId?: string,
        postId?: string,
        reason: string
      },
      createdAt: string
    }
  ]
}

// POST /api/v1/recommendations/:id/dismiss
// POST /api/v1/recommendations/:id/complete
```

#### State Management
- Fetch recommendations on component mount
- Optimistic updates: immediately update UI on dismiss/complete, then sync with backend
- Refresh recommendations every 5 minutes or on user action (post created, published, etc.)

#### Integration Points
- Add "Recommendations" to sidebar menu (`DashboardLayout.js:492-508`)
- Show notification badge if high-priority recommendations exist
- Deep link from email: `?open=recommendations&id=rec_123`

### Implementation Plan

**Component Structure**
- Create `RecommendationsBoard` component with 3 columns
- Create `RecommendationCard` component
- Basic layout with mock data

**API Integration**
- Create `useRecommendations` hook
- Integrate `GET /api/v1/recommendations`
- Handle loading/error states

**Actions & Optimistic Updates**
- Implement dismiss action (`POST /api/v1/recommendations/:id/dismiss`)
- Implement complete action (`POST /api/v1/recommendations/:id/complete`)
- Add optimistic UI updates

**Deep Linking & Navigation**
- Add route/tab for recommendations
- Handle deep links from emails
- Add CTA button actions (navigate to relevant section)

**Polish & Testing**
- Add animations (card drag between columns if time permits)
- Test with real recommendation data
- Add empty states

---

## D) Audience + SEO Strategy UX

### Current State
**Where Strategy is Selected:**
- `src/components/Dashboard/AudienceSegmentsTab.js:37` - Customer strategy selection
- Strategy stored in `WorkflowModeContext.selectedCustomerStrategy`
- No dedicated "Project Settings" panel for strategy management

### Proposed UI Surfaces

#### 1. Project Settings Panel
**Location:** New tab or modal accessible from DashboardTab
**Component:** `src/components/ProjectSettings/ProjectSettingsModal.js`

**Settings:**
- **Audience Segment:** Dropdown of available segments (from analysis)
- **SEO Strategy:** Radio buttons (Technical SEO, Content SEO, Link Building, Local SEO)
- **Content Tone:** Select (Expert, Friendly, Insider, Storyteller)
- **CTA Goals:** Multi-select (Lead Generation, Newsletter Signup, Product Demo, etc.)
- **Default Template:** Select (How-to, Problem-Solution, Listicle, Case Study, Comprehensive)

**Data Handling:**
- Store in `projects` table (new `settings` JSONB column)
- Load on project selection
- Save on change (debounced, 2s delay)
- Show defaults based on website analysis if not set

#### 2. Inline Strategy Prompts
**Location:** Content generation flow (`PostsTab.js`)
**Component:** `src/components/StrategyPrompts/StrategyPromptBanner.js`

**Behavior:**
- Show banner if strategy not set: "Set your SEO strategy to optimize content generation"
- Show strategy summary when set: "Using: Content SEO strategy for B2B audience"
- Allow quick edit via dropdown

#### 3. Strategy Validation
- Validate strategy selection before content generation
- Show warning if strategy missing: "Please set your SEO strategy for best results"
- Allow "Generate anyway" option

### Implementation Steps

**Step 1: Project Settings Component**
- Create `ProjectSettingsModal` component
- Add form fields for all settings
- Integrate with `api.updateProjectSettings()`

**Step 2: Strategy Storage**
- Backend: Add `settings` column to `projects` table
- Frontend: Load settings on project load
- Save settings on change (debounced)

**Step 3: Inline Prompts**
- Create `StrategyPromptBanner` component
- Show in `PostsTab` when generating content
- Allow quick strategy selection

**Step 4: Content Generation Integration**
- Pass strategy to content generation API
- Update prompt engine to use strategy
- Track strategy selection in analytics


---

## E) Email/Marketing Support UX

### Deep Link Handling

#### URL Patterns
```
https://automatemyblog.com/?action=open_draft&postId=123
https://automatemyblog.com/?action=open_recommendations&id=rec_456
https://automatemyblog.com/?action=view_metrics&period=week
https://automatemyblog.com/?action=open_project&projectId=789
```

#### Implementation
**Location:** `src/App.js` or `src/components/Dashboard/DashboardLayout.js`

```javascript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action === 'open_draft') {
    const postId = urlParams.get('postId');
    // Navigate to PostsTab and open post
    handleTabChange('posts');
    setSelectedPost(postId);
  } else if (action === 'open_recommendations') {
    const recId = urlParams.get('id');
    // Navigate to recommendations tab
    handleTabChange('recommendations');
    // Highlight specific recommendation
  }
  // ... other actions
  
  // Clean URL after handling
  window.history.replaceState({}, '', window.location.pathname);
}, []);
```

### Preferences Screen

**Component:** `src/components/Settings/EmailPreferencesTab.js` (new tab in SettingsTab)

**Settings:**
- **Email Frequency:** Radio (Daily digest, Weekly summary, Only important, Never)
- **Notification Types:** Checkboxes
  - Draft ready notifications
  - Recommendation alerts
  - Weekly performance summary
  - Product updates
- **Unsubscribe Link:** "Unsubscribe from all emails" button

**API Endpoints:**
- `GET /api/v1/user/email-preferences` - Get current preferences
- `PUT /api/v1/user/email-preferences` - Update preferences
- `POST /api/v1/user/unsubscribe` - Unsubscribe from all

**Implementation:**
- Add new tab to `SettingsTab.js`
- Create `EmailPreferencesTab` component
- Integrate with backend API
- Show confirmation on save

---

## F) Execution Roadmap

### Week 1: MVP Analytics & Job Progress

**Analytics Instrumentation**
- ✅ Add core event tracking (auth, page views, content generation)
- ✅ Update `AnalyticsContext` to include user ID
- ✅ Test event batching and flushing

**Job Progress Tracking**
- ✅ Create `JobContext` with polling logic
- ✅ Create `JobProgressModal` component
- ✅ Integrate job status into content generation flow
- ⚠️ **Blocked on backend job queue** - coordinate with backend team

**Recommendation Board (Basic)**
- ✅ Create `RecommendationsBoard` component
- ✅ Integrate with recommendations API
- ✅ Add to sidebar menu

**Testing & Bug Fixes**
- ✅ Test all new features
- ✅ Fix any issues
- ✅ Deploy to staging

### Polish & Advanced Features (Days 8-14)

**Recommendation Board (Advanced)**
- ✅ Add optimistic updates
- ✅ Implement deep linking
- ✅ Add CTA button actions

**Project Settings & Strategy UX**
- ✅ Create `ProjectSettingsModal`
- ✅ Add strategy selection UI
- ✅ Integrate with content generation

**Email Preferences**
- ✅ Create `EmailPreferencesTab`
- ✅ Integrate with backend API
- ✅ Add deep link handling

**Polish & Performance**
- ✅ Add loading skeletons
- ✅ Improve error messages
- ✅ Optimize bundle size (code splitting if needed)
- ✅ Accessibility audit and fixes

### Follow-ups

**Design Polish:**
- Add animations and transitions
- Improve empty states
- Add tooltips and help text

**Performance:**
- Implement code splitting for large components
- Lazy load recommendation board
- Optimize image loading

**Accessibility:**
- Add ARIA labels
- Implement keyboard navigation
- Focus management in modals

**Experiment Flags:**
- A/B test recommendation board placement
- Test different job progress UI patterns
- Experiment with strategy prompt timing

---

## Risks & Unknowns

### High Risk
1. **Backend Job Queue Not Ready**
   - **Risk:** Job progress tracking depends on backend job queue implementation
   - **Mitigation:** Build frontend with mock job status API, coordinate with backend piece on timeline

2. **Recommendations API Not Designed**
   - **Risk:** Recommendation board needs backend API that may not exist
   - **Mitigation:** Start with mock data, define API contract with backend

### Medium Risk
3. **Analytics Backend Capacity**
   - **Risk:** Increased event volume may overwhelm analytics backend
   - **Mitigation:** Ensure batching works correctly, monitor backend metrics

4. **Deep Link Security**
   - **Risk:** Deep links could expose sensitive data if not properly validated
   - **Mitigation:** Validate all deep link parameters, check user permissions

### Low Risk
5. **Bundle Size Increase**
   - **Risk:** New components may increase bundle size
   - **Mitigation:** Use code splitting, lazy loading for recommendation board

6. **Browser Compatibility**
   - **Risk:** New features may not work in older browsers
   - **Mitigation:** Test in target browsers, use polyfills if needed

---

## Success Metrics

### Analytics Instrumentation
- ✅ 100% of key user actions tracked
- ✅ Events visible in backend analytics within 5 seconds
- ✅ Zero analytics errors breaking user flows

### Job Progress
- ✅ 90% of users see progress updates for jobs >10s
- ✅ Job resumption works on refresh (test with 10 users)
- ✅ Retry success rate >80% for failed jobs

### Recommendation Board
- ✅ 50% of users view recommendations within 7 days
- ✅ 20% click-through rate on recommendations
- ✅ Average time to complete recommendation <5 minutes

### Strategy UX
- ✅ 80% of users set SEO strategy before first content generation
- ✅ Strategy selection reduces content regeneration requests by 30%

