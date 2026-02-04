# Backend handoff: Analytics track by URL, no 401 when logged out

**Related:** [Issue #202](issues/ISSUE_202_ANALYTICS_TRACK_BY_URL.md) · Frontend PR: track analytics by workflow URL and send for all users (logged in or out).

This doc is a handoff to the **backend team** so you can support the new behavior without breaking existing analytics.

---

## What the frontend does now

1. **Sends analytics for all users**  
   The frontend no longer gates on `accessToken`. It sends events for both **logged-in** and **logged-out** users. Requests to the analytics endpoints may include no `Authorization` header.

2. **Includes workflow website URL**  
   Every event includes a **workflow input URL** when available: the URL the user entered in the first step of the workflow (the site they’re analyzing). The frontend sends this in two places for convenience:
   - Top-level: `workflowWebsiteUrl`
   - Inside `metadata`: `metadata.workflowWebsiteUrl`

3. **Payload shape (unchanged except new fields)**  
   Each event in both single and batch requests has the same shape. New/important fields for you:

   | Field | Type | When present | Notes |
   |-------|------|--------------|--------|
   | `userId` | string \| null | When user is logged in | Same as today; may be `null` for anonymous. |
   | `workflowWebsiteUrl` | string \| null | When user has entered a URL in step 1 | The website URL they’re analyzing (e.g. `https://example.com`). Use for keying/aggregation by “site”. |
   | `metadata.sessionId` | string | Always | Client-generated session id (e.g. `session_1709123456789_abc123def`). Stable for the tab session. |
   | `metadata.workflowWebsiteUrl` | string \| null | Same as top-level | Duplicate of top-level for convenience. |

   All other fields (`eventType`, `eventData`, `pageUrl`, `metadata.referrer`, `metadata.conversionFunnelStep`, `metadata.revenueAttributed`, etc.) are unchanged.

---

## What the backend must do

### 1. Accept unauthenticated requests (no 401)

- **Endpoints:**  
  - `POST /api/v1/analytics/track`  
  - `POST /api/v1/analytics/track-batch`

- **Behavior:**  
  - Do **not** return 401 when the request has no `Authorization` header or an invalid/expired token.  
  - Treat auth as **optional** on these two endpoints only: if a valid JWT is present, associate the event(s) with that user; if not, persist the event(s) as anonymous (keyed by `sessionId` and/or `workflowWebsiteUrl` as below).

### 2. Persist and key events correctly

- **When `userId` is present (logged in):**  
  Associate the event with that user as you do today. Also persist `workflowWebsiteUrl` and `metadata.sessionId` when present so you can aggregate by “site” or session.

- **When `userId` is null (logged out):**  
  Still persist the event. Key/associate by:
  - `metadata.sessionId` (required for anonymous session continuity), and  
  - `workflowWebsiteUrl` when present (for “how many sessions analyzed this URL?” and funnel-by-URL).

- **Idempotency / rate limiting:**  
  Optional but recommended: use `sessionId` + event fingerprint (e.g. `eventType` + timestamp bucket) to avoid double-counting if the frontend retries.

### 3. Request/response contract (unchanged)

- **Single event:**  
  `POST /api/v1/analytics/track`  
  Body: JSON object with the event (see example below).  
  Responses: 200/201 on success; 4xx only for bad payload or rate limit, **not** 401 for missing auth.

- **Batch:**  
  `POST /api/v1/analytics/track-batch`  
  Body: `{ "events": [ ... ] }` — array of same event objects.  
  Responses: 200/201 on success; 4xx only for bad payload or rate limit, **not** 401 for missing auth.

---

## Example payloads (from frontend)

**Single event (logged out, with workflow URL):**

```json
{
  "eventType": "page_view",
  "eventData": { "pageName": "dashboard" },
  "pageUrl": "https://app.example.com/dashboard",
  "userId": null,
  "workflowWebsiteUrl": "https://mysite.com",
  "metadata": {
    "sessionId": "session_1709123456789_abc123def",
    "referrer": "https://google.com/",
    "conversionFunnelStep": null,
    "revenueAttributed": null,
    "workflowWebsiteUrl": "https://mysite.com"
  }
}
```

**Single event (logged in, with workflow URL):**

```json
{
  "eventType": "scrape_completed",
  "eventData": { "url": "https://mysite.com" },
  "pageUrl": "https://app.example.com/dashboard",
  "userId": "usr_abc123",
  "workflowWebsiteUrl": "https://mysite.com",
  "metadata": {
    "sessionId": "session_1709123456789_abc123def",
    "referrer": "",
    "conversionFunnelStep": null,
    "revenueAttributed": null,
    "workflowWebsiteUrl": "https://mysite.com"
  }
}
```

**Batch body:**

```json
{
  "events": [
    { "eventType": "page_view", "eventData": { "pageName": "dashboard" }, "pageUrl": "...", "userId": null, "workflowWebsiteUrl": "https://mysite.com", "metadata": { "sessionId": "...", ... } },
    { "eventType": "click", "eventData": { "element": "cta", "label": "Start analysis" }, "pageUrl": "...", "userId": null, "workflowWebsiteUrl": "https://mysite.com", "metadata": { "sessionId": "...", ... } }
  ]
}
```

---

## Checklist for backend

- [ ] `POST /api/v1/analytics/track` and `POST /api/v1/analytics/track-batch` accept requests **without** `Authorization` and do **not** return 401 for missing/invalid auth.
- [ ] Events with `userId: null` are stored and keyed by `metadata.sessionId` and, when present, `workflowWebsiteUrl`.
- [ ] Events with `userId` set are still associated with that user; `workflowWebsiteUrl` and `metadata.sessionId` are stored when present.
- [ ] Existing dashboards/aggregations that assume “one user = one identity” still work; add or extend aggregations by `workflowWebsiteUrl` and/or `sessionId` for anonymous and per-site analytics.

---

## Contacts / references

- **Frontend issue:** [Issue #202](issues/ISSUE_202_ANALYTICS_TRACK_BY_URL.md)  
- **Frontend implementation:** `src/contexts/AnalyticsContext.js` (sends `workflowWebsiteUrl`, no `hasToken` guard); `src/App.js` (provider order: `WorkflowModeProvider` > `AnalyticsProvider`).  
- **API usage:** `src/services/api.js` — `trackEvent()`, `trackEventBatch()`; no auth header is sent when there is no token.
