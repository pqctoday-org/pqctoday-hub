# PKI Learning Platform - Learn Feature Requirements (Current Implementation)

**Date:** December 2024
**Status:** Implemented

## Overview

The "Learn" feature is a comprehensive educational platform designed to teach various aspects of cybersecurity and cryptography. While the current implementation focuses on the **PKI Workshop**, the platform is architected to support multiple modules covering different domains.

### Planned Modules

- **PKI** (Implemented)
- **Digital Assets** (Implemented)
- **5G Security** (Implemented)
- **Digital ID / EUDI** (Implemented)
- **TLS**
- **VPN**

## Module 1: PKI Workshop (Implemented)

The PKI Workshop is the first fully implemented module, featuring a linear 4-step interactive process to teach the fundamental lifecycle of Public Key Infrastructure (PKI) artifacts. It runs entirely in the browser using WebAssembly (OpenSSL) and manages state locally.

The workshop consists of a linear 4-step process:

### Step 1: CSR Generator

**Goal:** Generate a Private Key and a Certificate Signing Request (CSR).

- **Key Configuration:**
  - **Source:** Generate New Key or Use Existing Key.
  - **Algorithms Supported:**
    - **Classic:**
      - RSA (2048 bits)
      - ECDSA (P-256)
      - EdDSA (Ed25519)
    - **Quantum-Safe (PQC):**
      - ML-DSA-44 (Dilithium) - Level 2
      - ML-DSA-65 (Dilithium) - Level 3
      - SLH-DSA-SHA2-128s (SPHINCS+) - Level 1 (small sig)
      - SLH-DSA-SHA2-128f (SPHINCS+) - Level 1 (fast sign)
      - SLH-DSA-SHA2-192s (SPHINCS+) - Level 3 (small sig)
      - SLH-DSA-SHA2-192f (SPHINCS+) - Level 3 (fast sign)
- **Profile Selection:**
  - Users select a **CSR Profile** from a dropdown.
  - **Source:** CSV files located in `src/data/x509_profiles/`.
  - **Filter:** Files starting with `CSR` and ending in `.csv`.
  - **Metadata Display:** Displays Industry, Standard, and Date from the selected profile.
- **X.509 Attributes:**
  - **Dynamic Table:** Populated based on the selected CSV profile.
  - **Columns:** Use (Checkbox), Type (SubjectRDN/Extension), Name, Value (Editable), Rec./Desc.
  - **Validation:** Mandatory fields (Critical=TRUE in CSV) are locked and checked.
- **Generation Logic:**
  - **Strict Compliance:** Generates an OpenSSL configuration file (`csr.conf`) dynamically.
  - **Mapping:**
    - `SubjectRDN` attributes map to the `[ dn ]` section.
    - `Extension` attributes map to the `[ req_ext ]` section.
  - **Command:** `openssl req -new -key private.key -out request.csr -config csr.conf`

### Step 2: Root CA Generator

**Goal:** Create a self-signed Root Certificate Authority (CA).

- **Key Configuration:**
  - **High-Security Defaults:**
    - RSA (4096 bits)
    - ECDSA (P-521)
    - EdDSA (Ed448)
    - ML-DSA-87 (Dilithium) - Level 5
    - SLH-DSA-SHA2-256s (SPHINCS+) - Level 5 (small sig)
    - SLH-DSA-SHA2-256f (SPHINCS+) - Level 5 (fast sign)
- **Profile Selection:**
  - Users select a **Certificate Profile** from a dropdown.
  - **Source:** CSV files located in `src/data/x509_profiles/`.
  - **Filter:** Files starting with `Cert-RootCA` and ending in `.csv`.
- **Generation Logic:**
  - **Self-Signed:** Generates a self-signed certificate using the generated key.
  - **Naming:** Uses timestamped filenames (e.g., `pkiworkshop_ca_<timestamp>.crt`) to ensure uniqueness.
  - **Tags:** Artifacts are tagged with `root`, `ca`, and the algorithm name.

### Step 3: Certificate Issuance

**Goal:** Sign a CSR using the Root CA created in Step 2.

- **Process Flow:**
  1.  **Receive & Validate:** Select a CSR from Step 1. The system parses and displays the Subject DN.
  2.  **Select Profile:** Choose an End-Entity Certificate Profile (e.g., `Cert-TLS-Server.csv`).
  3.  **Build Certificate:**
      - **Attribute Source:** Attributes are clearly labeled as coming from the **CSR** (Blue) or the **CA Profile** (Purple).
      - **Modifiability:** CSR-derived attributes are locked to ensure integrity. Profile attributes can be modified if allowed.
  4.  **Sign with CA Key:** Select the Root CA Private Key to sign the certificate.
- **Configuration:**
  - **Validity:** Configurable validity period (default 365 days).
- **Output:**
  - Generates a signed End-Entity Certificate (e.g., `pkiworkshop_cert_<timestamp>.pem`).
  - Tags: `end-entity`.

### Step 4: Certificate Parser

**Goal:** Inspect and verify the details of any certificate.

- **Input:**
  - **Inspect Generated Artifacts:** Dropdown to select any CSR, Root CA, or Signed Certificate generated in previous steps.
  - **Manual Input:** Text area for pasting PEM encoded certificates.
  - **Load Example:** Button to load a sample certificate for testing.
- **Functionality:**
  - **Parse Details:** Executes `openssl x509 -text` (or `req -text`) to display full details.
  - **Format Conversion:**
    - **To DER:** Convert PEM to binary DER format.
    - **To P7B:** Convert PEM to PKCS#7 format (Certificates only).
  - **Download:** Direct download links for converted files with correct filenames.

## Module 2: Digital Assets Program (Implemented)

The Digital Assets Program provides an interactive, deep-dive into the cryptographic primitives powering major blockchains. It allows users to execute real cryptographic commands in the browser to generate keys, derive addresses, and sign transactions.

**Key Features:**

- **Hybrid Architecture:** Combines OpenSSL (for standard primitives like secp256k1, SHA256) with specialized JavaScript libraries (for blockchain-specific formats like Base58Check, Bech32, Keccak-256).
- **Interactive Flows:** Step-by-step execution with real-time output visualization.

### Supported Flows

#### 1. Bitcoin (BTC)

- **Key Generation:** ECDSA secp256k1 via OpenSSL.
- **Hashing:** SHA256 and RIPEMD160 via OpenSSL.
- **Address Generation:** Legacy (P2PKH) and SegWit (Bech32) using `@scure/base`.
- **Signing:** ECDSA transaction signing and verification.

#### 2. Ethereum (ETH)

- **Key Generation:** ECDSA secp256k1 via OpenSSL.
- **Hashing:** Keccak-256 via `@noble/hashes` (OpenSSL SHA3 is incompatible).
- **Address Generation:** EIP-55 Checksum address.
- **Signing:** EIP-1559 style transaction signing.

#### 3. Solana (SOL)

- **Key Generation:** Ed25519 via OpenSSL.
- **Address Generation:** Base58 encoding of the public key.
- **Signing:** EdDSA message signing and verification.

#### 4. HD Wallet (BIP32/39/44)

- **Mnemonic:** Generate 24-word BIP39 mnemonic from OpenSSL entropy.
- **Seed:** Derive 512-bit binary seed using PBKDF2.
- **Multi-Chain Derivation:**
  - Bitcoin: `m/44'/0'/0'/0/0`
  - Ethereum: `m/44'/60'/0'/0/0`
  - Solana: `m/44'/501'/0'/0'` (SLIP-0010)

## Technical Implementation

- **Frontend Framework:** React 18 + TypeScript + Vite.
- **Cryptography:**
  - **OpenSSL WASM:** Custom build of OpenSSL 3.5.4 running in a Web Worker.
  - **Service:** `OpenSSLService` handles asynchronous command execution and file I/O.
  - **JS Libraries:** `@scure/bip39`, `@scure/bip32`, `@scure/base`, `@noble/hashes`, `@noble/curves` for blockchain-specific operations.
- **State Management:**
  - **Zustand:** `useModuleStore` manages the state of artifacts (Keys, CSRs, Certificates) and workshop progress.
  - **Custom Hooks:** Shared logic extracted into `useKeyGeneration`, `useArtifactManagement`, and `useFileRetrieval` to reduce code duplication (~40% reduction).
  - **Persistence:** State is kept in memory (and optionally persisted to local storage/IndexedDB in the broader architecture).
- **Data Driven:**
  - Profiles are defined in CSV format for easy editing and extension.
  - Vite's `import.meta.glob` is used to dynamically load profiles at build time.

## Quality Assurance & Testing

### Testing Strategy

- **Unit Testing:** Comprehensive coverage using `vitest` for React components and hooks.
  - Coverage includes: `EthereumFlow`, `BitcoinFlow`, `SolanaFlow`, and shared hooks.
  - Mocks: OpenSSL service and StepWizard are fully mocked for isolated testing.
- **End-to-End (E2E) Testing:** Playwright is used for full user journey verification.
  - **Ethereum Flow:** Complete coverage of the 9-step process (KeyGen -> Tx -> Sign -> Verify).
  - **HD Wallet:** Regression testing for UI refactors and derivation correctness.
  - **Environment:** Tests run in headless browsers (Chromium, Firefox, WebKit) against a local dev server.

### Maintainability Improvements

- **Strict Typing:** All critical hooks (e.g., `useEthereum*`) utilize explicit return types to prevent `any` leakage.
- **Refactoring:**
  - **Modularization:** Complex flows (like Ethereum) are split into smaller, testable sub-components and hooks.
  - **Consistency:** UI layouts (e.g., HD Wallet) are actively unified to match the design language of primary modules (Bitcoin).

## Module 3: 5G Security (Implemented)

The 5G Security module provides an interactive simulation of 5G subscriber authentication and privacy protection mechanisms.

**Key Features:**

- **SUCI Deconcealment:** Simulate the decryption of Subscription Concealed Identifiers (SUCI) using:
  - **Profile A:** Curve25519 (ECIES)
  - **Profile B:** secp256r1 (ECIES)
  - **Profile C:** ML-KEM-768 (Post-Quantum)
- **5G-AKA Authentication:** Step-by-step execution of the Authentication and Key Agreement protocol using the MILENAGE algorithm set.
- **Reference:** [Detailed 5G Requirements](5G_Security_Educational_Module_Requirements.md)

## Module 4: EU Digital Identity Wallet (Implemented)

This module simulates the ecosystem of the European Digital Identity (EUDI) Wallet, focusing on the Remote HSM architecture.

**Key Features:**

- **PID Issuance:** Mobile Driving License (mDL) issuance flow.
- **Remote HSM:** Centralized cryptographic operations (Key Generation, Signing) via simulated Hardware Security Modules.
- **Attestations:** Verifiable credential presentation for various use cases (e.g., Bank Account Opening).
- **Reference:** [Detailed EUDI Wallet Requirements](EUDI_Wallet_Educational_Module_Requirements.md)
