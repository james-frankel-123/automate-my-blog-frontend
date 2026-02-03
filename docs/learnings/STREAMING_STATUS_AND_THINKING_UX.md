# Streaming Status & “Thinking GPT” UX

**Goal (from `src/copy/systemVoice.js`):** *Feel like a live agent working for you, thinking at every step and surfacing those thoughts.*

This doc summarizes where streaming stands on `main` and how close the app is to that “thinking GPT” feel.

---

## What’s in place

### 1. **Infrastructure**

- **`streamingUtils.js`** – Normalizes stream chunks (`content` / `text` / `delta` / OpenAI-style), prevents raw JSON in the editor.
- **`jobsAPI.connectToJobStream(jobId, handlers)`** – SSE for jobs: `progress-update`, `step-change`, `scrape-phase`, `complete`, `failed`. Auth via query (`?token=` or `?sessionId=`).
- **`api.connectToStream(connectionId, handlers, { streamUrl })`** – Generic SSE for blog/topics/audience/bundle: `content-chunk`, `onComplete`, etc.
- **`StreamingText`** – Renders accumulated text + blinking cursor (ChatGPT-style).
- **`useStreamingContent`** – Hook that accumulates chunks and exposes `content` / `isStreaming` for any stream using `connectToStream`.

### 2. **Flows that stream (with fallbacks)**

| Flow | Stream behavior | Fallback | “Thinking” UX |
|------|-----------------|----------|----------------|
| **Website analysis** | Job SSE: `progress-update`, `step-change`, **`scrape-phase`** | Poll `GET /jobs/:id/status` | ✅ Step labels + **thought log** (`analysisThoughts`) from `scrape-phase` (phase, message, url). |
| **Blog post** | Try blog SSE first; `content-chunk` → append to editor (typing) | Job (stream or poll) or sync generate | ⚠️ Typing only; no step/thought stream during SSE. Job path shows `currentStep` + progress %. |
| **Topics** | Topic stream → progressive list (“One idea ready, thinking of more…”) | One-shot generate | ✅ Progressive reveal + copy. |
| **Audience** | Audience stream → progressive cards | Template strategies | ✅ Progressive reveal. |
| **Bundle overview** | Bundle stream → typing via `StreamingText` | Non-stream calculate | ✅ Typing effect. |
| **Content (enhanced/job)** | Prefer job stream; same progress/step events as blog job path | Poll status | ⚠️ Progress/step only when job path is used; no thought-level stream. |

### 3. **Where “thinking” is strongest**

- **Website analysis** is the only flow that today shows a **live thought log**: `scrape-phase` events are pushed into `analysisThoughts` and rendered as “What we’re doing” (list of messages). Combined with step labels and progress, this matches the “thinking at every step” goal most closely.

---

## Gaps vs “thinking GPT” goal

1. **Blog/content during SSE** – When the blog **stream** is used, the UI only shows typing. There is no “Outlining…”, “Writing…”, “Polishing…” (or similar) **during** the stream; those labels only appear when the **job** path is used (progress callback). So the “thinking” feel is weaker on the primary happy path (stream).
2. **No thought stream for content generation** – The backend may or may not emit thought-like events for blog generation; the frontend does not consume or display them. Only website analysis has a dedicated `scrape-phase` → thought list.
3. **Unified “system hint”** – The global hint shows the current step (e.g. “Drafting your post…”) but there is no shared “live thought log” for content generation like there is for analysis.
4. **Job stream not in backend spec** – `docs/backend-queue-system-specification.md` describes polling only. The frontend’s job stream (SSE) and `scrape-phase` contract are implemented but not documented in that spec.

---

## Unifying "thinking" in one place

**Can we put all "thinking" pieces in a single location?** Yes. Two viable approaches:

### Option A: Single global location (one DOM slot)

- **Where:** One panel below the header (e.g. extend or sit next to **SystemHint**). When any flow is "thinking," that panel shows: current step, progress %, optional thought list, ETA.
- **How:** Introduce a **ThinkingContext** (e.g. `setThinking({ currentStep, progress, thoughts[], estimatedTimeRemaining, source: 'analysis'|'content'|... })`). Analysis, content gen, and (optionally) topics/audience push updates; only one flow is active at a time. **SystemHint** could stay as the one-line "current step" and this panel could be an expandable/collapsible "What we're doing" with progress + thought log, or the hint strip could expand into this panel when active.
- **Pros:** One place to look; consistent "one voice" for the app.
- **Cons:** When the user is deep in a tab (e.g. scrolled in Posts), the panel at the top can go off-screen unless it's sticky. Then you have a sticky bar that's always visible when thinking—which is good for "live agent" feel but uses vertical space.

### Option B: Shared component, contextual placement

- **Where:** One reusable **ThinkingPanel** component (same design: "Working for you," "Right now: [step]," progress bar, ETA, optional "What we're doing" thought list). Each flow renders it **where the action is**: inside the analysis step card, inside the create-post section, etc.
- **How:** Extract a `<ThinkingPanel currentStep progress thoughts estimatedTimeRemaining workingForYouLabel progressPreamble progressLabel />` (or take labels from `systemVoice.analysis` / `systemVoice.content`). Use it in `WebsiteAnalysisStepStandalone` and `PostsTab`; later in topics/audience if they get progress/thoughts.
- **Pros:** Thinking appears next to the task; no scroll-to-see; one component to maintain; same look and copy everywhere.
- **Cons:** Not literally one DOM location—multiple instances possible, but only one is visible at a time (user isn't analyzing and generating in the same view).

### Recommendation

- **Short term:** Do **Option B**—extract a shared **ThinkingPanel** and use it in analysis and content generation. That gives a single *design* and single *place in the codebase* without changing layout. Keep using **SystemHint** for the one-line "current step" so the strip and the panel stay in sync (flows already call `setHint(stepLabel, 'hint', 0)`).
- **Later, if desired:** Add **ThinkingContext** and a **global** thinking panel (e.g. sticky below SystemHint) that reads from context. Flows would call `setThinking(...)` in addition to (or instead of) rendering the panel locally. Then you can hide the inline ThinkingPanel when the global one is shown, or keep both (global = always visible when active, inline = optional duplicate for context).

So: **can** we put it all in one location? Yes (global panel). **Should** we? Start with one *component* in one *design* used in each flow (Option B); optionally move to one *global* location (Option A) if you want a single always-visible "thinking" strip.

---

## Summary

- **Shipped:** Streaming with fallbacks everywhere; typing effect for blog/bundle; progressive reveal for topics/audience; **website analysis** has a real “thinking” UX (step labels + thought log from `scrape-phase`).
- **Closest to goal:** Website analysis (thought log + steps).
- **To get closer:** (1) During blog SSE, show step/phase labels or a short thought log if the backend sends them; (2) document job stream SSE (and `scrape-phase`) in the backend spec; (3) unify “thinking” UI via a shared ThinkingPanel (Option B), then optionally a single global panel (Option A).

---

*Doc reflects `main` as of 2026-02-03.*
