# PQC Timeline App - Test Plan

**Status:** ✅ Implemented  
**Last Updated:** 2025-12-11

> **Note**: This document provides a high-level testing strategy. Comprehensive E2E tests are located in `/e2e` directory with detailed test scenarios for each feature.

This document outlines the testing strategy for the PQC Timeline Application, ensuring functional correctness, visual fidelity, and data integrity across all modules.

## 2. Testing Levels

### 2.1 Unit Testing

- **Framework**: Vitest
- **Scope**: Individual functions, data parsing logic, and isolated components.
- **Location**: `src/**/*.test.ts`
  - **Key Areas**:
  - CSV Data Parsing (Threats, Timeline, Leaders).
  - Cryptographic operations (WASM integration).
  - **OpenSSL Studio UI**:
    - `OpenSSLStudioTabs.test.tsx`: Verifies tab switching and header logic.
    - `LogsTab.test.tsx`: Verifies log table rendering, columns, and data formatting.
  - Utility functions.

### 2.2 End-to-End (E2E) Testing

- **Framework**: Playwright
- **Scope**: Full application workflows, UI rendering, and navigation.
- **Location**: `e2e/**/*.spec.ts`
- **Key Areas**:
  - Navigation between modules.
  - Dashboard rendering and filtering.
  - Interactive Playground functionality.
  - OpenSSL Studio file operations.
  - **Library View**: Region filter, Expand/Collapse (`library.spec.ts`).
  - **Threats Dashboard**: Popup details and URL verification (`impacts-popup.spec.ts`).

## 3. Feature-Specific Test Plans

### 3.1 ACVP Testing

- **Objective**: Validate cryptographic implementations against NIST test vectors.
- **Details**: See [Playground Requirements - ACVP Testing](playground.md#11-acvp-testing-automated-cryptographic-validation).
- **Test Scenarios**:
  - Import ACVP test keys for all ML-KEM and ML-DSA variants
  - Run automated validation suite
  - Verify all tests pass (100% success rate)
  - Validate error handling for corrupted test vectors

### 3.2 Quantum Threat Impacts

- **Objective**: Verify correct parsing and display of threat data.
- **Details**: See [Impacts Requirements - Test Plan](impacts.md#4-test-plan).
- **Test Scenarios**:
  - Load and parse CSV threat data (including `sourceUrl`)
  - Display threats grouped by industry
  - Filter by criticality level
  - **Detailed Popup**: Verify clicking "Info" opens details popup
  - **Source Link**: Verify reference link in popup is valid

### 3.3 OpenSSL Studio

- **Objective**: Verify WASM-based OpenSSL operations.
- **Details**: See [OpenSSL Studio Requirements](opensslstudio.md).
- **Test Scenarios**:
  - Generate RSA, EC, Ed25519, ML-KEM, ML-DSA keys
  - Create CSRs with various profiles
  - Sign certificates with Root CA
  - Verify file manager operations (upload, download, delete)
  - Test encryption/decryption workflows

### 3.4 Interactive Playground

- **Test Scenarios**:
  - Generate keys for all supported algorithms
  - Perform KEM operations (encapsulate/decapsulate)
  - Sign and verify messages
  - Test key store sorting and filtering
  - Validate backup and restore functionality
  - Verify mode switching (Mock ↔ WASM)

### 3.5 Timeline Visualization

- **Test Scenarios**:
  - Load timeline data from CSV
  - Render Gantt chart with all countries
  - Filter by country and organization
  - Open and close event popovers
  - Test mobile swipeable timeline
  - Verify phase indicators and navigation

### 3.6 PKI Learning Platform

- **Test Scenarios**:
  - Complete full PKI Workshop workflow (4 steps)
  - Generate CSRs with different profiles
  - Create Root CA certificates
  - Issue end-entity certificates
  - Parse and verify certificates
  - **Digital Assets Flows**:
    - **Bitcoin**: Verify KeyGen (P2PKH address), Transaction signing, and OpenSSL verification.
    - **Ethereum**:
      - Verify KeyGen and Address derivation (Keccak-256 + EIP-55 checksum).
      - **Critical**: Verify Signature Recovery (ensure `v` parameter is calculated specifically for the source address).
      - **Critical**: Verify OpenSSL Signature matches JS recovery (ensure no "double hashing" artifacts).
    - **Solana**: Verify Ed25519 KeyGen and raw message signing (ensure correct `-rawin` usage).
  - **UI Consistency**: Verify that displayed OpenSSL commands in UI match the actual execution logic (using `DIGITAL_ASSETS_CONSTANTS`).

### 3.7 Accessibility

- **Test Scenarios**:
  - Keyboard navigation through all features
  - Screen reader compatibility (NVDA, VoiceOver)
  - Color contrast validation (4.5:1 minimum)
  - Focus indicator visibility
  - ARIA label correctness
  - Form label associations

## 4. Coverage Targets

### 4.1 Unit Test Coverage

- **Target**: 80% code coverage minimum
- **Critical Paths**: 95% coverage for:
  - Cryptographic operations
  - Data parsing (CSV, JSON)
  - State management (Zustand stores)
  - Utility functions

### 4.2 E2E Test Coverage

- **Target**: 100% of user-facing features
- **Critical Workflows**:
  - Complete playground workflow (generate → sign → verify)
  - Complete OpenSSL Studio workflow (key → CSR → cert)
  - Complete PKI Workshop (all 4 steps)
  - Navigation between all major features

### 4.3 Accessibility Coverage

- **Target**: 0 axe-playwright violations
- **Manual Testing**: All features tested with keyboard and screen reader

## 5. Continuous Integration

### 5.1 GitHub Actions Workflow

- **Trigger**: Every commit and pull request
- **Jobs**:
  1. **Lint**: ESLint and Prettier checks
  2. **Type Check**: TypeScript compilation
  3. **Unit Tests**: Vitest with coverage report
  4. **E2E Tests**: Playwright on multiple browsers
  5. **Accessibility**: axe-playwright automated checks
  6. **Build**: Production build verification

### 5.2 Test Execution Matrix

| Browser  | Unit Tests | E2E Tests | Accessibility |
| -------- | ---------- | --------- | ------------- |
| Chromium | ✅         | ✅        | ✅            |
| Firefox  | ✅         | ✅        | ✅            |
| WebKit   | ✅         | ✅        | ✅            |

### 5.3 Merge Requirements

- ✅ All lint checks pass
- ✅ All unit tests pass (80%+ coverage)
- ✅ All E2E tests pass on all browsers
- ✅ 0 accessibility violations
- ✅ Production build succeeds
- ✅ No TypeScript errors

## 6. Test Data Management

### 6.1 Mock Data

- **Location**: `src/data/mockTimelineData.ts`
- **Usage**: E2E tests use mock data for stability
- **Environment Variable**: `VITE_MOCK_DATA=true` in `playwright.config.ts`

### 6.2 Test Vectors

- **ACVP**: `src/data/acvp/` - NIST test vectors for ML-KEM and ML-DSA
- **X.509 Profiles**: `src/data/x509_profiles/` - Certificate profiles for PKI Workshop

### 6.3 Fixtures

- **Playwright Fixtures**: `e2e/fixtures/` - Reusable test fixtures
- **Vitest Fixtures**: Test data embedded in test files

## 7. Performance Testing

### 7.1 Metrics

- **Page Load**: < 3 seconds on 3G connection
- **WASM Operations**:
  - Key Generation: < 1 second
  - Sign/Verify: < 500ms
  - Encapsulate/Decapsulate: < 500ms
- **UI Responsiveness**: No blocking operations

### 7.2 Lighthouse Scores

- **Performance**: > 90
- **Accessibility**: 100
- **Best Practices**: > 90
- **SEO**: > 90

## 8. Regression Testing

### 8.1 Critical Paths

- Timeline data loading and rendering
- Playground cryptographic operations
- OpenSSL Studio WASM integration
- PKI Workshop certificate generation
- Theme switching (light/dark)

### 8.2 Regression Suite

- **Frequency**: Run on every PR
- **Scope**: All E2E tests + critical unit tests
- **Failure Threshold**: 0 failures allowed

## 9. Manual Testing Checklist

### 9.1 Pre-Release Testing

- [ ] Test on real mobile devices (iOS, Android)
- [ ] Verify all external links work
- [ ] Test file upload/download on all browsers
- [ ] Verify analytics tracking (GA4)
- [ ] Test theme persistence across sessions
- [ ] Verify SBOM accuracy in About page

### 9.2 Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## 10. Test Maintenance

### 10.1 Test Review

- **Frequency**: Quarterly
- **Focus**: Remove obsolete tests, update for new features
- **Owner**: Development team

### 10.2 Flaky Test Management

- **Policy**: Fix or skip flaky tests immediately
- **Tracking**: GitHub Issues with "flaky-test" label
- **Resolution**: Root cause analysis required

## 11. Resources

### 11.1 Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [axe-playwright](https://github.com/abhinaba-ghosh/axe-playwright)

### 11.2 Test Execution

```bash
# Run all unit tests
npm run test

# Run unit tests with coverage
npm run coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npx playwright test --ui

# Run specific test file
npm run test src/components/Playground/Playground.test.tsx
```

## 12. Summary

This test plan ensures comprehensive coverage of the PQC Timeline Application through:

- **Unit Tests**: 80%+ code coverage
- **E2E Tests**: 100% feature coverage across 3 browsers
- **Accessibility Tests**: 0 violations policy
- **CI/CD Integration**: Automated testing on every commit
- **Performance Monitoring**: Lighthouse scores tracked

All tests must pass before code can be merged to main branch.
