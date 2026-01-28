# E2E Test Suite

Comprehensive end-to-end clickthrough tests for the Automate My Blog frontend application using Playwright.

## Overview

This test suite covers all major user workflows and interactions:

- **Authentication**: Login, signup, logout, session management
- **Content Workflow**: Website analysis → Content generation → Editing → Export
- **Dashboard Navigation**: Tab switching, layout, responsive design
- **Content Management**: Post creation, editing, deletion, scheduling, export

## Prerequisites

- Node.js installed
- Application dependencies installed (`npm install`)
- Backend server running (optional - tests are designed to work with or without backend)

## Installation

Playwright and browsers are installed automatically when you run `npm install`. If you need to reinstall browsers:

```bash
npx playwright install --with-deps chromium
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

This will:
1. Start the development server automatically
2. Run all e2e tests
3. Generate HTML report

### Run Specific Test Suites

```bash
# Authentication tests only
npm run test:e2e:auth

# Workflow tests only
npm run test:e2e:workflow

# Dashboard navigation tests
npm run test:e2e:dashboard

# Content management tests
npm run test:e2e:content

# Full workflow integration tests
npm run test:e2e:full
```

### Interactive Mode

```bash
# Run with UI mode (recommended for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### View Test Reports

```bash
# View HTML report
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── auth.spec.js              # Authentication flow tests
├── workflow.spec.js           # Main content generation workflow
├── dashboard.spec.js          # Dashboard navigation and layout
├── content-management.spec.js # Post CRUD operations
├── full-workflow.spec.js      # Complete end-to-end scenarios
├── utils/
│   └── test-helpers.js        # Reusable test utilities
├── fixtures/
│   └── test-data.js          # Test data fixtures
└── README.md                  # This file
```

## Test Utilities

The `test-helpers.js` file provides reusable utilities:

- `generateTestEmail()` - Generate unique test emails
- `waitForElement()` - Wait for elements with timeout
- `clearStorage()` - Clear localStorage/sessionStorage
- `loginUser()` - Helper for user login
- `navigateToTab()` - Navigate between dashboard tabs
- And more...

## Configuration

Test configuration is in `playwright.config.js`:

- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Browser**: Chromium (Desktop Chrome)
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Retries**: 2 retries on CI, 0 locally

## Writing New Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const { waitForElement, clearStorage } = require('./utils/test-helpers');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
  });

  test('should do something', async ({ page }) => {
    // Your test code here
    await expect(page).toHaveURL(/.*localhost:3000/);
  });
});
```

### Best Practices

1. **Use helpers**: Leverage utilities from `test-helpers.js`
2. **Wait for elements**: Always wait for elements before interacting
3. **Handle optional features**: Use conditional checks for features that may not be available
4. **Clear state**: Use `clearStorage()` in `beforeEach` to ensure clean state
5. **Descriptive names**: Use clear test descriptions
6. **Isolated tests**: Each test should be independent

## CI/CD Integration

Tests are designed to work in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CI: true
```

## Troubleshooting

### Tests fail with "Target closed" or timeout errors

- Ensure the dev server is running on port 3000
- Check that the backend API is accessible (if required)
- Increase timeout in `playwright.config.js` if needed

### Tests pass but don't test actual functionality

- Some tests are designed to validate UI behavior even without backend
- For full functionality testing, ensure backend is running
- Check test logs for skipped conditions

### Browser not found

```bash
npx playwright install chromium
```

### Port already in use

Change the port in `playwright.config.js` or stop the existing server.

## Test Coverage

### Authentication ✅
- Login form display
- Registration form
- Invalid credentials handling
- Session persistence
- Logout functionality

### Workflow ✅
- Website analysis initiation
- Analysis results display
- Workflow step navigation
- Topic selection
- Content generation
- Content editing
- Export functionality

### Dashboard ✅
- Layout rendering
- Tab navigation
- Responsive design
- User menu
- Mode switching

### Content Management ✅
- Post listing
- Post creation
- Post editing
- Post deletion
- Post preview
- Post export
- Post scheduling
- Search and filtering

## Notes

- Tests are designed to be resilient and work with or without backend connectivity
- Some tests may skip if certain features aren't available (this is intentional)
- Tests use realistic user interactions and timing
- Screenshots and videos are captured on failures for debugging

## Contributing

When adding new features:

1. Add corresponding e2e tests
2. Update this README if needed
3. Ensure tests pass locally
4. Consider CI/CD impact
