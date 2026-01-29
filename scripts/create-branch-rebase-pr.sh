#!/usr/bin/env bash
# Create feat/ux-anticipatory-suggestions from feat/ux-one-consistent-voice, rebase onto main, push, and open PR.
# Run from repo root (or worktree root). Requires: gh CLI, write access to git dir.
# If the branch already exists elsewhere: checkout main in that worktree, then run this.

set -e
BRANCH="feat/ux-anticipatory-suggestions"
SOURCE_BRANCH="feat/ux-one-consistent-voice"

echo "Fetching and updating main..."
git fetch origin main
git checkout main
git pull origin main

echo "Creating $BRANCH from $SOURCE_BRANCH..."
git checkout -b "$BRANCH" "$SOURCE_BRANCH"

echo "Rebasing onto main..."
git rebase main

echo "Pushing $BRANCH..."
git push -u origin "$BRANCH"

echo "Opening PR..."
gh pr create --base main --head "$BRANCH" --title "feat(ux): anticipatory suggestions — suggest next steps" --body-file scripts/PR_BODY_UX_ANTICIPATORY.md

echo "Done. PR created for $BRANCH."
