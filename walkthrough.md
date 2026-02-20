# PQC Timeline Application - Walkthrough

## Overview

The **PQC Timeline Application** is a premium, interactive web experience designed to visualize the global transition to Post-Quantum Cryptography. It combines regulatory timelines, algorithm comparisons, interactive cryptographic testing, a full learning platform, migration planning tools, and risk assessment into a single comprehensive resource.

## Features

### 1. Migration Timeline (`/timeline`)

Interactive Gantt-style visualization of global PQC regulatory milestones. Country filter with active chips, result count, and document table showing phases, organizations, and source links. Data sourced from NIST, NCSC, BSI, ANSSI, and other regulatory bodies.

### 2. Algorithm Comparison (`/algorithms`)

Side-by-side mapping of classical algorithms (RSA, ECC) to their PQC replacements (ML-KEM, ML-DSA, SLH-DSA), with key sizes, performance characteristics, and transition timelines.

### 3. Interactive Playground (`/playground`)

Hands-on cryptographic testing with real WASM-powered operations. KEM encapsulation/decapsulation (X25519, P-256, ML-KEM, hybrid modes), digital signatures (ML-DSA, SLH-DSA, Ed25519), key store management, and ACVP testing against NIST test vectors.

### 4. OpenSSL Studio (`/openssl`)

Browser-based OpenSSL v3.6.0 workbench powered by WebAssembly. 13 operation types including key generation, CSR creation, certificate signing, encryption, hashing, KEM, and LMS/HSS stateful signatures. Virtual file system with upload, edit, download, and ZIP backup.

### 5. Learning Platform (`/learn`)

Comprehensive educational modules, each with a Learn | Simulate | Exercises tab structure:

- **PKI Workshop**: Certificate lifecycle education with hands-on practice (CSR, Root CA, Certificate Issuance, Parsing) and guided exercise scenarios
- **Digital Assets**: Blockchain cryptography deep-dive covering Bitcoin (secp256k1), Ethereum (Keccak-256), Solana (Ed25519), and HD Wallet (BIP32/39/44)
- **5G Security**: Interactive 5G authentication and privacy flows — SUCI deconcealment (Profile A/B/C), 5G-AKA authentication (MILENAGE), and SIM provisioning
- **EU Digital Identity Wallet**: EUDI Wallet ecosystem with Remote HSM, PID issuance, attestation flows, and Remote QES
- **TLS 1.3 Basics**: Interactive TLS 1.3 handshake simulation with PQC key exchange and detailed crypto logging
- **PQC 101 Introduction**: Beginner-friendly module covering quantum threats, Shor's algorithm, at-risk sectors, and HNDL attacks
- **PQC Quiz**: 162 questions across 8 categories with Quick (20), Full (80), and Custom modes

### 6. Migrate Module (`/migrate`)

PQC migration planning with 140+ verified software entries, 7-step migration workflow, framework mappings (NIST, ETSI, CISA), gap analysis, and curated reference resources.

### 7. PQC Risk Assessment (`/assess`)

13-step industry-aware risk evaluation wizard with compound scoring across 4 dimensions (Quantum Exposure, Migration Complexity, Regulatory Pressure, Organizational Readiness). HNDL risk visualization, per-algorithm migration effort estimation, and PDF/print report export.

### 8. Compliance Module (`/compliance`)

Real-time compliance tracking: NIST FIPS documents (203, 204, 205), ANSSI recommendations, and Common Criteria certifications with automated data scraping and visualization.

### 9. Standards Library (`/library`)

Comprehensive PQC standards repository with interactive dependency tree visualization. Organization-based filtering (NIST, IETF, ETSI, ISO) and category grouping.

### 10. Quantum Threat Impacts (`/threats`)

Industry-specific quantum threat analysis dashboard with criticality ratings, "Harvest Now, Decrypt Later" risk scenarios, and links to primary sources.

### 11. Transformation Leaders (`/leaders`)

98+ profiles of key PQC transition figures from public and private sectors.

### 12. PQC Glossary

Global floating glossary with 100+ PQC terms, category filters, A-Z index, complexity badges, and cross-references to learning modules.

### 13. Guided Tour

Interactive first-visit onboarding overlay highlighting key platform features and navigation.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7.3.1
- **Cryptography**: OpenSSL WASM v3.6.0, `@openforge-sh/liboqs`, Web Crypto API, `@noble/curves`, `@noble/hashes`, `micro-eth-signer`
- **Styling**: Tailwind CSS 4.1 with custom design system and CSS variables
- **State Management**: Zustand with localStorage persistence
- **Icons**: Lucide React
- **Animations**: Framer Motion

## How to Run

1. Navigate to the project directory:

   ```bash
   cd pqc-timeline-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5175`.

## Verification

- **Build**: The project builds successfully (`npm run build`).
- **Linting**: All lint checks pass (`npm run lint`).
- **Testing**: Unit tests (`npm run test`) and E2E tests (`npm run test:e2e`).
- **Responsiveness**: The layout adapts to mobile and desktop screens.
