# PKI Learning Platform - Learn Feature Requirements (Current Implementation)

**Date:** December 2024
**Status:** Implemented

## Overview
The "Learn" feature is a comprehensive educational platform designed to teach various aspects of cybersecurity and cryptography. While the current implementation focuses on the **PKI Workshop**, the platform is architected to support multiple modules covering different domains.

### Planned Modules
*   **PKI** (Implemented)
*   **5G Security**
*   **Digital Assets**
*   **Digital ID**
*   **TLS**
*   **VPN**

## Module 1: PKI Workshop (Implemented)

The PKI Workshop is the first fully implemented module, featuring a linear 4-step interactive process to teach the fundamental lifecycle of Public Key Infrastructure (PKI) artifacts. It runs entirely in the browser using WebAssembly (OpenSSL) and manages state locally.

The workshop consists of a linear 4-step process:

### Step 1: CSR Generator
**Goal:** Generate a Private Key and a Certificate Signing Request (CSR).

*   **Key Configuration:**
    *   **Source:** Generate New Key or Use Existing Key.
    *   **Algorithms Supported:**
        *   **Classic:**
            *   RSA (2048 bits)
            *   ECDSA (P-256)
            *   EdDSA (Ed25519)
        *   **Quantum-Safe (PQC):**
            *   ML-DSA (Dilithium) - Level 2
            *   SLH-DSA (SPHINCS+) - Level 1
*   **Profile Selection:**
    *   Users select a **CSR Profile** from a dropdown.
    *   **Source:** CSV files located in `src/data/x509_profiles/`.
    *   **Filter:** Files starting with `CSR` and ending in `.csv`.
    *   **Metadata Display:** Displays Industry, Standard, and Date from the selected profile.
*   **X.509 Attributes:**
    *   **Dynamic Table:** Populated based on the selected CSV profile.
    *   **Columns:** Use (Checkbox), Type (SubjectRDN/Extension), Name, Value (Editable), Rec./Desc.
    *   **Validation:** Mandatory fields (Critical=TRUE in CSV) are locked and checked.
*   **Generation Logic:**
    *   **Strict Compliance:** Generates an OpenSSL configuration file (`csr.conf`) dynamically.
    *   **Mapping:**
        *   `SubjectRDN` attributes map to the `[ dn ]` section.
        *   `Extension` attributes map to the `[ req_ext ]` section.
    *   **Command:** `openssl req -new -key private.key -out request.csr -config csr.conf`

### Step 2: Root CA Generator
**Goal:** Create a self-signed Root Certificate Authority (CA).

*   **Key Configuration:**
    *   **High-Security Defaults:**
        *   RSA (4096 bits)
        *   ECDSA (P-521)
        *   EdDSA (Ed448)
        *   ML-DSA (Dilithium) - Level 5
        *   SLH-DSA (SPHINCS+) - Level 5
*   **Profile Selection:**
    *   Users select a **Certificate Profile** from a dropdown.
    *   **Source:** CSV files located in `src/data/x509_profiles/`.
    *   **Filter:** Files starting with `Cert-RootCA` and ending in `.csv`.
*   **Generation Logic:**
    *   **Self-Signed:** Generates a self-signed certificate using the generated key.
    *   **Naming:** Uses timestamped filenames (e.g., `pkiworkshop_ca_<timestamp>.crt`) to ensure uniqueness.
    *   **Tags:** Artifacts are tagged with `root`, `ca`, and the algorithm name.

### Step 3: Certificate Issuance
**Goal:** Sign a CSR using the Root CA created in Step 2.

*   **Process Flow:**
    1.  **Receive & Validate:** Select a CSR from Step 1. The system parses and displays the Subject DN.
    2.  **Select Profile:** Choose an End-Entity Certificate Profile (e.g., `Cert-TLS-Server.csv`).
    3.  **Build Certificate:**
        *   **Attribute Source:** Attributes are clearly labeled as coming from the **CSR** (Blue) or the **CA Profile** (Purple).
        *   **Modifiability:** CSR-derived attributes are locked to ensure integrity. Profile attributes can be modified if allowed.
    4.  **Sign with CA Key:** Select the Root CA Private Key to sign the certificate.
*   **Configuration:**
    *   **Validity:** Configurable validity period (default 365 days).
*   **Output:**
    *   Generates a signed End-Entity Certificate (e.g., `pkiworkshop_cert_<timestamp>.pem`).
    *   Tags: `end-entity`.

### Step 4: Certificate Parser
**Goal:** Inspect and verify the details of any certificate.

*   **Input:**
    *   **Inspect Generated Artifacts:** Dropdown to select any CSR, Root CA, or Signed Certificate generated in previous steps.
    *   **Manual Input:** Text area for pasting PEM encoded certificates.
    *   **Load Example:** Button to load a sample certificate for testing.
*   **Functionality:**
    *   **Parse Details:** Executes `openssl x509 -text` (or `req -text`) to display full details.
    *   **Format Conversion:**
        *   **To DER:** Convert PEM to binary DER format.
        *   **To P7B:** Convert PEM to PKCS#7 format (Certificates only).
    *   **Download:** Direct download links for converted files with correct filenames.

## Technical Implementation

*   **Frontend Framework:** React 18 + TypeScript + Vite.
*   **Cryptography:**
    *   **OpenSSL WASM:** Custom build of OpenSSL 3.5.4 running in a Web Worker.
    *   **Service:** `OpenSSLService` handles asynchronous command execution and file I/O.
*   **State Management:**
    *   **Zustand:** `useModuleStore` manages the state of artifacts (Keys, CSRs, Certificates) and workshop progress.
    *   **Persistence:** State is kept in memory (and optionally persisted to local storage/IndexedDB in the broader architecture).
*   **Data Driven:**
    *   Profiles are defined in CSV format for easy editing and extension.
    *   Vite's `import.meta.glob` is used to dynamically load profiles at build time.
