# Frontend Handoff: Switching to Worker Queue for Post Generation and Long-Running Tasks

This document describes how the frontend should switch from synchronous long-running API calls to the **worker queue** for post generation and other heavy operations. Using the queue avoids timeouts, improves reliability, and supports progress, retry, and cancel.

---

## Summary

| Current (sync) | New (worker queue) |
|----------------|--------------------|
| `POST /api/v1/enhanced-blog-generation/generate` → wait for full response | `POST /api/v1/jobs/content-generation` → get `jobId` → poll `GET /api/v1/jobs/:jobId/status` until `succeeded` or `failed` |
| Website analysis (if any sync endpoint exists) | `POST /api/v1/jobs/website-analysis` → poll status |
| Single long request, risk of timeout | Short create request + polling; worker runs in background |

**Base URL for jobs:** `/api/v1/jobs`  
**Auth:** Same as today—authenticated user for content generation; user or `x-session-id` for website analysis.

---

## 1. Content generation (blog post)

### 1.1 Start a job (replace sync generate call)

**Request**

- **Method/URL:** `POST /api/v1/jobs/content-generation`
- **Auth:** Required (same as current enhanced-blog-generation).
- **Headers:** Same as today (e.g. `Authorization: Bearer <token>`).
- **Body:** Same shape as `POST /api/v1/enhanced-blog-generation/generate`:

```json
{
  "topic": { "title": "...", "subheader": "...", ... },
  "businessInfo": { "businessType": "...", "targetAudience": "...", ... },
  "organizationId": "<uuid>",
  "additionalInstructions": "optional string",
  "options": {
    "autoSave": true,
    "status": "draft",
    "includeVisuals": true
  }
}
```

**Responses**

- **201 Created**
  ```json
  { "jobId": "<uuid>" }
  ```
- **400** – Missing/invalid `topic`, `businessInfo`, or `organizationId`.
- **401** – Not authenticated.
- **402** – Insufficient credits (same semantics as current generate).
- **503** – Queue unavailable (e.g. `REDIS_URL` not set). Show "Try again later".

### 1.2 Poll for status and result

**Request**

- **Method/URL:** `GET /api/v1/jobs/:jobId/status`
- **Auth:** Same user (or session where applicable).

**Response (200)**

```json
{
  "jobId": "<uuid>",
  "status": "queued" | "running" | "succeeded" | "failed",
  "progress": 0,
  "currentStep": "Writing...",
  "estimatedTimeRemaining": 60,
  "error": null,
  "errorCode": null,
  "result": null,
  "createdAt": "2026-02-02T12:00:00.000Z",
  "updatedAt": "2026-02-02T12:01:30.000Z"
}
```

When `status === "succeeded"`, `result` contains the content generation output.

### 1.3 Retry / Cancel

- **Retry:** `POST /api/v1/jobs/:jobId/retry` – re-queue failed job
- **Cancel:** `POST /api/v1/jobs/:jobId/cancel` – cancel queued/running job

---

## 2. Website analysis

### 2.1 Start a job

- **Method/URL:** `POST /api/v1/jobs/website-analysis`
- **Auth:** User or `x-session-id` header.
- **Body:** `{ "url": "https://example.com", "sessionId": "optional" }`

### 2.2 Poll / retry / cancel

Same as content generation: `GET /api/v1/jobs/:jobId/status`, `POST .../retry`, `POST .../cancel`.

---

## 3. Recommended frontend flow for post generation

1. **Create job** – `POST /api/v1/jobs/content-generation` with same body as sync generate. Store `jobId`.
2. **Poll** – Poll `GET /api/v1/jobs/:jobId/status` every 2–3 seconds. Show `progress`, `currentStep`, optionally `estimatedTimeRemaining`.
3. **On success** – Use `result.data` and `result.savedPost`. If `result.imageGeneration.needsImageGeneration`, call `POST /api/images/generate-for-blog`.
4. **On failure** – Show `error`/`errorCode`, offer Retry via `POST /api/v1/jobs/:jobId/retry`.
5. **Cancel** – Optional "Cancel" control → `POST /api/v1/jobs/:jobId/cancel`.

---

## 4. Image generation after job completes

Unchanged from current behavior. When the worker returns `result.imageGeneration.needsImageGeneration === true`:

- **Method/URL:** `POST /api/images/generate-for-blog`
- **Body:** `blogPostId`, `content`, `topic`, `organizationId`

---

## 5. Auth and errors

- **Content generation** requires authenticated user.
- **Website analysis** accepts user or `x-session-id` header.
- **503** on create = queue unavailable; show "Service temporarily unavailable".

---

## 6. Frontend checklist

- [x] Replace direct `POST /api/v1/enhanced-blog-generation/generate` with `POST /api/v1/jobs/content-generation`
- [x] Implement polling of `GET /api/v1/jobs/:jobId/status` with progress/step UI
- [x] On success, map `result.data` and `result.savedPost` to existing UI
- [x] After success, if `result.imageGeneration.needsImageGeneration`, call `POST /api/images/generate-for-blog`
- [x] Handle `failed` status: show `error`/`errorCode`, offer retry
- [ ] Optional: add "Cancel" via `POST /api/v1/jobs/:jobId/cancel`
- [x] Website analysis: switch to `POST /api/v1/jobs/website-analysis` (with fallback to sync)
- [x] Handle 503 on job create with clear message

---

*Document version: 2026-02-02. Backend branch: `frontend-worker-queue-handoff`.*
