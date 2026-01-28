---
name: Job Progress Tracking
about: Implement job progress tracking for long-running operations
title: '[CRITICAL] Implement Job Progress Tracking with Polling'
labels: ['high-priority', 'ux', 'frontend']
assignees: ''
---

## Problem

Users currently wait up to 60 seconds with no feedback during content generation and website analysis. This creates anxiety, leads to abandonment, and makes error recovery impossible.

**Current State:**
- All API calls are synchronous with 60s timeout
- No job queue or status endpoints
- Users see spinner with no progress updates
- No way to resume jobs after page refresh

**Impact:** High - affects core workflow (content generation)

## Proposed Solution

### Backend Requirements
- [ ] Modify `analyzeWebsite()` to return job ID immediately
- [ ] Modify `generateContent()` to return job ID immediately  
- [ ] Implement job queue with status updates
- [ ] Create endpoints:
  - `GET /api/v1/jobs/:jobId/status` - Get job status
  - `POST /api/v1/jobs/:jobId/retry` - Retry failed job
  - `POST /api/v1/jobs/:jobId/cancel` - Cancel running job

### Frontend Implementation
- [ ] Create `JobContext` with polling logic (2-3s intervals)
- [ ] Create `JobProgressModal` component showing:
  - Progress bar (0-100%)
  - Current step message
  - Estimated time remaining
  - Cancel button (if supported)
- [ ] Create `JobStatusBadge` for header showing active jobs
- [ ] Store active job IDs in `localStorage` for resumption
- [ ] Resume polling for incomplete jobs on app load
- [ ] Add error recovery UI with retry button

### Job Status Model
```typescript
interface JobStatus {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  currentStep?: string;
  error?: string;
  result?: any;
  createdAt: string;
  updatedAt: string;
}
```

## Files to Modify

- `src/services/api.js` - Update API calls to handle job IDs
- `src/services/workflowAPI.js` - Update content generation
- `src/contexts/JobContext.js` - **NEW** - Job polling context
- `src/components/JobProgress/JobProgressModal.js` - **NEW**
- `src/components/JobProgress/JobStatusBadge.js` - **NEW**
- `src/components/Dashboard/DashboardLayout.js` - Integrate job badge

## Success Criteria

- [ ] 90% of users see progress updates for jobs >10s
- [ ] Job resumption works on refresh
- [ ] Retry success rate >80% for failed jobs
- [ ] Users can cancel running jobs

## References

- Frontend Audit: Section C.1, Section D
- Implementation Plan: Section B
