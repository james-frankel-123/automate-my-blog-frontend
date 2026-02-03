# LLM Streaming Series – Summary

Short summary of the streaming + E2E cleanup work (PRs 101–105) for future contributors.

## What shipped

- **Streaming UX with fallbacks**: Website analysis, audience scenarios, bundle pricing, and blog content can use streaming APIs when available; the app falls back to polling or non-stream endpoints when streaming returns 404 or is unavailable.
- **Single E2E workflow**: E2E runs once in the standalone **E2E Tests** workflow; deploy no longer runs E2E inline (avoids duplicate runs). Branch protection should require **"Run E2E Tests"** for `main`.
- **E2E coverage for fallbacks**: E2E mocks return 404 for stream endpoints so tests exercise the fallback paths. Dedicated describe blocks: PR 101 (blog), PR 102 (audience), PR 103 (bundle), PR 104 (job stream).

## PRs in this series

| PR   | Focus |
|------|--------|
| 101  | Blog post streaming – try stream first, fallback to generate |
| 102  | Audience scenarios streaming – progressive card reveal |
| 103  | Bundle overview streaming – typing effect; non-stream calculate for pricing when 2+ strategies |
| 104  | Job stream – website analysis (and jobs) try stream first, fallback to poll status |
| 105  | CI: remove duplicate E2E from deploy workflow; require "Run E2E Tests" in branch protection |

## Recent additions (Feb 2026)

- **Shared ThinkingPanel** – Slim, sticky "Working for you" panel for analysis and content generation (`src/components/shared/ThinkingPanel.js`).
- **Job stream SSE** – Full event contract documented in `docs/backend-queue-system-specification.md`. Per-item events for website analysis and content partial results.
- **Streaming status** – See `docs/learnings/STREAMING_STATUS_AND_THINKING_UX.md` for current state and "thinking GPT" goal.

## Where to look

- **Stream fallbacks**: `src/services/api.js`, `src/services/workflowAPI.js`, `src/services/jobsAPI.js`
- **E2E stream mocks**: `e2e/mocks/workflow-api-mocks.js` (404 for stream endpoints; non-stream bundle calculate)
- **E2E tests**: `e2e/e2e.spec.js` – describe blocks "PR 101 – Blog streaming", "PR 102 – Audience streaming", "PR 103 – Bundle streaming", "PR 104 – Job stream"
- **Workflows**: `.github/workflows/e2e-tests.yml` (E2E only), `.github/workflows/deploy.yml` (unit tests + build + Vercel), `.github/workflows/README.md` (branch protection setup)

## Branch protection

For `main`, in **Settings → Branches** require status check **"Run E2E Tests"**. Remove **"E2E Tests (Required)"** if present (obsolete deploy job name).
