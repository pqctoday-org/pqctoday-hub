# Skipped E2E Tests

Last reviewed: 2026-02-20

The following E2E tests are currently skipped. Tests are grouped by reason.

## Application Bugs

### 5G Cross-Validation — ECDH Derivation Failure

- **File**: `e2e/5g-cross-validation.spec.ts`
- **Test**: "Validate OpenSSL implementation in app" (line 265)
- **Reason**: Application bug — "Error: ECDH Derivation failed" prevents successful execution.

## Flaky / Unstable Tests

### OpenSSL Studio — Self-Signed Certificate

- **File**: `e2e/openssl-advanced.spec.ts`
- **Test**: "generates Self-Signed Certificate" (line 43)
- **Reason**: Flaky — passes on retry but inconsistent in CI.

### OpenSSL Studio — New Features (Entire Suite)

- **File**: `e2e/openssl-new-features.spec.ts`
- **Test**: Entire `describe` block skipped (line 3)
- **Reason**: WASM instability in CI with advanced Encryption, KEM, and PKCS#12 features.

### OpenSSL Studio — Deterministic ECDSA (Entire Suite)

- **File**: `e2e/openssl-ecdsa-deterministic.spec.ts`
- **Test**: Entire `describe` block skipped (line 3)
- **Reason**: Deterministic ECDSA verification instability.

### OpenSSL Studio — File Upload

- **File**: `e2e/openssl-add-file.spec.ts`
- **Test**: "should allow uploading a file to the VFS" (line 4)
- **Reason**: File upload interaction unreliable in headless CI.

## Browser-Specific Skips

### PKI Workshop — Firefox

- **File**: `e2e/pki-workshop.spec.ts`
- **Test**: All tests in suite (line 24)
- **Condition**: `browserName === 'firefox'`
- **Reason**: Firefox has WASM/Rendering instability in CI.

### OpenSSL IV Operations — WebKit

- **File**: `e2e/openssl-iv.spec.ts`
- **Test**: All tests in suite (line 6)
- **Condition**: `browserName === 'webkit'`
- **Reason**: WebKit has UI rendering instability in CI.

### TLS Basics — Clipboard (Non-Chromium)

- **File**: `e2e/v1_7_0-tls-basics.spec.ts`
- **Test**: Clipboard-related test (line 261)
- **Condition**: `browserName !== 'chromium'`
- **Reason**: Clipboard permissions API only supported in Chromium.
