---
name: Project Settings & Strategy UX
about: Add project settings panel for SEO strategy and audience configuration
title: '[MEDIUM] Add Project Settings & Strategy UX'
labels: ['medium-priority', 'feature', 'frontend']
assignees: ''
---

## Problem

No dedicated UI for managing project settings, SEO strategy, or audience configuration. Strategy selection exists but scattered.

**Current State:**
- Strategy selected in `AudienceSegmentsTab.js`
- Stored in `WorkflowModeContext.selectedCustomerStrategy`
- No centralized settings management
- No validation before content generation

## Proposed Solution

### Project Settings Panel
- [ ] Create `ProjectSettingsModal` component
- [ ] Add settings:
  - **Audience Segment:** Dropdown of available segments
  - **SEO Strategy:** Radio buttons (Technical SEO, Content SEO, Link Building, Local SEO)
  - **Content Tone:** Select (Expert, Friendly, Insider, Storyteller)
  - **CTA Goals:** Multi-select (Lead Generation, Newsletter Signup, Product Demo, etc.)
  - **Default Template:** Select (How-to, Problem-Solution, Listicle, Case Study, Comprehensive)

### Inline Strategy Prompts
- [ ] Create `StrategyPromptBanner` component
- [ ] Show banner if strategy not set: "Set your SEO strategy to optimize content generation"
- [ ] Show strategy summary when set: "Using: Content SEO strategy for B2B audience"
- [ ] Allow quick edit via dropdown

### Strategy Validation
- [ ] Validate strategy selection before content generation
- [ ] Show warning if strategy missing: "Please set your SEO strategy for best results"
- [ ] Allow "Generate anyway" option

### Backend Requirements
- [ ] Add `settings` JSONB column to `projects` table
- [ ] Create `PUT /api/v1/projects/:id/settings` endpoint
- [ ] Load settings on project selection
- [ ] Save settings on change (debounced, 2s delay)

## Files to Create

- `src/components/ProjectSettings/ProjectSettingsModal.js` - **NEW**
- `src/components/StrategyPrompts/StrategyPromptBanner.js` - **NEW**

## Files to Modify

- `src/components/Dashboard/PostsTab.js` - Add strategy prompts
- `src/components/Dashboard/AudienceSegmentsTab.js` - Integrate with settings
- `src/services/api.js` - Add settings API methods

## Success Criteria

- [ ] 80% of users set SEO strategy before first content generation
- [ ] Strategy selection reduces content regeneration requests by 30%
- [ ] Settings persist across sessions

## References

- Implementation Plan: Section D
