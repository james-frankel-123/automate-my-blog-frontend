---
name: Autosave Conflict Resolution
about: Add conflict resolution for concurrent edits
title: '[MEDIUM] Add Autosave Conflict Resolution'
labels: ['medium-priority', 'bug', 'frontend']
assignees: ''
---

## Problem

Autosave overwrites without checking for concurrent edits. No warnings if someone else edited the same content.

**Current State:**
- Autosave runs every 15s in `PostsTab.js`
- No conflict detection
- No "someone else edited this" warnings
- Data loss risk in team environments

**Impact:** Medium - data loss risk in team environments

## Proposed Solution

### Conflict Detection
- [ ] Track last saved version/timestamp on server
- [ ] Compare local changes with server version before save
- [ ] Detect conflicts when server version is newer than local

### Conflict Resolution UI
- [ ] Show conflict modal when detected:
  - Display both versions (local vs server)
  - Options: "Keep my changes", "Use server version", "Merge manually"
  - Show diff view
- [ ] Auto-save conflict resolution choice

### Backend Requirements
- [ ] Add `lastModified` timestamp to posts
- [ ] Return `lastModified` in GET requests
- [ ] Validate `lastModified` in PUT requests
- [ ] Return conflict error if `lastModified` doesn't match

## Files to Modify

- `src/components/Dashboard/PostsTab.js` - Add conflict detection
- `src/components/Editor/RichTextEditor/RichTextEditor.js` - Handle conflicts
- `src/services/api.js` - Add conflict handling to API calls

## Success Criteria

- [ ] Conflicts detected before overwrite
- [ ] Users can resolve conflicts without data loss
- [ ] Clear UI for conflict resolution

## References

- Frontend Audit: Section C.3
