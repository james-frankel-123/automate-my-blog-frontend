# Create Issues from Templates

This script automatically creates GitHub issues from all issue templates in `.github/ISSUE_TEMPLATES/`.

## Prerequisites

1. **GitHub CLI installed**: [Install GitHub CLI](https://cli.github.com/)
2. **Authenticated**: Run `gh auth login` if not already authenticated
3. **In repository**: Run from the root of your git repository

## Usage

### Basic Usage
```bash
./.github/create-issues.sh
```

### Dry Run (Preview)
Test the script without creating issues:
```bash
./.github/create-issues.sh --dry-run
# or
./.github/create-issues.sh -n
```

### What It Does

1. **Scans** all `.md` files in `.github/ISSUE_TEMPLATES/`
2. **Extracts** title, labels, and body from each template
3. **Checks** if issue already exists (by title)
4. **Creates** new issues with proper labels
5. **Reports** summary of created/skipped/failed issues

### Example Output

```
Creating issues from templates in repository: owner/repo

Processing: 01-job-progress-tracking.md
  Creating issue: [CRITICAL] Implement Job Progress Tracking with Polling
  Labels: high-priority,ux,frontend
  ✓ Created issue #123

Processing: 02-analytics-instrumentation.md
  Creating issue: [HIGH] Implement Frontend Analytics Instrumentation
  Labels: high-priority,analytics,frontend
  ✓ Created issue #124

...

=== Summary ===
Created: 18
Skipped: 0
Failed: 0
```

## Features

- ✅ **Duplicate Detection**: Checks if issue already exists before creating
- ✅ **Label Support**: Automatically applies labels from template
- ✅ **Error Handling**: Continues processing even if one issue fails
- ✅ **Progress Reporting**: Shows status for each issue
- ✅ **Summary**: Reports total created/skipped/failed

## Troubleshooting

### "GitHub CLI (gh) is not installed"
```bash
# Install GitHub CLI
# macOS
brew install gh

# Linux/Windows
# See: https://cli.github.com/manual/installation
```

### "Not authenticated with GitHub CLI"
```bash
gh auth login
```

### "Could not determine repository"
Make sure you're in a git repository and it has a remote configured:
```bash
git remote -v
```

### Issues Created But Labels Missing
Make sure labels are set up first:
```bash
./.github/setup-labels.sh
```

## Safety Features

- **Dry Run**: The script checks for existing issues before creating
- **No Overwrites**: Won't create duplicate issues
- **Error Recovery**: Continues processing even if one issue fails
- **Clear Output**: Shows exactly what's happening

## Notes

- Issues are created in the current repository (detected automatically)
- Labels must exist in the repository before creating issues
- The script preserves all formatting from the template body
- Special characters in issue body are handled correctly
