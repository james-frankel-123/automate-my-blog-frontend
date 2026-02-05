# Analytics Instrumentation Status

**Last updated:** January 2026

The frontend audit and [Frontend UX & Analytics Plan](frontend-ux-analytics-plan.md) called out analytics as "minimally used" and listed 10–20 core events to implement. This doc reflects what is **already implemented** vs what is **still to do**.

---

## What’s Already Done

### Infrastructure
- **AnalyticsContext** – Event batching (5s flush or 10 events), `useAnalytics()` with `trackEvent`, `trackPageView`, `trackClick`, `trackFormSubmit`, `trackFunnelStep`, `trackRevenue`. Sends for **all users** (logged in or out); events include `workflowWebsiteUrl` (URL from first workflow step) when available. Backend should accept unauthenticated requests (no 401). See [issue #202](issues/ISSUE_202_ANALYTICS_TRACK_BY_URL.md).
- **Backend** – `POST /api/v1/analytics/track` and `track-batch`; high-priority events (purchase, signup, login, payment_success) sent immediately.

### Events Currently Instrumented

| Category | Events | Where |
|----------|--------|--------|
| **Auth** | `signup_started`, `signup_completed`, `login_completed`, funnel steps (`signed_up`, `first_login`) | RegisterModal, AuthContext, LoginModal |
| **Navigation** | `tab_switched`, `page_view` | DashboardLayout (`handleTabChange`) |
| **Payments** | `payment_completed`, `payment_failed`, `pricing_modal_opened`, funnel steps (view_pricing, signup_initiated, initiate_checkout, checkout_redirect) | DashboardLayout, PricingModal |
| **Website analysis** | `scrape_started`, `scrape_completed`, `scrape_failed`, `analysis_completed` | api.js `analyzeWebsite()`, WebsiteAnalysisStepStandalone |
| **Content** | `content_generation_completed`, `workflow_step_completed`, `content_edit_started`, `content_saved`, `post_edited`, `post_created`, `post_opened`, `workflow_abandoned`, `post_scheduled`, `editor_view_changed`, `content_previewed` | PostsTab |
| **Export / publish** | `publish_clicked`, `export_started`, `export_format_selected`, `export_completed`, `publish_success`, `workflow_completed`, `export_failed` | ExportModal |
| **Errors** | `timeout_occurred`, `api_error` | api.js (request error handling) |

So most of the plan’s “core events” are already covered: auth, tab/page, payments, analysis, content lifecycle, and publish/export.

---

## What’s Left To Do

### 1. **project_created / source_connected**
- **Plan:** After website analysis completes (or when user creates project / connects source), send `project_created` or `source_connected`.
- **Current:** The “Save Project” button in `UnifiedWorkflowHeader` / `DashboardLayout` only updates UI state (show dashboard, hide button, set `hasSeenSaveProject`). It does **not** call `api.saveProjectFromAnalysis()`. So there is no “project created” or “source connected” moment in the app flow to instrument.
- **Options:**  
  - Wire “Save Project” to `saveProjectFromAnalysis()` and on success call `trackEvent('project_created', { projectId, projectName, source: 'website_analysis' })` (and/or `source_connected` if that’s when a source is considered “connected”).  
  - Or, as a lighter step, add something like `project_save_clicked` when the user clicks “Save Project” (even before the API exists).

### 2. **seo_strategy_selected (AudienceSegmentsTab)**
- **Plan:** When user selects an audience/SEO strategy, send `seo_strategy_selected` with strategy and audience segment.
- **Current:** `AudienceSegmentsTab` has no `useAnalytics` / `trackEvent`. Strategy selection is in `setSelectedStrategy` (and related state).
- **To do:** In `AudienceSegmentsTab`, add `useAnalytics()`, and wherever the selected strategy is set (e.g. when user picks a strategy/card), call `trackEvent('seo_strategy_selected', { strategy: selectedStrategyIdOrName, audienceSegment: … })`.

### 3. **Optional / Nice-to-have**
- **analysis_viewed** – Emit when the user actually views analysis results (e.g. when opening the tab or section that shows analysis). We already have `analysis_completed` when analysis finishes; this would distinguish “completed” from “user saw it.”
- **draft_viewed** – Plan used this name; we already send `post_opened`. Renaming or adding an alias is optional.
- **draft_edited** – Plan wanted `editDuration` and `changesCount`. We send `post_edited` and `content_saved`; adding those fields would align with the plan.

### 4. **Backend / dashboard (out of scope for “frontend instrumentation”)**
- Funnel metrics (activation rate, time-to-first-draft, time-to-first-publish) – plan said “calculate in backend” and “display in UserAnalyticsTab.” That’s backend + dashboard work, not more frontend event calls.

---

## Why the Docs Said “Not Done”

The audit summary and roadmap were written against the **full plan** (all events + funnel metrics + backend). So “Analytics instrumentation” was left as “not done” until that full checklist is satisfied. In practice, **most frontend instrumentation is already in place**; the remaining work is:

1. Add **project_created** / **source_connected** (after wiring or defining “Save Project” / project creation).  
2. Add **seo_strategy_selected** in `AudienceSegmentsTab`.  
3. Optionally add **analysis_viewed** and enrich **draft_edited** payload.

---

## Suggested Next Steps

1. **Quick win:** In `AudienceSegmentsTab`, add `useAnalytics()` and `trackEvent('seo_strategy_selected', …)` when the user selects a strategy.  
2. **Product decision:** Decide whether “Save Project” should call `saveProjectFromAnalysis()`; if yes, wire it and add `project_created` (and optionally `source_connected`) on success.  
3. **Docs:** Update [frontend-audit-summary.md](frontend-audit-summary.md) (and any other “goals / work completed” docs) to say analytics instrumentation is **largely done**, with the small list above as remaining items (and link to this file).
