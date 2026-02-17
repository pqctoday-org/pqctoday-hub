# Testing Guide

This document describes the testing strategy and how to run tests for the PQC Timeline App.

## Test Structure

The project uses a comprehensive testing approach with three layers:

### 1. Unit Tests (Vitest + React Testing Library)

**Location**: `src/**/*.test.{ts,tsx}`

**Coverage**: 40+ test files covering:

- React components (Playground, PKI Learning, Compliance, Assessment, Migrate, Timeline, Leaders)
- Utility functions (crypto, CSV parsing, analytics, input validation)
- Services (OpenSSL, storage)
- Custom hooks (useAssessmentEngine, useTheme, useCertProfile)
- Data loading and parsing (algorithms, timeline, library, threats)

**Running Unit Tests**:

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

**Coverage Thresholds**:

- Lines: 70%
- Functions: 70%
- Branches: 60%
- Statements: 70%

### 2. End-to-End Tests (Playwright)

**Location**: `e2e/*.spec.ts`

**Coverage**: 46 E2E test files covering:

- Timeline visualization
- Algorithm comparison
- Interactive playground (basic, hybrid, ML-DSA, KEM)
- OpenSSL Studio (basic, PQC, advanced, encryption, KDF, LMS, security badges)
- PKI Learning module and Digital Assets flows (Ethereum, HD Wallet)
- 5G Security (baseline, validation, cross-validation)
- Compliance (data, sources, sorting)
- Migration workflow
- Library and threats dashboards
- Navigation and accessibility

**Running E2E Tests**:

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test e2e/playground.spec.ts

# Open Playwright UI
npx playwright test --ui
```

### 3. Accessibility Tests (axe-playwright)

Accessibility testing is integrated into E2E tests using `axe-playwright`.

**Example**:

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/playground')
  await injectAxe(page)
  await checkA11y(page)
})
```

## Test Data

### Mock Data

The application supports mock data for stable testing:

```typescript
// src/data/timelineData.ts
if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
  console.log('Using mock timeline data for testing')
  return mockTimelineData
}
```

Set `VITE_USE_MOCK_DATA=true` in your `.env` file for consistent test data.

### Test Vectors

NIST test vectors are located in `src/data/acvp/` for cryptographic validation.

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to playground', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Playground')
  await expect(page).toHaveURL(/.*playground/)
})
```

## CI/CD Integration

### CI Pipeline

The `.github/workflows/ci.yml` runs:

- ✅ Security audit
- ✅ Formatting checks
- ✅ Linting
- ✅ Build verification
- ✅ Unit tests
- ✅ E2E tests (Playwright, sharded across 2 workers, Chromium only)

## Test File Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`
- Test setup: `src/test/setup.ts`

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm run test -- MyComponent.test.tsx

# Run tests matching pattern
npm run test -- --grep "should render"

# Debug in VS Code
# Add breakpoint and use "Debug Test" in test file
```

### E2E Tests

```bash
# Run in debug mode
npx playwright test --debug

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on user-facing behavior
2. **Use Testing Library Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Avoid Direct DOM Access**: Use Testing Library methods instead of `querySelector`
4. **Mock External Dependencies**: Mock WASM modules, API calls, and localStorage
5. **Keep Tests Isolated**: Each test should be independent
6. **Use Descriptive Names**: Test names should describe the expected behavior

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Ensure `tsconfig.json` includes test files

**Issue**: E2E tests timeout
**Solution**: Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 10000,
}
```

**Issue**: WASM modules fail to load in tests
**Solution**: Mock WASM modules in test setup:

```typescript
vi.mock('@openforge-sh/liboqs', () => ({
  // Mock implementation
}))
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [axe-playwright](https://github.com/abhinaba-ghosh/axe-playwright)
