# E2E Test Suite

The **standard and only** e2e test suite for the Automate My Blog frontend. All tests use a **mocked backend** — no API required.

## Overview

- **Single spec**: `e2e/e2e.spec.js`
- **Mocked APIs**: workflow, auth, user, posts, analytics (see `e2e/mocks/workflow-api-mocks.js`)
- **Coverage**: Auth (login/signup/logout), workflow (analyze → audience → topics → generate → editor → export), dashboard navigation, content management, full workflow scenarios

## Prerequisites

- Node.js installed
- `npm install` completed

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Record video of full-workflow test → e2e/videos/complete-workflow-demo.webm
npm run test:e2e:record

# Interactive / debug
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── e2e.spec.js              # Single e2e suite (all tests)
├── mocks/
│   └── workflow-api-mocks.js
├── videos/
│   └── complete-workflow-demo.webm   # From npm run test:e2e:record
├── utils/
│   └── test-helpers.js
├── fixtures/
│   └── test-data.js
├── E2E_WORKFLOWS_INDEX.md
└── README.md
```

## Configuration

- **Playwright**: `playwright.config.js` — `testMatch: 'e2e/e2e.spec.js'`
- **Base URL**: `http://localhost:3000`
- **Browser**: Chromium

## CI

```yaml
- run: npm run test:e2e
  env: { CI: true }
```

## Troubleshooting

- **Port in use**: Stop existing server on 3000 or set `PLAYWRIGHT_BASE_URL`.
- **Overlay blocks clicks**: Tests remove `webpack-dev-server-client-overlay`; avoid leaving it open during runs.
- **Browser missing**: `npx playwright install --with-deps chromium`
