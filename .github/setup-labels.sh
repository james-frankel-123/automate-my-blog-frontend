#!/bin/bash

# GitHub Labels Setup Script
# This script creates all necessary labels for the issue templates
# Requires GitHub CLI (gh) to be installed and authenticated

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up GitHub labels...${NC}\n"

# Priority Labels
gh label create "high-priority" --description "Critical issues that need immediate attention" --color d73a4a --force 2>/dev/null && echo "✓ Created high-priority" || echo -e "${YELLOW}⚠ high-priority already exists${NC}"
gh label create "medium-priority" --description "Important but not urgent" --color fbca04 --force 2>/dev/null && echo "✓ Created medium-priority" || echo -e "${YELLOW}⚠ medium-priority already exists${NC}"
gh label create "low-priority" --description "Nice to have, can be deferred" --color 0e8a16 --force 2>/dev/null && echo "✓ Created low-priority" || echo -e "${YELLOW}⚠ low-priority already exists${NC}"

# Type Labels
gh label create "bug" --description "Something isn't working" --color d73a4a --force 2>/dev/null && echo "✓ Created bug" || echo -e "${YELLOW}⚠ bug already exists${NC}"
gh label create "feature" --description "New feature or request" --color a2eeef --force 2>/dev/null && echo "✓ Created feature" || echo -e "${YELLOW}⚠ feature already exists${NC}"
gh label create "enhancement" --description "New feature or enhancement" --color a2eeef --force 2>/dev/null && echo "✓ Created enhancement" || echo -e "${YELLOW}⚠ enhancement already exists${NC}"
gh label create "question" --description "Further information is requested" --color d876e3 --force 2>/dev/null && echo "✓ Created question" || echo -e "${YELLOW}⚠ question already exists${NC}"

# Area Labels
gh label create "frontend" --description "Frontend related work" --color 1d76db --force 2>/dev/null && echo "✓ Created frontend" || echo -e "${YELLOW}⚠ frontend already exists${NC}"
gh label create "backend" --description "Backend related work" --color 0e8a16 --force 2>/dev/null && echo "✓ Created backend" || echo -e "${YELLOW}⚠ backend already exists${NC}"
gh label create "ux" --description "User experience improvements" --color c5def5 --force 2>/dev/null && echo "✓ Created ux" || echo -e "${YELLOW}⚠ ux already exists${NC}"
gh label create "security" --description "Security related issues" --color b60205 --force 2>/dev/null && echo "✓ Created security" || echo -e "${YELLOW}⚠ security already exists${NC}"
gh label create "performance" --description "Performance improvements" --color fbca04 --force 2>/dev/null && echo "✓ Created performance" || echo -e "${YELLOW}⚠ performance already exists${NC}"
gh label create "accessibility" --description "Accessibility improvements (a11y)" --color 1d76db --force 2>/dev/null && echo "✓ Created accessibility" || echo -e "${YELLOW}⚠ accessibility already exists${NC}"
gh label create "analytics" --description "Analytics and tracking related" --color c5def5 --force 2>/dev/null && echo "✓ Created analytics" || echo -e "${YELLOW}⚠ analytics already exists${NC}"
gh label create "refactor" --description "Code refactoring" --color e99695 --force 2>/dev/null && echo "✓ Created refactor" || echo -e "${YELLOW}⚠ refactor already exists${NC}"
gh label create "ci/cd" --description "CI/CD pipeline improvements" --color 0052cc --force 2>/dev/null && echo "✓ Created ci/cd" || echo -e "${YELLOW}⚠ ci/cd already exists${NC}"
gh label create "automation" --description "Automation improvements" --color 0e8a16 --force 2>/dev/null && echo "✓ Created automation" || echo -e "${YELLOW}⚠ automation already exists${NC}"
gh label create "documentation" --description "Documentation improvements" --color d4c5f9 --force 2>/dev/null && echo "✓ Created documentation" || echo -e "${YELLOW}⚠ documentation already exists${NC}"
gh label create "testing" --description "Testing related" --color f9d0c4 --force 2>/dev/null && echo "✓ Created testing" || echo -e "${YELLOW}⚠ testing already exists${NC}"
gh label create "dependencies" --description "Dependency updates" --color 0366d6 --force 2>/dev/null && echo "✓ Created dependencies" || echo -e "${YELLOW}⚠ dependencies already exists${NC}"

# Status Labels
gh label create "blocked" --description "Blocked by another issue or dependency" --color d73a4a --force 2>/dev/null && echo "✓ Created blocked" || echo -e "${YELLOW}⚠ blocked already exists${NC}"
gh label create "good first issue" --description "Good for newcomers" --color 7057ff --force 2>/dev/null && echo "✓ Created good first issue" || echo -e "${YELLOW}⚠ good first issue already exists${NC}"
gh label create "help wanted" --description "Extra attention is needed" --color 008672 --force 2>/dev/null && echo "✓ Created help wanted" || echo -e "${YELLOW}⚠ help wanted already exists${NC}"
gh label create "wontfix" --description "This will not be worked on" --color ffffff --force 2>/dev/null && echo "✓ Created wontfix" || echo -e "${YELLOW}⚠ wontfix already exists${NC}"
gh label create "duplicate" --description "This issue or pull request already exists" --color cccccc --force 2>/dev/null && echo "✓ Created duplicate" || echo -e "${YELLOW}⚠ duplicate already exists${NC}"
gh label create "invalid" --description "This doesn't seem right" --color e4e669 --force 2>/dev/null && echo "✓ Created invalid" || echo -e "${YELLOW}⚠ invalid already exists${NC}"

echo -e "\n${GREEN}✓ Label setup complete!${NC}"
echo -e "\n${YELLOW}Note: If you see warnings above, those labels already exist in your repository.${NC}"
