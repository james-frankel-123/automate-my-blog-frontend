# Using the voice profile for blog generation

This doc summarizes what is required for generated blog posts to use the organization’s **voice profile** (from Settings → Voice adaptation).

## Current state

### Frontend (this repo)

- **Voice adaptation UI** at `/settings/voice-adaptation`: users upload writing samples; backend analyzes them and builds an aggregated profile per organization (`GET api/v1/voice-samples/:organizationId/profile`).
- **Blog generation** (Posts tab and onboarding) already passes:
  - `organizationId` in both the **stream** path (`/api/v1/blog/generate-stream`) and the **job** path (`POST /api/v1/jobs/content-generation`).
- **Explicit opt-in:** The frontend now sends `options.useVoiceProfile: true` in:
  - Stream: `workflowAPI.startBlogStream` → `api.generateBlogStream` (body.options).
  - Job: `enhancedContentAPI._buildContentGenerationPayload` (payload.options).
- So the frontend is ready: every generation request that has an `organizationId` asks the backend to use the voice profile when available.

### Backend (expected behavior)

Per [VOICE_ADAPTATION_FRONTEND_HANDOFF.md](./VOICE_ADAPTATION_FRONTEND_HANDOFF.md):

- **Generate endpoints** accept `options.useVoiceProfile` (default `true`).
  - `true`: use the org’s voice profile (from `GET api/v1/voice-samples/:organizationId/profile`) in the prompt.
  - `false`: omit voice profile (generic output).
- When `organizationId` is present and `options.useVoiceProfile !== false`:
  1. Backend should load the aggregated profile for that org (or have it cached).
  2. If a profile exists (e.g. `confidence_score >= 50`), inject its style/vocabulary/structure into the blog generation prompt.
  3. Response can include `voiceAdaptationUsed` and `voiceProfileConfidence` for UI (e.g. “Compare your voice vs generic”).

So for voice profile to **actually** be used in blog generation:

1. **Backend** must implement the above for:
   - `POST /api/v1/blog/generate-stream` (stream path).
   - `POST /api/v1/jobs/content-generation` (job/worker path).
2. **Voice sample worker** must be running so uploaded samples are analyzed and the org profile is updated (Redis + DB).
3. **Frontend** is already passing `organizationId` and `options.useVoiceProfile: true` for both paths.

## Optional: “Compare your voice vs generic”

To support a “your voice vs generic” comparison UI:

- Call `GET /api/v1/enhanced-blog-generation/context/:organizationId` (and with `?useVoiceProfile=false` for generic context).
- Use `metadata.voiceComparisonSupported` to show/hide the comparison control.
- Call generate twice (once with `useVoiceProfile: true`, once with `false`) and show side-by-side, labeled with `voiceAdaptationUsed` / `voiceProfileConfidence`.

## Summary

| Layer        | Requirement |
|-------------|-------------|
| **Frontend** | ✅ Passes `organizationId` and `options.useVoiceProfile: true` on stream and job. No further change required for “use voice profile when available.” |
| **Backend**  | Implement: for both generate-stream and content-generation job, when `organizationId` is set and `useVoiceProfile !== false`, load org voice profile and inject into the generation prompt. |
| **Ops**      | Voice sample analysis worker must be running so org profiles exist after uploads. |
