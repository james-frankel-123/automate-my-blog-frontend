# Issue #261 — Backend Handoff: Guided Funnel Redesign

**Purpose:** Handoff for backend work required to reach 100% match with [GitHub Issue #261](https://github.com/Automate-My-Blog/automate-my-blog-frontend/issues/261) (Guided Funnel Redesign).  
**Frontend status:** Phase 1 complete; funnel UI and flow are implemented. Remaining gaps depend on backend: streaming narrations, analysis edit/confirm API, analysis icons, and terminology rename.  
**Related:** [ISSUE_261_GUIDED_FUNNEL_REDESIGN.md](./issues/ISSUE_261_GUIDED_FUNNEL_REDESIGN.md), [backend-queue-system-specification.md](./backend-queue-system-specification.md).

---

## 1. What the frontend has built

The frontend implements a **single-scroll, sequentially-gated onboarding funnel**:

1. Website URL input → backend analysis job runs → **analysis status updates** (progress) during the job.
2. **Analysis narration** (first-person AI text) → analysis output carousel (cards) → Edit / Confirm & Continue.
3. **Audience narration** → audience segments carousel (user selects one).
4. **Topic narration** → topic carousel (user selects one).
5. **Signup gate** (embedded Register | Sign In) — only for logged-out users.
6. **Content narration** → then funnel completes and user lands on the dashboard.

**User segmentation:**

- **Returning user** (logged in + has completed analysis): skips funnel, goes to dashboard.
- **First-time or logged-out:** sees full funnel; signup gate only when not logged in.

The funnel already uses the **website analysis job** and its **SSE stream**. It subscribes to `analysis-result`, `audiences-result`, `pitches-result`, and `scenarios-result` so that audience segments appear as soon as the backend sends them (and a fallback segment is shown if the API never returns scenarios).

---

## 2. Existing contracts the frontend uses

### 2.1 Website analysis job

| Item | Contract |
|------|----------|
| **Create job** | `POST /api/v1/jobs/website-analysis` with body `{ url: string, sessionId?: string }`. Response: `{ jobId: string }`. |
| **Stream** | `GET /api/v1/jobs/:jobId/stream` (SSE). Auth: Bearer token or `x-session-id` header. |
| **Polling fallback** | `GET /api/v1/jobs/:jobId/status`. When `status === 'succeeded'`, `result` is used (see below). |

See [backend-queue-system-specification.md](./backend-queue-system-specification.md) for full job API.

### 2.2 SSE events the frontend subscribes to (website-analysis job stream)

All event payloads are JSON in `event.data`. The frontend parses `event.data` and passes the object to the corresponding handler.

| SSE event name | Frontend handler | When to emit | Expected payload shape (minimal) |
|----------------|------------------|--------------|-----------------------------------|
| `connected` | `onConnected` | When client connects | `{}` or `{ jobId }` |
| `progress-update` | `onProgress` | Progress during job | `{ currentStep?: string, progress?: number, phase?: string, detail?: string }` |
| `step-change` | `onStepChange` / `onProgress` | Step changes | Same as progress-update |
| `scrape-phase` | `onScrapePhase` | Scrape-phase “thoughts” | `{ message?: string, phase?: string, url?: string }` |
| `scrape-result` | `onScrapeResult` | Scrape finished | Backend-defined |
| `analysis-result` | `onAnalysisResult` | Initial analysis ready | `{ analysis: Analysis }` (see §3.1) |
| `audience-complete` | `onAudienceComplete` | One audience segment ready | `{ audience: Scenario }` |
| `audiences-result` | `onAudiencesResult` | Full list of audience segments | `{ scenarios: Scenario[] }` |
| `pitch-complete` | `onPitchComplete` | One pitch updated | `{ scenario: Partial<Scenario>, index: number }` |
| `pitches-result` | `onPitchesResult` | All pitches ready | `{ scenarios: Scenario[] }` |
| `scenario-image-complete` | `onScenarioImageComplete` | Image URL for one scenario | `{ scenario: Partial<Scenario>, index: number }` |
| `scenarios-result` | `onScenariosResult` | Final scenarios (e.g. with images) | `{ scenarios: Scenario[] }` |
| `complete` | — | Job finished successfully | `{ result?: JobResult }` — frontend uses `result` for final `mapWebsiteAnalysisResult(result)`. |
| `failed` / `error` | — | Job failed | `{ error?: string, message?: string, errorCode?: string }` |
| `rate_limit` | — | Rate limited | `{ error?, errorCode: 'rate_limit', retryable?: true }` |

**Fallback:** The frontend also listens for a generic `message` event with `{ type: string, data?: object }` and routes by `type` (e.g. `type: 'analysis-result'`, `data` as above).

### 2.3 Final job result shape

When the job completes, the frontend uses `complete` event’s `data.result` (or polling’s `result`). It expects a shape that can be passed to `mapWebsiteAnalysisResult(result)`:

- `result.analysis` (or `result` itself) must contain at least: `businessName`, `targetAudience` or `decisionMakers`, `contentFocus`, and optionally `scenarios`, `brandColors`, `keywords`, `contentIdeas`, etc. (see §3.1 and §3.2).

---

## 3. Data shapes the frontend expects

### 3.1 Analysis object (analysis-result / final result.analysis)

Used for analysis cards, fallback audience segment, and topic ideas. Frontend merges this into `stepResults.home.websiteAnalysis`.

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `businessName` | string | Recommended | Displayed on analysis cards. |
| `businessType` | string | No | Fallback "Business". |
| `targetAudience` or `decisionMakers` | string | Recommended | Used for segmentation and fallback audience. |
| `contentFocus` | string | No | Fallback "Content Focus". |
| `brandVoice`, `description`, `brandColors` | — | No | Optional; brandColors can drive theme. |
| `scenarios` | array | No | Audience segments (see §3.2). If missing or empty, frontend shows one fallback segment from `targetAudience`/`contentFocus`. |
| `keywords` | string[] or string | No | Shown on analysis card. |
| `contentIdeas` | array | No | Topic carousel items: `{ title?, description?, topic? }` or strings. |
| `organizationId` | string | No | If needed for PATCH later. |

### 3.2 Scenario (audience segment)

Used in `audiences-result`, `pitches-result`, `scenarios-result`, and in `analysis.scenarios`.

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | string | No | Stable id for list key. |
| `targetSegment` | string | Yes | Card heading. |
| `customerProblem` | string | No | Shown under heading. |
| `pitch` | string | No | Shown on card. |
| `imageUrl` | string | No | Card image; if missing, placeholder text. |
| `businessValue` | string | No | Used by frontend to detect “enhanced” data. |

Frontend accepts both camelCase and snake_case (e.g. `target_segment`) where it reads these fields.

### 3.3 Progress / analysis status updates

For `progress-update` and `step-change`, the frontend shows `currentStep` (or equivalent) in the “Analyzing…” UI. Prefer a short, user-friendly string (e.g. “Reading your pages…”, “Identifying audience segments…”).  
**Terminology (issue #261):** The ticket asks to rename “scraping-thought” to **“analysis-status-update”** in backend and frontend. Please use event/copy that reflects “analysis status update” rather than “scraping thought” or “narration” for this progress phase.

---

## 4. What the backend must add for 100% match

### 4.1 Streaming narrations (SSE endpoints)

The **backend implements narrations as separate SSE endpoints** (not on the job stream). The frontend calls them when each step unlocks:

| Endpoint | When frontend calls it | Query params | Events (payload `{ text }`) |
|----------|------------------------|--------------|-----------------------------|
| `GET /api/v1/analysis/narration/audience` | When user confirms analysis and audience section unlocks | `organizationId` | `audience-narration-chunk`, `audience-narration-complete` |
| `GET /api/v1/analysis/narration/topic` | When user selects an audience and topic section unlocks | `organizationId`, `selectedAudience` | `topic-narration-chunk`, `topic-narration-complete` |
| `GET /api/v1/analysis/narration/content` | When user selects a topic (and passes signup if required) | `organizationId`, `selectedTopic` | `content-narration-chunk`, `content-narration-complete` |

**Frontend behavior:** The frontend uses `autoBlogAPI.connectNarrationStream(type, params, handlers)` to open a fetch-based SSE connection to the above endpoints (with auth or `x-session-id`). It requires `analysis.organizationId` from the website analysis result; the backend must include `organizationId` in the job `result.analysis` so the funnel can request narrations.

**Backend:** OpenAI helpers `generateAudienceNarration`, `generateTopicNarration`, `generateContentGenerationNarration` are implemented; see backend `docs/issue-261-backend-implementation.md`.

### 4.2 Analysis edit & confirm (PATCH organization)

The ticket requires:

- **Edit:** User can edit analysis fields (e.g. business name, target audience, content focus) before confirming.
- **“What changed?” diff** and **LLM-cleaned suggestion** (e.g. “Apply suggestion” that tidies user edits).
- **Confirm & Continue** → persist that the user confirmed and unlock audience step.

**Backend:**

- **PATCH organization** (or equivalent) to:
  - Set `analysis_confirmed_at` when user clicks Confirm.
  - Store `analysis_edited` (boolean) and `edited_fields` (e.g. list of field names or patch payload) when user has edited.
- **Generate cleaned suggestion:** Endpoint or internal call that accepts user-edited analysis fields and returns an LLM-cleaned version (e.g. `generateCleanedEdit`). Frontend calls **POST /api/v1/analysis/cleaned-edit** with body `{ editedFields: { businessName, targetAudience, contentFocus } }` and expects response `{ suggestion?: { businessName?, targetAudience?, contentFocus? } }`. Auth: Bearer token or `x-session-id`.

**Frontend:** Edit button, inline edit UI, diff view, and “Get suggestion” (getCleanedAnalysisSuggestion) are implemented; request body uses `editedFields` wrapper to match backend.

### 4.3 Analysis card icons (generateAnalysisIcons)

The ticket asks for **AI-generated icons** for analysis cards (e.g. business type, target audience, content focus). Today the frontend uses Ant Design icon fallbacks.

- **Backend:** Provide icon URLs (e.g. from `generateAnalysisIcons`) in the analysis payload. For each “card” type (e.g. businessType, targetAudience, contentFocus, keywords), the frontend already supports an `iconUrl` on `AnalysisCard` (see `AnalysisCard.js`: `iconUrl` and `iconFallback`). A natural shape is to include in `analysis` either:
  - A map like `iconUrls: { businessType: string, targetAudience: string, ... }`, or
  - Per-card metadata that includes `iconUrl` so the funnel can pass it when rendering analysis cards.

Frontend will wire these through once the analysis response includes them.

### 4.4 Rename: “scraping-thought” → “analysis-status-update”

- **Backend:** In events, docs, and logs, use **“analysis-status-update”** (or equivalent) instead of “scraping-thought” for progress updates during the website analysis job. This aligns with the ticket’s terminology and avoids calling status updates “narration”.
- **Frontend:** Will rename any remaining “scraping thought” references to “analysis status update” in copy and code.

---

## 5. Summary checklist for backend

| # | Item | Priority | Notes |
|---|------|----------|--------|
| 1 | Ensure `analysis-result` and final `result.analysis` include `scenarios` when audience segments are ready (or emit `audiences-result` / `scenarios-result`) | High | Frontend already subscribes; empty scenarios get a fallback segment. |
| 2 | Emit `audience-narration-chunk` / `audience-narration-complete` (or agreed names) for streaming audience narration | Medium | Enables streaming narration UI. |
| 3 | Emit `topic-narration-chunk` / `topic-narration-complete` for topic narration | Medium | Same. |
| 4 | Emit `content-narration-chunk` / `content-narration-complete` for content-gen narration | Medium | Same. |
| 5 | PATCH organization: `analysis_confirmed_at`, `analysis_edited`, `edited_fields` | Medium | Required for Edit/Confirm flow. |
| 6 | generateCleanedEdit (or equivalent): accept edited analysis fields, return LLM-cleaned suggestion | Medium | For “Apply suggestion” in Edit flow. |
| 7 | generateAnalysisIcons: return icon URLs for analysis cards | Lower | Improves analysis step UX. |
| 8 | Rename “scraping-thought” → “analysis-status-update” in events and docs | Low | Terminology alignment. |

---

## 6. References

- **Frontend issue doc:** [docs/issues/ISSUE_261_GUIDED_FUNNEL_REDESIGN.md](./issues/ISSUE_261_GUIDED_FUNNEL_REDESIGN.md) — full requirements, phases, remaining work.
- **Job queue spec:** [docs/backend-queue-system-specification.md](./backend-queue-system-specification.md) — job creation, polling, retry, cancel.
- **Frontend job stream:** `src/services/jobsAPI.js` — `connectToJobStream(jobId, handlers)`, event names and `parseData(event)`.
- **Frontend analysis mapping:** `src/services/workflowAPI.js` — `mapWebsiteAnalysisResult(result)`, `analysisAPI.analyzeWebsite(websiteUrl, options)`.

If you need specific payload examples or frontend code references for a particular event or API, we can add them to this doc or to the main issue doc.
