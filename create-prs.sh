#!/bin/bash

# Script to create PRs for the two completed features
# Usage: ./create-prs.sh [GITHUB_TOKEN]
# If no token provided, will output PR creation URLs

REPO="james-frankel-123/automate-my-blog-frontend"
BASE="main"
TOKEN="${1:-$GITHUB_TOKEN}"

create_pr() {
  local branch=$1
  local title=$2
  local body=$3
  local issue_num=$4
  
  if [ -z "$TOKEN" ]; then
    echo "⚠️  No GitHub token provided. Use one of these methods:"
    echo ""
    echo "Option 1: Visit GitHub web UI:"
    echo "https://github.com/${REPO}/compare/${BASE}...${branch}?expand=1"
    echo ""
    echo "Option 2: Run with token:"
    echo "./create-prs.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "Option 3: Use GitHub CLI:"
    echo "gh auth login"
    echo "gh pr create --base ${BASE} --head ${branch} --title \"${title}\" --body \"${body}\""
    return 1
  fi
  
  echo "Creating PR for ${branch}..."
  
  response=$(curl -s -X POST "https://api.github.com/repos/${REPO}/pulls" \
    -H "Authorization: token ${TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "{
      \"title\": \"${title}\",
      \"head\": \"${branch}\",
      \"base\": \"${BASE}\",
      \"body\": \"${body}\"
    }")
  
  pr_url=$(echo "$response" | grep -o '"html_url":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$pr_url" ]; then
    echo "✅ PR created: ${pr_url}"
  else
    echo "❌ Failed to create PR. Response:"
    echo "$response" | head -20
    return 1
  fi
}

# PR #1: Job Progress Tracking
create_pr "feat/job-progress-tracking" \
  "[CRITICAL] Implement Job Progress Tracking with Polling" \
  "## Summary

Implements comprehensive job progress tracking with polling for long-running operations.

## Changes

- **JobContext** - Manages job state and polling (2-3s intervals)
- **JobProgressModal** - Displays job progress with progress bar, current step, estimated time
- **JobStatusBadge** - Shows active jobs count in sidebar header
- **API Methods** - Added \`getJobStatus\`, \`retryJob\`, \`cancelJob\` to api.js
- **Integration** - JobProvider added to App.js, JobStatusBadge added to DashboardLayout
- **Persistence** - Active jobs stored in localStorage for resumption after page refresh

## Backend Requirements

This PR implements the frontend portion. Backend needs to implement:
- \`GET /api/v1/jobs/:jobId/status\` - Get job status
- \`POST /api/v1/jobs/:jobId/retry\` - Retry failed job  
- \`POST /api/v1/jobs/:jobId/cancel\` - Cancel running job

See \`docs/job-progress-tracking-backend-requirements.md\` for full API specification.

## Features

- ✅ Polls job status every 2-3 seconds
- ✅ Displays progress bar (0-100%)
- ✅ Shows current step message
- ✅ Estimated time remaining
- ✅ Cancel button for running jobs
- ✅ Retry button for failed jobs
- ✅ Job resumption after page refresh
- ✅ Badge showing active jobs count

## Testing

Once backend endpoints are implemented:
1. Start a long-running operation (website analysis or content generation)
2. Verify job ID is returned immediately
3. Check that job status updates are received via polling
4. Test job cancellation
5. Test job retry for failed jobs
6. Verify job resumption after page refresh

Closes #2" \
  "2"

echo ""

# PR #2: Frontend Analytics Instrumentation
create_pr "feat/frontend-analytics-instrumentation" \
  "[HIGH] Implement Frontend Analytics Instrumentation" \
  "## Summary

Implements comprehensive frontend analytics tracking for user behavior, funnel conversion, and feature usage.

## Changes

- **AnalyticsContext** - Updated to include user ID in all events
- **Auth Events** - Track \`signup_started\`, \`signup_completed\`, \`login_completed\`
- **Navigation Events** - Track \`page_view\` on every tab/section navigation
- **Content Generation** - Track \`scrape_started\` when website analysis begins
- **Publishing Events** - Track \`publish_clicked\` and \`publish_success\`

## Events Tracked

### Authentication
- ✅ \`signup_started\` - When registration modal opens
- ✅ \`signup_completed\` - On successful registration
- ✅ \`login_completed\` - On successful login

### Navigation
- ✅ \`page_view\` - On every tab switch in DashboardLayout

### Content Generation
- ✅ \`scrape_started\` - When website analysis begins

### Publishing
- ✅ \`publish_clicked\` - When export modal opens
- ✅ \`publish_success\` - On successful export/download

## Implementation Details

- All events include user ID (when available)
- Events are batched and sent every 5 seconds or 10 events
- High-priority events (purchase, signup, login) sent immediately
- Analytics failures don't break user flows
- Events flushed on page visibility change and before unload

## Next Steps

Additional events can be added incrementally:
- \`draft_viewed\` - When draft is opened
- \`draft_edited\` - Content edits (via autosave)
- \`analysis_viewed\` - When analysis results are viewed
- \`project_created\` - Project creation
- \`seo_strategy_selected\` - Strategy selection

## Funnel Metrics

With these events, backend can calculate:
- Activation funnel: \`signup_started\` → \`signup_completed\` → \`project_created\` → \`draft_viewed\`
- Time-to-value metrics:
  - \`time_to_first_draft\`
  - \`time_to_first_publish\`
  - \`time_to_second_post\`

Closes #3" \
  "3"

echo ""
echo "✅ PR creation script completed!"
