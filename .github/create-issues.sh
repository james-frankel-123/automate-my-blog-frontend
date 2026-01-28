#!/bin/bash

# GitHub Issues Creation Script
# This script creates GitHub issues from all issue templates in .github/ISSUE_TEMPLATES/
# Requires GitHub CLI (gh) to be installed and authenticated

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO" ]; then
    echo -e "${RED}Error: Could not determine repository. Make sure you're in a git repository.${NC}"
    exit 1
fi

echo -e "${BLUE}Creating issues from templates in repository: ${REPO}${NC}\n"

# Directory containing issue templates
TEMPLATES_DIR=".github/ISSUE_TEMPLATES"

# Check if templates directory exists
if [ ! -d "$TEMPLATES_DIR" ]; then
    echo -e "${RED}Error: ${TEMPLATES_DIR} directory not found.${NC}"
    exit 1
fi

# Counter for created issues
CREATED=0
SKIPPED=0
FAILED=0

# Check for dry-run flag
DRY_RUN=false
if [ "$1" == "--dry-run" ] || [ "$1" == "-n" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}DRY RUN MODE - No issues will be created${NC}\n"
fi

# Function to extract YAML frontmatter
extract_frontmatter() {
    local file=$1
    awk '/^---$/{count++; if(count==2) exit} count==1' "$file"
}

# Function to extract body (everything after frontmatter)
extract_body() {
    local file=$1
    # Find the line number of the second ---
    second_dash_line=$(awk '/^---$/{count++; if(count==2) {print NR; exit}}' "$file")
    if [ -n "$second_dash_line" ]; then
        # Print everything after the second ---
        tail -n +$((second_dash_line + 1)) "$file"
    else
        # If no second ---, print everything after first ---
        awk '/^---$/{count++; if(count==1) skip=1; next} !skip' "$file"
    fi
}

# Function to parse YAML value
parse_yaml_value() {
    local yaml=$1
    local key=$2
    echo "$yaml" | grep "^${key}:" | sed "s/^${key}://" | sed "s/^ *//" | sed "s/^'//" | sed "s/'$//" | sed 's/^"//' | sed 's/"$//'
}

# Function to parse YAML array (handles both inline and multi-line)
parse_yaml_array() {
    local yaml=$1
    local key=$2
    # Try inline array first
    local inline=$(echo "$yaml" | grep "^${key}:" | sed "s/^${key}://" | sed "s/^ *//" | sed "s/^\[//" | sed "s/\]$//")
    if [ -n "$inline" ]; then
        echo "$inline" | sed "s/'//g" | sed "s/ //g" | tr ',' '\n' | grep -v '^$'
    else
        # Try multi-line array
        echo "$yaml" | awk "/^${key}:/{flag=1; next} /^[a-zA-Z]/ && flag{flag=0} flag" | sed "s/^- *//" | sed "s/^'//" | sed "s/'$//" | sed "s/,$//"
    fi
}

# Process each template file
for template_file in "$TEMPLATES_DIR"/*.md; do
    # Skip if no files found
    [ -e "$template_file" ] || continue
    
    filename=$(basename "$template_file")
    echo -e "${BLUE}Processing: ${filename}${NC}"
    
    # Extract frontmatter
    frontmatter=$(extract_frontmatter "$template_file")
    
    # Extract values
    title=$(parse_yaml_value "$frontmatter" "title")
    name=$(parse_yaml_value "$frontmatter" "name")
    
    # Extract body (everything after the second ---)
    body=$(extract_body "$template_file")
    
    # Extract labels
    labels_array=$(parse_yaml_array "$frontmatter" "labels")
    if [ -n "$labels_array" ]; then
        labels=$(echo "$labels_array" | tr '\n' ',' | sed 's/,$//')
    else
        labels=""
    fi
    
    # Escape body for shell (handle special characters)
    body_escaped=$(echo "$body" | sed 's/"/\\"/g' | sed "s/\$/\\\$/g")
    
    # Check if issue already exists (by title)
    existing_issue=$(gh issue list --search "is:issue ${title}" --json number --jq '.[0].number' 2>/dev/null)
    
    if [ -n "$existing_issue" ] && [ "$existing_issue" != "null" ]; then
        echo -e "  ${YELLOW}⚠ Issue already exists: #${existing_issue}${NC}"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Create issue
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[DRY RUN] Would create issue: ${title}${NC}"
        if [ -n "$labels" ]; then
            echo -e "  ${BLUE}[DRY RUN] Labels: ${labels}${NC}"
        fi
        CREATED=$((CREATED + 1))
    else
        echo -e "  ${GREEN}Creating issue: ${title}${NC}"
        if [ -n "$labels" ]; then
            echo -e "  ${BLUE}Labels: ${labels}${NC}"
        fi
        
        # Create temporary file for body (to avoid shell escaping issues)
        body_file=$(mktemp)
        echo "$body" > "$body_file"
        
        # Build gh issue create command with proper label handling
        # GitHub CLI requires each label as a separate --label flag
        if [ -n "$labels" ]; then
            # Convert comma-separated labels to array
            IFS=',' read -ra LABEL_ARRAY <<< "$labels"
            # Build command array
            cmd_args=("gh" "issue" "create" "--title" "${title}" "--body-file" "${body_file}")
            # Add each label as a separate --label argument
            for label in "${LABEL_ARRAY[@]}"; do
                # Trim whitespace
                label=$(echo "$label" | xargs)
                cmd_args+=("--label" "${label}")
            done
            # Execute command
            issue_output=$("${cmd_args[@]}" 2>&1)
        else
            issue_output=$(gh issue create --title "${title}" --body-file "$body_file" 2>&1)
        fi
        
        exit_code=$?
        rm -f "$body_file"
        
        if [ $exit_code -eq 0 ]; then
            # Extract issue number from URL (works on both macOS and Linux)
            issue_number=$(echo "$issue_output" | sed -n 's|.*/issues/\([0-9]*\).*|\1|p' | head -1)
            if [ -n "$issue_number" ]; then
                echo -e "  ${GREEN}✓ Created issue #${issue_number}${NC}"
                CREATED=$((CREATED + 1))
            else
                echo -e "  ${GREEN}✓ Created issue${NC}"
                CREATED=$((CREATED + 1))
            fi
        else
            echo -e "  ${RED}✗ Failed to create issue${NC}"
            echo -e "  ${RED}Error: ${issue_output}${NC}"
            FAILED=$((FAILED + 1))
        fi
    fi
    
    echo ""
done

# Summary
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Would create: ${CREATED}${NC}"
else
    echo -e "${GREEN}Created: ${CREATED}${NC}"
fi
echo -e "${YELLOW}Skipped: ${SKIPPED}${NC}"
if [ "$DRY_RUN" != true ]; then
    echo -e "${RED}Failed: ${FAILED}${NC}"
fi

if [ "$DRY_RUN" != true ] && [ $FAILED -gt 0 ]; then
    exit 1
fi
