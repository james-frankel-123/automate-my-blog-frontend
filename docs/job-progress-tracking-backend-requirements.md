# Job Progress Tracking - Backend Requirements

This document outlines the backend API endpoints required for the job progress tracking feature implemented in the frontend.

## Overview

The frontend has been implemented with job progress tracking capabilities. The following backend endpoints need to be implemented to enable full functionality.

## Required API Endpoints

### 1. Get Job Status
**Endpoint:** `GET /api/v1/jobs/:jobId/status`

**Description:** Returns the current status of a job by job ID.

**Response Format:**
```json
{
  "jobId": "string",
  "status": "queued" | "running" | "succeeded" | "failed",
  "progress": 0-100,
  "estimatedTimeRemaining": 0, // seconds
  "currentStep": "string",
  "error": "string", // only present if status is "failed"
  "result": {}, // only present if status is "succeeded"
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

**Example Response:**
```json
{
  "jobId": "job_123456",
  "status": "running",
  "progress": 45,
  "estimatedTimeRemaining": 30,
  "currentStep": "Generating content...",
  "createdAt": "2026-01-28T10:00:00Z",
  "updatedAt": "2026-01-28T10:00:30Z"
}
```

### 2. Retry Failed Job
**Endpoint:** `POST /api/v1/jobs/:jobId/retry`

**Description:** Retries a failed job. Returns a new job ID if a new job is created, or the same job ID if the job is restarted.

**Response Format:**
```json
{
  "jobId": "string",
  "status": "queued",
  "message": "Job queued for retry"
}
```

### 3. Cancel Running Job
**Endpoint:** `POST /api/v1/jobs/:jobId/cancel`

**Description:** Cancels a running or queued job.

**Response Format:**
```json
{
  "jobId": "string",
  "status": "failed",
  "error": "Job cancelled by user",
  "message": "Job cancelled successfully"
}
```

## Job Types

The frontend supports the following job types:
- `website-analysis` - Website analysis operations
- `content-generation` - Blog content generation
- `image-generation` - DALL-E image generation
- `seo-analysis` - SEO analysis operations

## Integration Points

### Website Analysis
When `analyzeWebsite()` is called, it should:
1. Create a job in the queue
2. Return the job ID immediately
3. Process the analysis asynchronously
4. Update job status as it progresses

### Content Generation
When `generateContent()` or `generateEnhancedContent()` is called, it should:
1. Create a job in the queue
2. Return the job ID immediately
3. Process content generation asynchronously
4. Update job status with progress updates

## Frontend Implementation

The frontend includes:
- `JobContext` - Manages job state and polling
- `JobProgressModal` - Displays job progress to users
- `JobStatusBadge` - Shows active jobs count in header
- API methods in `api.js` for job operations

## Polling Behavior

The frontend polls job status every 2-3 seconds (randomized to avoid thundering herd). Polling stops when:
- Job status is "succeeded"
- Job status is "failed"
- An error occurs during polling

## LocalStorage Persistence

Active jobs are stored in localStorage with key `activeJobs`. This allows:
- Job resumption after page refresh
- Tracking jobs across browser sessions
- Recovery from network interruptions

## Next Steps

1. Implement the three API endpoints listed above
2. Modify existing endpoints (`/api/analyze-website`, `/api/generate-content`, etc.) to:
   - Create jobs in queue
   - Return job IDs immediately
   - Process asynchronously
3. Update job status as operations progress
4. Test with the frontend implementation

## Testing

To test the implementation:
1. Start a long-running operation (website analysis or content generation)
2. Verify job ID is returned immediately
3. Check that job status updates are received via polling
4. Test job cancellation
5. Test job retry for failed jobs
6. Verify job resumption after page refresh
