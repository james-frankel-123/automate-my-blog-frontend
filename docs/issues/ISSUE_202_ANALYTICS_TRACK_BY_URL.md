# Issue #202: Track user analytics based on URL, not email address

**GitHub:** https://github.com/Automate-My-Blog/automate-my-blog-frontend/issues/202

---

## Summary

Track user analytics by **the URL the user enters in the first input field in the first step of the workflow** (the website URL they're analyzing), not by email/user id. Also ensure tracking **does not 401 when the user is logged out**.

"URL" here means the **workflow input URL**: the value from the first step (e.g. `WebsiteAnalysisStepStandalone`), i.e. `websiteUrl` — the site they enter to analyze (e.g. `example.com`) — not the browser's `window.location.href`.

---

## Problem

1. **Current behavior**
   - `AnalyticsContext` ([`src/contexts/AnalyticsContext.js`](../../src/contexts/AnalyticsContext.js)) checks `localStorage.getItem('accessToken')` before sending any event.
   - If there is no token, `trackEvent` and `flushEvents` return early and **never call** `POST /api/v1/analytics/track` or `track-batch`.
   - Comments in code state: *"backend returns 401 without token"*.

2. **Consequences**
   - **No analytics for logged-out users:** We skip sending when there's no token, so anonymous/pre-login usage is invisible and we avoid 401 by not calling the API at all.
   - **Analytics tied to identity, not to "site":** We can't answer "how many users/sessions analyzed this URL?" or "funnel by website URL" without keying on the **first-step input URL** and accepting unauthenticated tracking.

---

## Desired behavior

- **Track by the workflow input URL (step 1 URL)**
  - Every analytics event that happens in the context of a workflow should include the **website URL the user entered in the first step** (when available), e.g. `workflowWebsiteUrl` or `metadata.workflowWebsiteUrl`. Backend can key/aggregate by this URL so analytics is "per site/project" as well as (or instead of) per user/email.
- **No 401 when logged out**
  - Analytics endpoints should accept unauthenticated requests. Store events with at least `sessionId`, `workflowWebsiteUrl` (when provided), and optional `userId` when authenticated. Frontend should send events for both logged-in and logged-out users so tracking never 401s.

---

## Proposed direction

### Backend (separate repo / coordination)

- Allow `POST /api/v1/analytics/track` and `POST /api/v1/analytics/track-batch` **without** a valid JWT (optional auth). Do not return 401 for missing auth on these endpoints.
- Persist/associate events with:
  - `workflowWebsiteUrl` (or equivalent) when present — the URL from the first workflow step.
  - `sessionId`, and optionally `userId` when authenticated.

### Frontend (this repo)

1. **Include workflow website URL in events**
   - When building analytics events, include the **URL from the first step of the workflow** (e.g. `websiteUrl` from `WorkflowModeContext` / `WebsiteAnalysisStepStandalone`). Expose it in a consistent field such as `workflowWebsiteUrl` or `metadata.workflowWebsiteUrl` so the backend can key by it. Use it wherever the workflow context is available (dashboard, workflow steps, etc.).

2. **AnalyticsContext**
   - Remove the `hasToken` guard in `trackEvent` and `flushEvents` so we **always** queue and send events (no 401 for logged-out users once backend allows unauthenticated tracking).
   - Keep `userId: user?.id || null` when logged in. Add `workflowWebsiteUrl` (or pass it in metadata) when available — e.g. by consuming workflow context in the provider or by having callers pass it into `trackEvent`/metadata.

3. **Where the step-1 URL lives**
   - `WorkflowModeContext` holds `websiteUrl` (and `setWebsiteUrl`). The first workflow step is `WebsiteAnalysisStepStandalone`, which uses that value. Analytics should read or receive this URL and attach it to every relevant event.

4. **API client & docs**
   - No change needed for `makeRequest` (it already omits `Authorization` when there's no token). Update [docs/ANALYTICS_INSTRUMENTATION_STATUS.md](../ANALYTICS_INSTRUMENTATION_STATUS.md) (and any API spec) to state that analytics is keyed by **workflow input URL** and session, and that unauthenticated tracking is allowed (no 401).

---

## Acceptance criteria

- [ ] Events include the **workflow website URL** (the URL from the first input in step 1) when that value is available (e.g. `workflowWebsiteUrl` or `metadata.workflowWebsiteUrl`).
- [ ] Logged-out users: frontend sends analytics events to the backend without 401.
- [ ] Backend accepts unauthenticated POSTs to analytics track/track-batch and stores/keys events by workflow URL and session (and optionally user when provided).
- [ ] No regression: logged-in user tracking still works; events still include `userId` when logged in.

---

## References

- `src/contexts/WorkflowModeContext.js` – `websiteUrl` (first-step input URL)
- `src/components/Workflow/steps/WebsiteAnalysisStepStandalone.js` – first step, uses `websiteUrl` / `setWebsiteUrl`
- `src/contexts/AnalyticsContext.js` – `trackEvent`, `flushEvents`, `hasToken` guard
- `src/services/api.js` – `trackEvent`, `trackEventBatch`
- `docs/ANALYTICS_INSTRUMENTATION_STATUS.md` – current "sends only when authenticated" note
- `docs/frontend-ux-analytics-plan.md` – analytics event shapes
