# OpenSSL Studio - Test Scripts Documentation

## Overview

This document describes the E2E test suite for OpenSSL Studio, covering all major features and workflows.

## Test Files

### 1. `openssl.spec.ts` - Core Functionality Tests
Basic tests for fundamental OpenSSL operations:
- Key generation (Ed25519, X25519, Ed448, X448)
- Random data generation
- Version information display

### 2. `openssl-pqc.spec.ts` - Post-Quantum Cryptography Tests
Tests for PQC algorithms:
- **ML-DSA** (FIPS 204): Digital signatures (ML-DSA-44, ML-DSA-65, ML-DSA-87)
- **SLH-DSA** (FIPS 205): Stateless hash-based signatures (all SHA2 variants)
- **ML-KEM** (FIPS 203): Key encapsulation (ML-KEM-512, ML-KEM-768, ML-KEM-1024)

### 3. `openssl-new-features.spec.ts` - New Features Integration Tests
Comprehensive tests for newly implemented features:

#### Test: Encryption and Decryption (AES-256-CBC)
- Creates test data file
- Encrypts file with passphrase
- Decrypts encrypted file
- Verifies passphrase-based key derivation

#### Test: Key Encapsulation (ML-KEM)
**Complete workflow demonstrating public key extraction requirement:**
1. Generate ML-KEM-768 key (creates `.key` file)
2. **Extract public key** (creates `.pub` file) - **REQUIRED STEP**
3. Encapsulate using public key (`.pub`)
4. Decapsulate using private key (`.key`)
5. Verify secret recovery

> [!IMPORTANT]
> ML-KEM keys are generated as `.key` files (private keys). For encapsulation operations, you **must** extract the public key first using the "Extract Public Key" button in the Key Files tab. This creates a `.pub` file that can be used for encapsulation.

#### Test: PKCS#12 Export and Import
- Generates RSA key and certificate
- Exports to `.p12` bundle with password
- Imports from `.p12` back to `.pem`

### 4. `openssl-iv.spec.ts` - Encryption IV Support Tests
Tests for Initialization Vector (IV) features:

#### Test: Encryption with Show Key & IV (-p)
- Encrypts with `-p` flag
- Verifies output contains `salt=`, `key=`, and `iv=`
- Demonstrates passphrase-based key derivation

#### Test: Encryption with Custom IV
- Encrypts with custom IV in hex format
- Verifies custom IV is used (via `-p` flag output)
- Confirms IV parameter is correctly passed to OpenSSL

### 5. `openssl-advanced.spec.ts` - Advanced Operations
Tests for complex workflows and edge cases.

### 6. `openssl-debug-providers.spec.ts` - Debug/Diagnostic Tests
Tests for debugging OpenSSL provider configuration and capabilities.

## Running Tests

### Run all tests
```bash
npx playwright test e2e/openssl*.spec.ts
```

### Run specific test file
```bash
npx playwright test e2e/openssl-new-features.spec.ts
```

### Run with specific browser
```bash
npx playwright test e2e/openssl-new-features.spec.ts --project=chromium
```

### Run in headed mode (see browser)
```bash
npx playwright test e2e/openssl-new-features.spec.ts --headed
```

### Run with debug output
```bash
npx playwright test e2e/openssl-new-features.spec.ts --debug
```

## Key Workflows Tested

### 1. Passphrase-Based Encryption
```
Create Data → Encrypt (with passphrase) → Decrypt (with passphrase)
```
- No separate key generation needed
- Key and IV derived from passphrase using PBKDF

### 2. ML-KEM Key Encapsulation
```
Generate ML-KEM Key → Extract Public Key → Encapsulate (with .pub) → Decapsulate (with .key)
```
- **Critical**: Public key extraction is required
- `.key` file contains private key (for decapsulation)
- `.pub` file contains public key (for encapsulation)

### 3. PKCS#12 Certificate Bundling
```
Generate Key → Generate Cert → Export to .p12 → Import from .p12
```
- Password-protected bundle
- Contains both certificate and private key

## Important Notes

### AES Key Generation
❌ **Not Supported**: `openssl genpkey -algorithm AES` is not supported by OpenSSL.
- AES is a symmetric cipher, not an asymmetric algorithm
- `genpkey` is designed for asymmetric key generation (RSA, EC, etc.)

✅ **Use Instead**: Passphrase-based encryption via `openssl enc`
- Automatically derives key and IV from passphrase
- Standard approach for symmetric encryption with OpenSSL

### Public Key Extraction
For KEM operations (and other public-key operations), you must extract the public key from the private key:
1. Navigate to **Key Files** tab
2. Find your `.key` file
3. Click the **🔑 Extract Public Key** button
4. A `.pub` file will be created
5. Use `.pub` for encapsulation, `.key` for decapsulation

### Test Debugging
All tests include:
- Browser console log capture
- Terminal output logging on failure
- Automatic screenshot on failure (Playwright default)

To view detailed output when tests fail, check:
- Console output (shows BROWSER LOG and TERMINAL OUTPUT)
- `test-results/` directory for screenshots and traces
- HTML report: `npx playwright show-report`

## Coverage Summary

| Feature | Test File | Status |
|---------|-----------|--------|
| Key Generation (Classical) | `openssl.spec.ts` | ✅ |
| Key Generation (PQC) | `openssl-pqc.spec.ts` | ✅ |
| Public Key Extraction | `openssl-new-features.spec.ts` | ✅ |
| Encryption/Decryption | `openssl-new-features.spec.ts` | ✅ |
| IV Support | `openssl-iv.spec.ts` | ✅ |
| KEM (ML-KEM) | `openssl-new-features.spec.ts`, `openssl-pqc.spec.ts` | ✅ |
| PKCS#12 | `openssl-new-features.spec.ts` | ✅ |
| Sign/Verify | `openssl-pqc.spec.ts` | ✅ |
| Random Data | `openssl.spec.ts` | ✅ |
| Version Info | `openssl.spec.ts` | ✅ |
