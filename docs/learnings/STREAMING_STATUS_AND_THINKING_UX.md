# Streaming Status & “Thinking GPT” UX

**Goal (from `src/copy/systemVoice.js`):** *Feel like a live agent working for you, thinking at every step and surfacing those thoughts.*

This doc summarizes where streaming stands on `main` and how close the app is to that “thinking GPT” feel.

---

## What’s in place

### 1. **Infrastructure**

- **`streamingUtils.js`** – Normalizes stream chunks (`content` / `text` / `delta` / OpenAI-style), prevents raw JSON in the editor.
- **`jobsAPI.connectToJobStream(jobId, handlers)`** – SSE for jobs: `progress-update`, `step-change`, `scrape-phase`, plus per-item events for website analysis (`scrape-result`, `audience-complete`, `pitch-complete`, `scenario-image-complete`) and content generation (`context-result`, `blog-result`, `visuals-result`, `seo-result`). Auth via query (`?token=` or `?sessionId=`).
- **`api.connectToStream(connectionId, handlers, { streamUrl })`** – Generic SSE for blog/topics/audience/bundle: `content-chunk`, `onComplete`, etc.
- **`StreamingText`** – Renders accumulated text + blinking cursor (ChatGPT-style).
- **`useStreamingContent`** – Hook that accumulates chunks and exposes `content` / `isStreaming` for any stream using `connectToStream`.

### 2. **Shared ThinkingPanel**

- **`ThinkingPanel`** – Shared component used in both website analysis and content generation. Shows a single latest step line, progress bar, optional ETA, and a pulse indicator. Sticky at top when active. Slim design: no tall step list, just "Working for you · [current step]" with progress.
- **Placement:** Inside `WebsiteAnalysisStepStandalone` and `PostsTab` (content generation) where the action is.
- **Data source:** `currentStep`, `progress`, `thoughts` (from `scrape-phase`), `estimatedTimeRemaining`. Labels from `systemVoice.analysis` / `systemVoice.content`.

### 3. **Flows that stream (with fallbacks)**

| Flow | Stream behavior | Fallback | “Thinking” UX |
|------|-----------------|----------|----------------|
| **Website analysis** | Job SSE: `progress-update`, `step-change`, `scrape-phase`, **per-item**: `scrape-result`, `audience-complete`, `pitch-complete`, `scenario-image-complete` | Poll `GET /jobs/:id/status` | ✅ ThinkingPanel (sticky, slim) + step labels + partial results as they arrive. |
| **Blog post** | Try blog SSE first; `content-chunk` → append to editor (typing) | Job (stream or poll) or sync generate | ✅ Job path: ThinkingPanel with `currentStep` + progress. Partial `blog-result`, `visuals-result`, `seo-result` when using job stream. |
| **Topics** | Topic stream → progressive list (“One idea ready, thinking of more…”) | One-shot generate | ✅ Progressive reveal + copy. |
| **Audience** | Audience stream → progressive cards | Template strategies | ✅ Progressive reveal. |
| **Bundle overview** | Bundle stream → typing via `StreamingText` | Non-stream calculate | ✅ Typing effect. |
| **Content (enhanced/job)** | Job stream with partial results: `context-result`, `blog-result`, `visuals-result`, `seo-result` | Poll status | ✅ ThinkingPanel + partial results; content/visuals/SEO appear incrementally. |

### 4. **Where “thinking” is strongest**

- **Website analysis** – Full job stream with `scrape-phase` thoughts, per-item events (scrape → audiences → pitches → scenario images), and shared ThinkingPanel. Content appears incrementally as each piece completes.
- **Content generation** – Job stream with partial results; ThinkingPanel shows current step and progress; blog, visuals, and SEO appear as they're ready.

---

## Gaps vs "thinking GPT" goal

1. **Blog SSE path** – When the blog **stream** (non-job path) is used, the UI only shows typing. Step labels appear only when the job path is used.
2. **Job stream in backend spec** – The frontend's job stream SSE and event types are implemented. See `docs/backend-queue-system-specification.md` for the documented spec (added in this release).

---

## Summary

- **Shipped:** Shared ThinkingPanel (slim, sticky); streaming with fallbacks everywhere; website analysis per-item stream events; content generation partial results; typing effect for blog/bundle; progressive reveal for topics/audience.
- **Closest to goal:** Website analysis and content generation (both use ThinkingPanel + job stream with incremental updates).
- **Backend spec:** Job stream SSE is documented in `docs/backend-queue-system-specification.md`.

---

## Phase 6 (Issue #89): Streaming polish and error handling

As of 2026-02-04, the following production-hardening features are in place:

- **Auto-reconnect**: Job SSE (`connectToJobStream`) reconnects up to 5 times with exponential backoff when the connection drops.
- **Rate limit handling**: 429 or `rate_limit` errors surface a friendly message ("Service is busy. Please wait a moment and try again.") with `retryable: true` for UI retry buttons.
- **Feature flag**: `REACT_APP_STREAMING_ENABLED=false` disables SSE and falls back to polling without deployment.
- **Streaming indicators**: ThinkingPanel shows "Generating…" when active with no step; StreamingText uses a pulsing cursor during stream.
- **Graceful degradation**: When streaming fails or is disabled, the app falls back to polling (website analysis, content generation).

---

*Doc reflects `main` as of 2026-02-03. Phase 6 added 2026-02-04.*
