# Testing Guide

This document describes the testing strategy and how to run tests for PQC Today Hub.

## Local gate (run before every push)

The local gate is the enforcement layer for data integrity — it runs checks
that are deliberately **not** in CI (new suites stay local-only by policy):

```bash
npm run gate:data    # all data gates incl. the unified validate:data
                     # (~20 check families: proof gates, FK integrity,
                     # lifecycle/self-containment, enrichment coverage)
npm run gate:local   # format + lint + gate:data + unit tests
```

`npm run validate:data` runs the unified validator on its own
(`--json` / `--verbose` / `--staleness N` supported). The migrate proof gate
(MP-1..MP-4), threats proof gate (TP-1..3), and DS03/DS19/DS20 lifecycle
checks only run here — CI does not cover them, so a red `gate:data` must
block a push even when CI would be green. Note: proof directories
(`public/library/`, `public/migrate-proofs/`, `public/threats/`,
`public/timeline/`) are untracked working-tree assets — run the gate in a
checkout that has them (the main checkout, or copy them into your worktree).

### `gate:cacp` — the KMIP crypto-agility control plane

```bash
npm run gate:cacp   # src/components/Playground/kmip + src/wasm/kmip: the
                     # CI-visible suite, the *.local.test.ts drift guards,
                     # and the cacp-kmip wasm-provenance check
```

Wired into `.husky/pre-push` (2026-08-28, gaps-remediation plan WS-10) —
runs on every push, unconditionally, like every other check in that hook.

Two of its `*.local.test.ts` drift guards
(`ruleCatalog.local.test.ts`'s catalog ↔ grammar and scope guards,
`tests/policy_dual_form_parity.rs`-style checks) **require a sibling
checkout of `pqctoday-hsm`** at `../pqctoday-hsm` relative to this repo —
they read `kmip/src/policy/rule.rs` directly off disk to catch the rule
vocabulary (and the `Scope` enum) drifting from what the visual editor's
catalog assumes. There is no environment variable for this path; it's a
hardcoded relative path (same convention `sync:wasm:check` already uses
for the wasm-provenance check), so **this repo and `pqctoday-hsm` must be
sibling directories** for `gate:cacp` to do its real job. Without that
sibling checkout, the guard fails loudly (by design — see its own error
message) rather than silently skipping.

### `gate:pkcs11` — the HSM Playground gate

```bash
npm run gate:pkcs11   # src/components/Playground/{hsm,tabs,dev,learnkit},
                       # HsmPlayground.test.tsx, src/wasm/softhsm: CI-visible
                       # suite + the matching *.local.test.ts suites
```

Same shape as `gate:cacp` above (a CI-visible leg via `npm run test --` plus a
`test:local --` leg scoped to the same directories) but for the PKCS#11 HSM
Playground rather than the KMIP/CACP one. **Unlike `gate:cacp`, this is not
wired into `.husky/pre-push` or any CI workflow** — it exists in
`package.json` for a developer to run by hand before/after touching HSM
Playground code. `gate:local`'s plain `npm run test` already covers its
CI-visible half; running `gate:pkcs11` directly also pulls in the scoped
local-only suite without needing the repo-wide `test:local`.

## Test Structure

The project uses a comprehensive testing approach with three layers:

### 1. Unit Tests (Vitest + React Testing Library)

**Location**: `src/**/*.test.{ts,tsx}`

**Coverage**: ~735 `*.test.{ts,tsx}` files under `src/` (~684 run in CI via `npm run test`;
~51 are `*.local.test.{ts,tsx}` — local-gate-only, run via `npm run test:local` — see
"Local gate" above), covering:

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

**Coverage Thresholds** (`vite.config.ts`'s `test.coverage.thresholds` — v8 provider):

- Lines: 59%
- Functions: 50%
- Branches: 47%
- Statements: 59%

These are floors that ratchet up as coverage improves, not a target — check
`vite.config.ts` for the current numbers rather than trusting this table, since
they move.

### 2. End-to-End Tests (Playwright)

**Location**: `e2e/*.spec.ts`

**Coverage**: ~63 `*.spec.ts` files (plus ~19 `*.local.spec.ts` files that never run in
CI — see below) covering:

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

The application supports mock data for stable testing (`src/data/libraryData.ts`
and `src/data/timelineData.ts` both check the same flag):

```typescript
// src/data/timelineData.ts
if (import.meta.env.VITE_MOCK_DATA === 'true') {
  console.log('Using mock timeline data for testing')
  return {
    current: { content: MOCK_CSV_CONTENT, filename: 'MOCK_DATA', date: new Date() },
    previous: null,
  }
}
```

Set `VITE_MOCK_DATA=true` in your `.env` file for consistent test data.

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

E2E is split into two tiers — a fast **smoke** tier that gates every PR, and
a **nightly** tier that runs the full suite once a day. This split was
introduced 2026-04-02 (E2E had been dropped from CI entirely for being too
slow; the smoke tier re-gates a lean, curated subset rather than the whole
suite).

The required PR check, `.github/workflows/ci.yml`'s `checks` job (the only
job branch protection requires), runs:

- ✅ Security audit
- ✅ Formatting checks
- ✅ Linting
- ✅ ~20 data-integrity audits (`npm run audit:*`, `npm run validate:data`, etc.)
- ✅ Build verification
- ✅ Unit tests (Vitest)
- ✅ **E2E smoke tier** (`npm run test:e2e:ci-smoke` = `playwright test --project=smoke`)
  — the explicit allowlist in `playwright.config.ts`'s `SMOKE_SPECS`: routing/title,
  accessibility, timeline freshness badge, trust-tier filtering, the compliance
  persona deep-link, and the ACVP Validation Suite (`e2e/acvp-validator.spec.ts`,
  the only WASM/crypto spec in the allowlist — promoted 2026-08-23 because it
  measured cheap enough to gate every PR rather than wait for nightly).

Two other jobs in the same workflow (`kat-node24`, `gate-cacp`) run targeted
Vitest suites (cross-impl KATs, the CACP/KMIP playground gate) on their own
toolchains, but — unlike `checks` — branch protection does not require them
to pass before merge.

The **nightly** tier, `.github/workflows/e2e-nightly.yml` (cron `0 7 * * *`
UTC + manual `workflow_dispatch`, sharded 2-way), runs the full `chromium`
project — every `e2e/*.spec.ts` except `*.local.spec.ts` — including the
heavy WASM/crypto specs (ML-KEM/ML-DSA, softhsm, OpenSSL, SSH/IKE handshakes)
that would make the per-PR gate flaky or slow at full breadth. **This is not
a required/branch-protected check** — a failure shows up in the Actions run
history (and the uploaded Playwright report artifact), not on the PR itself,
and it cannot block a merge. A regression confined to a nightly-only spec
(anything except `acvp-validator.spec.ts`, which is now also in smoke) can
land on `main` and only surface up to 24h later.

The `local`-only tier (`*.local.spec.ts`) never runs in CI at all — see
`npm run test:e2e:cacp-visual` / `test:e2e:cacp-local` — and the
`mobile-smoke` project (same `SMOKE_SPECS` allowlist, iPhone 14 viewport) is
wired up but **not yet added to `ci.yml`**; run it locally via
`npx playwright test --project=mobile-smoke`.

See `npm run gate:data` / `npm run gate:local` above for checks that run
locally (pre-push) but not in CI at all — a red local gate can and should
block a push even when this CI pipeline would be green.

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
vi.mock('@oqs/liboqs-js', () => ({
  // Mock implementation
}))
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [axe-playwright](https://github.com/abhinaba-ghosh/axe-playwright)
