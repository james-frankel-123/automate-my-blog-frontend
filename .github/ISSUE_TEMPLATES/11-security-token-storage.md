---
name: Security - Token Storage
about: Move auth tokens from localStorage to httpOnly cookies
title: '[HIGH] Move Auth Tokens to httpOnly Cookies'
labels: ['high-priority', 'security', 'frontend']
assignees: ''
---

## Problem

Auth tokens stored in `localStorage` are vulnerable to XSS attacks. If malicious script runs, tokens are accessible.

**Current State:**
- `accessToken` and `refreshToken` in `localStorage`
- XSS vulnerability
- No httpOnly cookie protection

**Impact:** High - security risk

## Proposed Solution

### Migration Strategy
- [ ] Backend: Set httpOnly cookies on login/register
- [ ] Backend: Remove token from response body
- [ ] Frontend: Remove `localStorage` token storage
- [ ] Frontend: Update API client to send cookies automatically
- [ ] Frontend: Handle cookie-based auth in `AuthContext`

### Implementation Steps
- [ ] Update backend auth endpoints to set httpOnly cookies
- [ ] Update `AuthContext.js` to not store tokens in localStorage
- [ ] Update `api.js` to rely on cookies (remove Authorization header)
- [ ] Test auth flow end-to-end
- [ ] Add CSRF protection if needed

### Considerations
- [ ] Ensure cookies work with CORS
- [ ] Handle SameSite cookie attributes
- [ ] Consider refresh token rotation
- [ ] Update logout to clear cookies

## Files to Modify

- `src/contexts/AuthContext.js` - Remove localStorage token storage
- `src/services/api.js` - Remove Authorization header, rely on cookies
- Backend auth endpoints - Set httpOnly cookies

## Success Criteria

- [ ] Tokens no longer in localStorage
- [ ] Auth works with httpOnly cookies
- [ ] XSS vulnerability mitigated
- [ ] All auth flows tested

## References

- Frontend Audit: Section E
