# Guidance for Claude AI Coding Agents

This file tells Claude (and other AI coding agents) how to behave when working in this repository. Follow it so changes align with the project and with **GitHub best practices**.

---

## GitHub Best Practices

### Branching

- **Branch from `main`** and keep branches short-lived.
- **Use descriptive branch names** that match the repo’s CI triggers:
  - `feat/<short-description>` — new features (e.g. `feat/enhanced-content-job-stream`)
  - `fix/<short-description>` — bug fixes (e.g. `fix/sse-reconnect`)
  - `docs/<short-description>` — documentation only
  - `chore/<short-description>` — tooling, deps, config (e.g. `chore/update-deps`)
- **One logical change per branch.** Split large work into smaller PRs when possible.

### Commits

- **Write clear, atomic commit messages.** Prefer conventional style when it fits:
  - `feat: add job stream SSE handler`
  - `fix: parse SSE event data safely`
  - `docs: update API spec for streaming`
  - `chore: bump playwright`
- **First line ≤ 72 characters;** add a body only when it adds context.
- **Don’t commit** secrets, `.env`, or build artifacts. Respect `.gitignore`.

### Pull Requests

- **Open PRs against `main`.** Do not push directly to `main`.
- **Keep PRs focused:** one feature or fix per PR when possible. Link related issues.
- **Fill in the PR description:** what changed, why, and how to verify. Use the repo’s PR template if present.
- **Ensure CI passes** (lint, unit tests, E2E) before requesting review. Fix failures; don’t disable checks without team agreement.
- **Prefer small, reviewable diffs.** Break up “mega-PRs” into a series of smaller PRs where it makes sense.

### Issues and References

- **Claim an issue before starting work** by commenting on it (e.g. “I’ll take this”, “Working on this”, or “Starting work in branch `fix/xyz`”). This avoids duplicate work and lets others know the issue is in progress.
- **Reference issues in branches and commits** when relevant (e.g. `fix/foo` for “Fixes #42”, or “Issue #65 Phase 5” in a comment).
- **When proposing fixes,** say “Fixes #N” or “Closes #N” in the PR description so GitHub auto-closes the issue.
- **Don’t open duplicate issues.** Search existing issues and PRs before creating a new one.

### Code Review and Collaboration

- **Assume all code will be reviewed.** Write code you’d be happy for a teammate to maintain.
- **Address review comments** by updating the branch (new commits or rebase, per team preference). Don’t ignore or dismiss feedback without discussion.
- **Don’t force-push to shared branches** (e.g. `main` or a branch others are using) unless the team uses that workflow. Prefer `git pull --rebase` and push normally for your own branch.

---

## Project Conventions

- **Stack:** React frontend, Node 18, npm. Tests: Jest (unit), Playwright (E2E). Lint: ESLint.
- **Run before pushing:** `npm run lint`, `npm test -- --watchAll=false`, and `npm run test:e2e` when you change UI or flows. CI runs these on PRs.
- **Structure:** Put React components under `src/components/`, API clients under `src/services/`, shared state under `src/contexts/`. Keep docs and specs in `docs/`.
- **API and behavior:** Align with `docs/API_SPECIFICATION.md` and any backend streaming/SSE contracts (e.g. job stream events). Don’t change API contracts without updating docs and checking backend compatibility.
- **No secrets in code.** Use `.env` and `.env.example`; never commit real keys or tokens.

---

## Summary for Agents

1. **Branch:** `feat/...` or `fix/...` from `main`; one clear purpose per branch.
2. **Claim issues:** Comment on the issue (e.g. “I’ll take this”) before starting work.
3. **Commit:** Clear, atomic messages; optional conventional style.
4. **PR:** Target `main`, describe changes, reference issues, keep CI green and diffs reviewable.
5. **Repo:** Lint and test before pushing; follow existing structure and docs; keep secrets out of the repo.

Following this keeps the repo consistent and makes it easier for humans and other agents to collaborate.
