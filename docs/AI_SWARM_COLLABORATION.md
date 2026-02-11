# AI Swarm Collaborative Development

This document explains how to use this repository effectively when **multiple AI agents** (or AI + humans) work in parallel. Follow it to reduce conflicts, duplicate work, and keep behavior consistent across agents.

## Principles

1. **Single source of truth** – All agents follow the same conventions (branching, commits, structure). See [CLAUDE.md](../CLAUDE.md) and this doc.
2. **Claim before work** – One agent (or human) per issue. Claim by commenting on the issue and using a dedicated branch.
3. **Small, scoped changes** – One logical change per branch/PR so different agents rarely touch the same files.
4. **Contracts are stable** – API and E2E contracts are documented; don’t change them without updating docs and checking compatibility.

## Work Boundaries (to reduce conflicts)

Prefer having different agents (or sessions) own different **areas** when possible:

| Area | Paths | Focus |
|------|--------|--------|
| **UI / Components** | `src/components/`, `src/styles/` | React components, layout, design system |
| **Data & API** | `src/services/`, `src/contexts/` | API clients, state, streaming |
| **Utils & hooks** | `src/utils/`, `src/hooks/` | Pure helpers, custom hooks |
| **E2E & flows** | `e2e/`, `playwright.config.js` | End-to-end tests, selectors, fixtures |
| **Docs & config** | `docs/`, `.github/`, root config | Docs, CI, dependencies |

- Cross-area changes (e.g. new API + new UI) are fine; coordinate via **one issue and one branch** when they’re coupled.
- If you must touch the same file as another PR, keep the change minimal and rebase from `main` before opening the PR.

## Workflow for Every Agent (or Human)

1. **Before starting**
   - Read [CLAUDE.md](../CLAUDE.md) (branch names, commits, PR rules).
   - Search open issues/PRs for the same feature or fix; if someone else is on it, pick another issue or wait.
2. **Claim the work**
   - Comment on the issue (e.g. “Working on this in branch `fix/xyz`” or “I’ll take this”). If creating a new issue, use a descriptive title and link the branch later.
3. **Branch and implement**
   - Branch from **main**: `feat/short-name` or `fix/short-name`.
   - Make atomic commits; keep the diff small and focused.
   - Run before pushing: `npm run lint`, `npm test -- --watchAll=false`, and `npm run test:e2e` when you change UI or flows.
4. **Open PR**
   - Use the PR template; fill in “What changed”, “How to verify”, and “Fixes #N” (or “Issue #N”) so others and CI are aligned.
   - Ensure CI is green; fix lint/test failures rather than disabling checks.

## Cursor Rules (file-scoped context)

The repo uses `.cursor/rules/` so that when an agent works in a specific area, it gets the right patterns without loading everything:

- **Global** – Applied every session (conventions, structure).
- **E2E** – When editing `e2e/**` or Playwright config (selectors, resilience, test structure).
- **Services** – When editing `src/services/**` (API contracts, error handling).
- **Components** – When editing `src/components/**` (React patterns, design system).

Open files in the relevant area so the right rule is applied.

## API and E2E Contracts

- **API**: [docs/API_SPECIFICATION.md](./API_SPECIFICATION.md). Do not change request/response shapes or endpoints without updating this doc and confirming backend compatibility.
- **E2E**: Selectors and flows are shared. Prefer `data-testid`, `name`, or stable text; avoid relying on fragile class names. When changing UI, update E2E tests in the same PR (see [CONTRIBUTING.md](../CONTRIBUTING.md)).

## Quick Checklist for Each Agent Session

- [ ] Read CLAUDE.md and this doc.
- [ ] Claim the issue (comment) and use a single branch per issue.
- [ ] Stay within one area when possible; avoid editing the same files as another open PR.
- [ ] Run lint and tests before pushing; update E2E if UI changed.
- [ ] PR has description, verification steps, and “Fixes #N” where applicable.

Following this keeps the repo consistent and makes it easier for multiple agents and humans to collaborate without stepping on each other.
