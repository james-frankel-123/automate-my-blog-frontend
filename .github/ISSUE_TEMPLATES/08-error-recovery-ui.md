---
name: Error Recovery UI
about: Add retry buttons and error recovery for failed API calls
title: '[MEDIUM] Add Error Recovery UI for Failed API Calls'
labels: ['medium-priority', 'ux', 'frontend']
assignees: ''
---

## Problem

Errors show `message.error()` but no retry buttons or "try again" CTAs. Users must manually retry operations.

**Current State:**
- Errors displayed via Ant Design `message.error()`
- No retry functionality
- No exponential backoff
- Users must manually retry failed operations

**Impact:** Medium - friction when network issues occur

## Proposed Solution

### Error Recovery Components
- [ ] Create `ErrorRecoveryModal` component
- [ ] Show retry button for failed operations
- [ ] Add "Contact Support" link with error context
- [ ] Implement exponential backoff for retries

### Retry Logic
- [ ] Add retry functionality to:
  - Content generation failures
  - Website analysis timeouts
  - Image generation errors
- [ ] Track retry attempts
- [ ] Show retry count to user
- [ ] Disable retry after max attempts

### Error Context
- [ ] Include error details in support link
- [ ] Include user context (post ID, operation type, etc.)
- [ ] Pre-fill support form with error details

## Files to Create

- `src/components/ErrorRecovery/ErrorRecoveryModal.js` - **NEW**
- `src/utils/retryUtils.js` - **NEW** - Retry logic with backoff

## Files to Modify

- `src/services/api.js` - Add retry wrapper
- `src/components/Dashboard/PostsTab.js` - Add error recovery UI
- `src/components/Workflow/steps/WebsiteAnalysisStep.js` - Add retry UI

## Success Criteria

- [ ] Users can retry failed operations with one click
- [ ] Retry attempts use exponential backoff
- [ ] Support link includes error context

## References

- Frontend Audit: Section C.7, Section D
