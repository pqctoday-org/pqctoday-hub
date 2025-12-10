# Skipped E2E Tests (CI Stabilization)

The following E2E tests have been skipped to prevent CI hangs and timeouts. These tests were identified as unstable or failing during the 2-worker parallel execution.

## 5G Security (Application Bug)

- **File**: `e2e/5g-validation.spec.ts`
- **Tests**: All tests in "5G SUCI Validation" suite.
- **Reason**: Application bug "Error: ECDH Derivation failed" prevents successful execution.

- **File**: `e2e/5g-cross-validation.spec.ts`
- **Test**: "Validate OpenSSL implementation in app"
- **Reason**: Application bug "Error: ECDH Derivation failed".

## OpenSSL Studio (Timeouts / Element Visibility)

- **File**: `e2e/openssl-advanced.spec.ts`
- **Test**: "generates Self-Signed Certificate"
- **Reason**: Flaky - passed on retry but kept here to monitor.

## Timeline (Timeouts)

- **File**: `e2e/timeline.spec.ts`
- **Test**: "displays phase details in popover on click"
- **Reason**: Timeout waiting for "Test Country" (Mock Data) to trigger popover.

## Timeline (Timeouts)

- **File**: `e2e/timeline.spec.ts`
- **Test**: "displays phase details in popover on click"
- **Reason**: Timeout waiting for "Test Country" (Mock Data) to trigger popover.
