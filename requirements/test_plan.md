# Master Test Plan

## 1. Overview
This document outlines the testing strategy for the PQC Timeline Application, ensuring functional correctness, visual fidelity, and data integrity across all modules.

## 2. Testing Levels

### 2.1 Unit Testing
- **Framework**: Vitest
- **Scope**: Individual functions, data parsing logic, and isolated components.
- **Location**: `src/**/*.test.ts`
- **Key Areas**:
  - CSV Data Parsing (Threats, Timeline, Leaders).
  - Cryptographic operations (WASM integration).
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

## 3. Feature-Specific Test Plans

### 3.1 ACVP Testing
- **Objective**: Validate cryptographic implementations against NIST test vectors.
- **Details**: See [ACVP Testing Requirements](acvp_testing.md).

### 3.2 Quantum Threat Impacts
- **Objective**: Verify correct parsing and display of threat data.
- **Details**: See [Impacts Requirements - Test Plan](impacts.md#4-test-plan).

### 3.3 OpenSSL Studio
- **Objective**: Verify WASM-based OpenSSL operations.
- **Details**: See [OpenSSL Studio Requirements](opensslstudio.md).

## 4. Continuous Integration
- Tests are run automatically on every commit via GitHub Actions.
- Both Unit and E2E tests must pass before merging.
