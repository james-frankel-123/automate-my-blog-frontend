---
name: Email Preferences & Deep Links
about: Add email preferences UI and deep link handling
title: '[MEDIUM] Add Email Preferences & Deep Link Handling'
labels: ['medium-priority', 'feature', 'frontend']
assignees: ''
---

## Problem

No email preferences UI and no deep link handling for email campaigns. Users can't manage email frequency or preferences.

**Current State:**
- No email preferences UI in `SettingsTab.js`
- No deep link handling for email campaigns
- No unsubscribe links in email templates (assumed backend handles)

## Proposed Solution

### Email Preferences Screen
- [ ] Create `EmailPreferencesTab` component
- [ ] Add settings:
  - **Email Frequency:** Radio (Daily digest, Weekly summary, Only important, Never)
  - **Notification Types:** Checkboxes
    - Draft ready notifications
    - Recommendation alerts
    - Weekly performance summary
    - Product updates
  - **Unsubscribe Link:** "Unsubscribe from all emails" button

### Deep Link Handling
- [ ] Add URL pattern handling:
  - `?action=open_draft&postId=123` - Open specific draft
  - `?action=open_recommendations&id=rec_456` - Open recommendation
  - `?action=view_metrics&period=week` - View metrics
  - `?action=open_project&projectId=789` - Open project
- [ ] Implement in `App.js` or `DashboardLayout.js`
- [ ] Clean URL after handling

### Backend Requirements
- [ ] `GET /api/v1/user/email-preferences` - Get current preferences
- [ ] `PUT /api/v1/user/email-preferences` - Update preferences
- [ ] `POST /api/v1/user/unsubscribe` - Unsubscribe from all

## Files to Create

- `src/components/Settings/EmailPreferencesTab.js` - **NEW**

## Files to Modify

- `src/components/Dashboard/SettingsTab.js` - Add email preferences tab
- `src/App.js` or `src/components/Dashboard/DashboardLayout.js` - Add deep link handling
- `src/services/api.js` - Add email preferences API methods

## Success Criteria

- [ ] Users can manage email preferences
- [ ] Deep links work from email campaigns
- [ ] Unsubscribe functionality works

## References

- Implementation Plan: Section E
