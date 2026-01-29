# GitHub issues from the usability proposal (PR #47)

**Audience:** People who are *not* marketers—vibe coders, small businesses, solopreneurs. They don’t know marketing. All copy and issue descriptions use plain language: problem-solving, results, and business impact. No acronyms or industry buzzwords.

## How to create these on GitHub

1. **Script (recommended):** From the repo root, run `./scripts/create-usability-proposal-issues.sh`. Requires [GitHub CLI](https://cli.github.com/) and `gh auth login`.
2. **Manual:** Open your repo on GitHub → Issues → New issue. Copy each **Title** and **Body** below into a new issue.
3. **CLI:** Run `gh issue create --title "…" --body-file <file>` for each issue using the bodies below.

There are **6 issues** below. You can create them in any order; Issues 1 and 6 are good starting points.

---

## Issue 1: One consistent voice across the app

**Title:** `[UX] One consistent voice across the app so it feels like one helpful person`

**Body:**

**Context:** From the usability proposal (PR #47). Our users are not marketers—they’re builders, small businesses, and solopreneurs. The app should sound like one helpful person, not a generic tool.

**Goal:** Give the product one personality: helpful, confident, and a bit warm. All copy in plain language—no industry buzzwords or acronyms. Focus on what we’re doing for them and what happens next.

**Tasks:**
- Add a single source of truth for copy (e.g. `src/copy/systemVoice.js` or `src/copy/`) with keys for: step messages, progress text, empty states, errors, toasts.
- Replace current strings with this voice in: `UnifiedWorkflowHeader.js`, `WebsiteAnalysisStepStandalone.js`, `TopicSelectionStep-v2.js`, `ContentGenerationStep-v2.js`, `ProgressiveHeaders.js`, and anywhere we show success/info messages.
- Example swaps (tone, not necessarily final copy):
  - Headers: “Your next post starts here” / “We’ve got your site—now we’ll match it to your audience” instead of “Let’s Create Your Perfect Blog Post.”
  - Progress: “Reading your site and voice…” / “Checking what’s working for others in your space…” instead of “Analyzing website content…” / “Analyzing competitor keywords…”
  - Topics: “Here’s what we think will resonate with [audience] right now” instead of “Based on your business analysis, here are high-impact blog post ideas.”
  - Success: “We’ve got the full picture. Pick your audience next.” instead of “Website analysis completed successfully!”

**Acceptance:** Someone could say “it gets my business” and the copy sounds like one consistent voice, in language that doesn’t intimidate.

---

## Issue 2: Suggest next steps so the app feels one step ahead

**Title:** `[UX] Suggest next steps so the app feels one step ahead`

**Body:**

**Context:** From the usability proposal (PR #47). Users are not marketers; they need clear “what do I do next?” guidance without jargon.

**Goal:** Make it feel like the app is one step ahead: after analysis, after picking an audience, on topic cards, and when they come back. Use existing `WorkflowModeContext` and `stepResults` where possible.

**Tasks:**
- **After website analysis:** One line that uses what we learned (e.g. audience or business type): “Ready to create something for [audience]?” or “Your audience ‘[name]’ is a great fit for the next post—want to start one?” (in DashboardTab or UnifiedWorkflowHeader).
- **After they pick an audience:** e.g. “We’ve got 3 topic ideas that match [segment]. Generate them?” with a one-click path to generate.
- **On each topic card:** A short “Why we suggested this” (e.g. “Trending in your niche,” “Matches what you’re already saying”) so it feels chosen, not random. Plain language only.
- **When they come back:** If we have cached analysis: “Welcome back. Last time you were working on [audience/topic]. Continue or start something new?”
- **Later (Recommendation surface):** When we add a Recommendation Board (Now / Next / Later), use the same voice: e.g. “You haven’t published in 7 days—here’s a quick win” with “Use this idea” that drops them into the workflow.

**Implementation note:** Consider a small `SuggestedNextAction` or `RecommendationBar` component that reads from context (and later from a recommendations API). See file map in proposal: DashboardTab.js, UnifiedWorkflowHeader.js, AudienceSegmentsTab.js, PostsTab.js.

**Acceptance:** Users see clear, jargon-free suggestions for what to do next at each step.

---

## Issue 3: Show what’s happening during analysis and generation (no black-box waiting)

**Title:** `[UX] Show what’s happening during analysis and generation (no black-box waiting)`

**Body:**

**Context:** From the usability proposal (PR #47). Analysis and content generation can take 30–60+ seconds. Users shouldn’t sit there with no sense of progress. Audience: non-marketers; keep messaging simple and human.

**Goal:** Make waiting feel intentional and transparent. No buzzwords—just “what we’re doing” and, when possible, how long it usually takes.

**Tasks:**
- **Website analysis:** If the API can expose stages, use them (e.g. “Reading your pages…”, “Checking what others in your space are doing…”, “Synthesizing…”). If not, one honest line: “This usually takes 30–60 seconds. We’re reading your site and building your profile.”
- **Content generation:** Same idea: “Writing your post… This can take a minute.” Optional: a short “What we’re doing” (e.g. “Structuring the post → Matching your voice → Polishing.”) — no jargon.
- **When we have job status:** Use the Job Progress UX from the frontend plan—progress bar, current step, maybe ETA. Copy in the same voice: e.g. “Almost there—finishing the conclusion.”
- **While things load:** Prefer skeleton UIs that look like the real thing (cards, lines of text) so when content appears it feels like a reveal, not a swap.

Keep progress copy in the same voice module as the rest of the app. When we get `GET /api/v1/jobs/:jobId/status`, we can add a small JobProgress context and progress bar or inline status for analysis and generation.

**Acceptance:** Users never feel stuck in a black box; they see what’s happening and have a rough sense of time.

---

## Issue 4: Light motion and transitions so the flow feels continuous

**Title:** `[UX] Light motion and transitions so the flow feels continuous`

**Body:**

**Context:** From the usability proposal (PR #47). Tabs and sections currently switch without much of a through-line. Small, consistent motion can make the flow feel continuous and a bit “magic” without being distracting.

**Goal:** Add light, consistent motion so moving through steps feels like a flow, not a series of hard cuts. Stick to CSS transitions/animations; no heavy animation library.

**Tasks:**
- **Moving to the next step:** When moving to the next step (e.g. “Continue to Audience”), use a short fade or slide (200–400ms) so the next section feels like the next scene.
- **Progressive headers:** When we add a new step to the sticky/progressive header, animate it in (slide down + fade) so the bar feels like it’s growing with them.
- **Topic cards / generated blocks:** Stagger them in (e.g. 50–80ms per card) so the result feels revealed, not dumped.
- **Success moments:** After “analysis complete” or “content generated,” a quick highlight or checkmark (e.g. 300ms) on the relevant header or card.
- **Design system:** In `design-system.css`, add a couple of transition presets (e.g. `--transition-step`, `--transition-reveal`) and use them so motion is consistent.

**Files:** design-system.css (tokens), ProgressiveHeaders.js, DashboardLayout.js (tab content wrapper), topic/content card components.

**Acceptance:** Step changes and reveals feel smooth and intentional; at least one moment (e.g. topics appearing or “We’ve got your site”) feels surprisingly good.

---

## Issue 5: One consistent place for hints, empty states, and errors

**Title:** `[UX] One consistent place for hints, empty states, and errors`

**Body:**

**Context:** From the usability proposal (PR #47). Right now there isn’t a single, predictable spot where the product “says” something—a hint, a confirmation, or a nudge. Users (non-marketers) need one clear place to look for guidance.

**Goal:** Reserve one small, consistent slot where we speak. Same style and voice everywhere; copy from the same voice module. Plain language—no jargon.

**Tasks:**
- **Hint strip:** A thin bar below the main header (or above content) that shows one line at a time: a contextual hint, suggestion, or “We’ve saved your progress.” Same style everywhere.
- **Empty states:** Same voice everywhere: e.g. “We don’t have topics yet—generate some from your audience” with a clear next action.
- **Errors:** Friendly, human messages: “We couldn’t read that URL. Check it and try again?” and “Something went wrong on our side. Try again in a moment.”

**Implementation:** A `SystemHint` or `SystemMessage` component in DashboardLayout that takes context (e.g. “analysis just completed” → “We’ve got your site. Choose your audience next.” for 5s). Reuse for empty states and non-critical errors.

**Acceptance:** There is one consistent “system” slot; hints, empty states, and errors all use the same voice and feel like one entity talking.

---

## Issue 6: Quick wins—copy pass and small UX improvements

**Title:** `[UX] Quick wins: copy pass + “why we suggested this” + one anticipatory line + stagger/animate`

**Body:**

**Context:** From the usability proposal (PR #47). High-impact, low-fuss improvements. Audience: non-marketers; keep language clear and outcome-focused.

**Goal:** Ship a few concrete improvements that make the app feel more human and one step ahead, without big new features.

**Tasks:**
1. **Copy pass:** Swap the 5–10 most visible strings (UnifiedWorkflowHeader steps, analysis progress, main CTA, one success toast) into the new voice. No new UI—just copy. Use plain language, no buzzwords.
2. **“Why we suggested this” on topics:** One short line per topic in the topic selection step (e.g. “Trending in your niche,” “Matches your goals”) so suggestions feel chosen. Plain language only.
3. **One anticipatory line after analysis:** After analysis finishes, one line that uses `businessType` or `targetAudience`: e.g. “Ready to create something for [targetAudience]?”
4. **Stagger topic cards:** When topic cards render, give each one a small `animation-delay` so they don’t all pop in at once.
5. **Animate progressive header steps:** When we add a new step to the sticky/progressive header, slide + fade it in.

**Acceptance:** Visible copy sounds like one voice; topic suggestions feel reasoned; one clear “what’s next” after analysis; topic cards and header steps have light, consistent motion.
