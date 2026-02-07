# Issue #261: Guided Funnel Redesign — Sequential Narration → Output Flow

**GitHub:** [automate-my-blog-frontend#261](https://github.com/Automate-My-Blog/automate-my-blog-frontend/issues/261)  
**Status:** Phase 1 complete; Phases 2–7 partial / backend pending  
**Type:** Major feature (complete funnel redesign)

---

## One-line summary

Redesign the website analysis → audience → topic flow as a **single-scroll, sequentially-gated funnel** with streaming AI narration between each step, horizontal carousels for outputs, and clear user segmentation (logged-out vs first-time logged-in vs returning).

---

## Terminology (from issue)

| Term | Meaning |
|------|--------|
| **Analysis status updates** | Progress during backend processing ("Scraping pages…", "Analyzing content…"). Stream *during* the job. |
| **Narration** | First-person AI commentary ("I analyzed your website and found…"). Stream *after* each stage completes. |
| **Codebase cleanup** | Rename "scraping-thought" → "analysis-status-update" and avoid calling status updates "narration". |

---

## User journey (high level)

1. **Website input & analysis status updates** → URL form, backend runs, progress indicators.
2. **Analysis narration** (streaming, no typing cursor) → starts *after* analysis completes.
3. **Analysis output** → horizontal carousel (AI-generated icons, white cards), Edit/Confirm.
4. **Audience narration** → streaming.
5. **Audience output** → horizontal carousel (select one).
6. **Topic narration** → streaming.
7. **Topic output** → horizontal carousel (select one).
8. **Signup gate** (embedded card) → *only* for logged-out users.
9. **Content generation narration** → streaming.
10. **Content generation** → existing flow.

**User segmentation:**

- **Logged-out:** Full funnel including signup gate.
- **Logged-in, first analysis:** Full funnel, *no* signup gate (topic → content gen narration).
- **Logged-in, returning (has analysis):** Skip funnel; land on 3-tab dashboard.

---

## Design rules (from issue)

- **Narration:** No typing cursor; min 5s display time; first-person voice; fallback static text + prod alert on failure.
- **Carousels:** Next scrolls right; left arrow only after scrolling right; after all cards viewed, "Next" → "Continue"; Continue scrolls to next narration.
- **Cards:** White backgrounds only; no metadata/tags; AI-generated icons (analysis) or images (audience/topic) with stock fallback.
- **Edit/Confirm:** After analysis carousel; inline edit + "What changed?" diff + LLM-cleaned suggestion; Confirm unlocks audience narration.

---

## Implementation phases (from issue)

| Phase | Focus | Status | Notes |
|-------|--------|--------|-------|
| **1** | Component setup & routing | ✅ Done | All components exist; route and first-time detection in place. |
| **2** | Analysis section | ⚠️ Partial | Carousel + cards + Confirm done; Edit/diff/LLM suggestion and AI icons pending (backend + frontend). |
| **3** | Audience section | ⚠️ Partial | Carousel + selection done; audience narration SSE and streaming UI pending. |
| **4** | Topic section | ⚠️ Partial | Carousel + selection done; topic narration SSE and streaming UI pending. |
| **5** | Signup gate & auth | ✅ Done | SignupGateCard embedded; segmentation; state preserved after signup. |
| **6** | Content generation narration | ⚠️ Partial | Static narration + funnel complete → dashboard; content-gen narration SSE pending. |
| **7** | Polish & testing | ❌ Pending | Loading/error states, animations, mobile, a11y, E2E, analytics. |

---

## Phase 1 — Frontend files to add (from issue)

| File | Purpose |
|------|--------|
| `src/components/Onboarding/OnboardingFunnelView.js` | Root orchestrator; section unlock state; first-time vs returning. |
| `src/components/Onboarding/WebsiteInputSection.js` | URL form + analysis status updates (no narration here). |
| `src/components/Onboarding/StreamingNarration.js` | Reusable streaming narration; **no typing cursor**; min display time; fallback. |
| `src/components/Onboarding/CardCarousel.js` | Horizontal carousel; Next/Continue; left arrow after scroll. |
| `src/components/Onboarding/AnalysisCard.js` | White card; AI icon + fallback; editable. |
| `src/components/Onboarding/AudienceCard.js` | White card; image; selection state. |
| `src/components/Onboarding/TopicCard.js` | White card; image; selection state. |
| `src/components/Onboarding/SignupGateCard.js` | Embedded Register \| Sign In; only for logged-out. |
| `src/components/Onboarding/EditConfirmActions.js` | Edit / Confirm; LLM suggestion for cleaned edits. |

---

## Backend / full-stack (from issue)

- **SSE:** New events for audience/topic/content-gen narration chunks and complete.
- **Rename:** "scraping-thought" → "analysis-status-update" (backend + frontend).
- **OpenAI:** generateAudienceNarration, generateTopicNarration, generateContentGenerationNarration, generateCleanedEdit, generateAnalysisIcons.
- **DB:** analysis_confirmed_at, analysis_edited, edited_fields on organizations.
- **API:** PATCH organization for analysis edit/confirm.

---

## Progress & current state

*Last updated: 2026-02-07*

### Done (matches ticket)

| Requirement | Implementation |
|-------------|-----------------|
| **User journey (all 10 steps)** | Website input → analysis status (ThinkingPanel) → analysis narration → analysis carousel → Edit/Confirm → audience narration → audience carousel → topic narration → topic carousel → signup gate (if logged out) → content narration → DashboardLayout. |
| **User segmentation** | Logged-out: full funnel + SignupGateCard. Logged-in first-time: full funnel, no signup. Returning (has analysis): skip funnel, show dashboard. |
| **Routing** | `/onboarding` or `!isReturningUser` → OnboardingFunnelView; returning → DashboardLayout. |
| **Phase 1 components** | All exist: OnboardingFunnelView, WebsiteInputSection, StreamingNarration, CardCarousel, AnalysisCard, AudienceCard, TopicCard, SignupGateCard, EditConfirmActions. |
| **Narration UX** | No typing cursor; min 5s display; first-person copy; fallback text. Content is static (see Remaining). |
| **Carousels** | Next scrolls right; left arrow after scroll; "Next" → "Continue" when all viewed; Continue triggers callback. |
| **Cards** | Theme-aware (light/dark); elevated background; Ant icon fallback on analysis; image + fallback on audience/topic. |
| **Analysis status** | URL form + progress during job (ThinkingPanel); no "narration" used for status. |
| **Audience when API has no scenarios** | Fallback segment from analysis; funnel also subscribes to `onAudiencesResult` / `onPitchesResult` / `onScenariosResult` so streamed scenarios appear. |

### Partial (needs work for 100%)

| Requirement | Current state | Gap |
|-------------|---------------|-----|
| **Edit / Confirm (Phase 2)** | Confirm & Continue only. | Edit button not wired (`onEdit` not passed). No inline edit UI, "What changed?" diff, or LLM-cleaned suggestion. |
| **Narration source** | All narrations are static strings in the frontend. | Ticket expects streaming narration from backend (SSE) for audience, topic, content-gen. |
| **Analysis icons** | Analysis cards use Ant Design icon fallback only. | Ticket: AI-generated icons (backend `generateAnalysisIcons`) + fallback. |
| **Codebase rename** | "Scraping thought" / status naming may still exist. | Ticket: rename to "analysis-status-update"; avoid calling status "narration". |

### Not done (backend / later phases)

| Area | Ticket requirement |
|------|--------------------|
| **Backend SSE** | New events for audience/topic/content-gen narration chunks and complete. |
| **Backend rename** | "scraping-thought" → "analysis-status-update". |
| **Backend OpenAI** | generateAudienceNarration, generateTopicNarration, generateContentGenerationNarration, generateCleanedEdit, generateAnalysisIcons. |
| **Backend DB/API** | analysis_confirmed_at, analysis_edited, edited_fields; PATCH organization for edit/confirm. |
| **Phase 7** | Loading/error states, animations, mobile, a11y, E2E, analytics. |

---

## Remaining work to 100% match

Use this list to close gaps until the implementation matches the ticket.

### Frontend (this repo)

- [x] **Wire Edit** — Pass `onEdit` from OnboardingFunnelView to EditConfirmActions; show Edit button.
- [x] **Inline edit UI** — After "Edit", show editable fields for analysis (business name, target audience, content focus) via AnalysisEditSection; Apply/Cancel.
- [x] **"What changed?" diff** — AnalysisEditSection shows diff (original vs edited) as user types.
- [x] **LLM-cleaned suggestion (UI)** — "Get suggestion" button in AnalysisEditSection; placeholder message until backend implements generateCleanedEdit.
- [ ] **Streaming narration (UI)** — When backend sends narration SSE, feed chunks into StreamingNarration (content prop or dedicated stream prop). Requires backend events first.
- [ ] **Analysis card icons** — When backend provides `iconUrl` (from generateAnalysisIcons), AnalysisCard already supports it; ensure API response and workflow state pass it through.
- [x] **Rename scraping-thought** — jobsAPI listens for `analysis-status-update` (preferred) and `scraping-thought` (legacy); useNarrativeStream doc updated.
- [ ] **Phase 7 polish** — Loading/error states, animations, mobile layout, a11y, E2E tests, analytics as per ticket.

### Backend / full-stack (other repo or services)

- [ ] **SSE narration events** — Emit audience/topic/content-gen narration chunks and completion on the job stream (or dedicated narration stream).
- [ ] **Rename scraping-thought** — Use "analysis-status-update" in events and docs.
- [ ] **generateAnalysisIcons** — Return icon URLs for analysis cards.
- [ ] **generateCleanedEdit** — Accept user-edited analysis fields; return LLM-cleaned suggestion.
- [ ] **generateAudienceNarration / generateTopicNarration / generateContentGenerationNarration** — Produce first-person narration text (streamed or one-shot) for each step.
- [ ] **DB & PATCH org** — analysis_confirmed_at, analysis_edited, edited_fields; PATCH organization for analysis edit/confirm.

### Verification

- [ ] All 10 journey steps work with backend-driven narrations and scenarios.
- [ ] Edit → diff → LLM suggestion → Confirm flow works when backend is ready.
- [ ] Returning user skips funnel; first-time and logged-out see full flow.
- [ ] Phase 7 checklist (loading, errors, mobile, a11y, E2E, analytics) signed off.

---

## Next steps

1. **Backend:** Implement narration SSE and OpenAI helpers (see Remaining work); deploy.
2. **Frontend:** Connect streaming narration and analysis icons once backend is available; wire generateCleanedEdit when API exists.
3. **Polish:** Phase 7 (loading, errors, mobile, a11y, E2E, analytics).

---

*Doc created from [GitHub issue #261](https://github.com/Automate-My-Blog/automate-my-blog-frontend/issues/261).*
