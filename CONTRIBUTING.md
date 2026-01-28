# Contributing Guide

Thank you for your interest in contributing to Automate My Blog! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/james-frankel-123/automate-my-blog-frontend.git
   cd automate-my-blog-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run tests**
   ```bash
   # Unit tests
   npm test

   # E2E tests
   npm run test:e2e
   ```

## 📝 Development Workflow

### Branch Naming

- Feature branches: `feat/feature-name`
- Bug fixes: `fix/bug-description`
- Documentation: `docs/documentation-update`

### Commit Messages

Follow conventional commit format:
- `feat: Add new feature`
- `fix: Fix bug in component`
- `docs: Update documentation`
- `test: Add tests for feature`
- `refactor: Refactor component`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. **Update relevant tests** (see Testing Requirements below)
4. Ensure all tests pass locally
5. Push to your fork and create a PR
6. Wait for review and address feedback

## 🧪 Testing Requirements

### **CRITICAL: E2E Test Updates Required**

When making changes that affect UI elements, you **MUST** update the relevant E2E tests.

#### When to Update E2E Tests

You must update E2E tests when you:

- ✅ **Change button text or labels** (e.g., "Login" → "Sign In")
- ✅ **Modify form field names or IDs** (e.g., `name="email"` → `name="userEmail"`)
- ✅ **Add or remove UI components** (buttons, inputs, modals, etc.)
- ✅ **Change component structure** (e.g., wrapping elements in new containers)
- ✅ **Modify CSS classes or data attributes** used by tests
- ✅ **Change navigation structure** (menu items, tabs, routes)
- ✅ **Update Ant Design component usage** (different component types)
- ✅ **Modify modal or dialog behavior**
- ✅ **Change authentication flow UI**
- ✅ **Update workflow step indicators or progress bars**

#### How to Update E2E Tests

1. **Identify affected tests**
   - All e2e tests live in `e2e/e2e.spec.js` (auth, workflow, dashboard, content, full scenarios). Use `test.describe` / test names to find the relevant section.

2. **Update selectors to match new UI**
   ```javascript
   // Before: Generic selector
   const button = page.locator('button:has-text("Login")');
   
   // After: Updated to match new UI
   const button = page.locator('button:has-text("Sign In")');
   ```

3. **Test your changes locally**
   ```bash
   # Run all e2e tests
   npm run test:e2e
   ```

4. **Ensure tests pass before submitting PR**
   - All E2E tests must pass
   - Tests should be resilient (handle missing elements gracefully)
   - Update test helpers if needed (`e2e/utils/test-helpers.js`)

#### E2E Test Best Practices

- **Use stable selectors**: Prefer `name` attributes, `data-testid`, or text content over CSS classes
- **Wait for elements**: Always wait for elements to be visible before interacting
- **Handle async operations**: Use proper waits for API calls and state updates
- **Make tests resilient**: Use conditional checks and graceful skips when appropriate
- **Test user flows**: Focus on testing actual user interactions, not implementation details

#### Example: Updating Tests After UI Change

**Scenario**: You change a login button from "Login" to "Sign In"

**Before**:
```javascript
const loginButton = page.locator('button:has-text("Login")');
```

**After**:
```javascript
const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Log In")');
// Or better: use data-testid if available
const loginButton = page.locator('[data-testid="login-button"]');
```

### Unit Tests

- Write unit tests for new components and utilities
- Maintain or improve test coverage
- Use React Testing Library for component tests

### Test Checklist

Before submitting a PR, ensure:

- [ ] All existing tests pass
- [ ] New tests added for new features
- [ ] E2E tests updated if UI changed
- [ ] Tests are resilient and handle edge cases
- [ ] No flaky tests (tests that sometimes pass/fail)

## 🎨 Code Style

### JavaScript/React

- Use ES6+ features
- Follow React best practices (hooks, functional components)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and reusable

### File Organization

```
src/
  components/     # React components
  contexts/      # React contexts
  services/      # API and service layers
  utils/         # Utility functions
  hooks/         # Custom React hooks
  styles/        # CSS files
```

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to reproduce**: Detailed steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**: Browser, OS, Node version

## ✨ Feature Requests

When requesting features:

1. **Use case**: Explain the problem it solves
2. **Proposed solution**: Describe your idea
3. **Alternatives**: Other solutions considered
4. **Impact**: Who benefits and how

## 🔍 Code Review Guidelines

### For Contributors

- Keep PRs focused and reasonably sized
- Respond to review feedback promptly
- Update tests as requested
- Ensure CI checks pass

### For Reviewers

- Be constructive and respectful
- Focus on code quality and maintainability
- Check that tests are updated appropriately
- Verify E2E tests cover UI changes

## 📚 Documentation

- Update README.md for significant changes
- Add JSDoc comments for new functions
- Update API documentation if endpoints change
- Keep E2E test documentation current (`e2e/README.md`)

## 🚨 Important Reminders

### Before Every PR

1. ✅ Run `npm test` - All unit tests pass
2. ✅ Run `npm run test:e2e` - All E2E tests pass
3. ✅ Check for linting errors
4. ✅ Update E2E tests if UI changed
5. ✅ Test manually in browser
6. ✅ Update documentation if needed

### E2E Test Failures

If E2E tests fail in CI:

1. **Reproduce locally**: Run the same test locally
2. **Check selectors**: Verify selectors match current UI
3. **Check timing**: Add appropriate waits if needed
4. **Update tests**: Fix selectors or test logic
5. **Re-run**: Ensure tests pass before pushing

## 🎯 Testing Resources

- **E2E Test Documentation**: `e2e/README.md`
- **Test Helpers**: `e2e/utils/test-helpers.js`
- **Playwright Docs**: https://playwright.dev/docs/intro
- **Test Examples**: See existing tests in `e2e/` directory

## ❓ Questions?

- Check existing documentation in `docs/`
- Review E2E test examples in `e2e/`
- Open an issue for clarification

---

**Remember**: UI changes require E2E test updates. This ensures our automated tests stay in sync with the application and catch regressions early!
