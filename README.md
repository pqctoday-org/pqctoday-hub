# PQC Timeline App

Test your PQC readiness with this interactive web application visualizing the global transition to Post-Quantum Cryptography.

## Features

- **Migration Timeline**: Global regulatory recommendations and migration phases visualization
  - Country filter with active filter chips, result count, and empty state
  - Document table: select a country to see all its phases/milestones in a structured table
    with organization, phase type, title, period, description, and source links
- **Algorithm Comparison**: Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) transition table
- **Interactive Playground**: Hands-on cryptographic testing environment
  - Real WASM-powered cryptography (`@openforge-sh/liboqs`)
  - **KEM Operations**: Classical (X25519, P-256), PQC (ML-KEM), and Hybrid modes
    - Separate encapsulation/decapsulation flows with state isolation
    - HKDF-Extract normalization for variable-sized secrets
    - Visual comparison of generated vs recovered secrets
  - Key Store with sortable/resizable columns
  - ACVP Testing against NIST test vectors
- **OpenSSL Studio**: Browser-based OpenSSL v3.6.0 workbench powered by WebAssembly
  - **13 Operation Types**: Key Generation, CSR, Certificate, Sign/Verify, Random, Version, Encryption, Hashing, KEM, PKCS#12, LMS/HSS
  - **Full PQC Support**: ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA (all 12 variants), LMS/HSS (stateful signatures)
  - **Classical Algorithms**: RSA, EC (P-256/384/521, secp256k1), Ed25519, X25519, Ed448, X448
  - **Virtual File System**: Upload, edit, download, backup/restore with ZIP
  - **File Manager**: Sortable columns, timestamps, size tracking, public key extraction
- **Learning Platform**: Comprehensive educational modules for cryptography and security
  - **PKI Workshop**: 4-step certificate lifecycle (CSR → Root CA → Certificate Issuance → Parsing)
    - CSV-based X.509 profiles for industry standards
    - Support for classical and post-quantum algorithms
  - **Digital Assets Program**: Blockchain cryptography deep-dive
    - **Bitcoin (BTC)**: secp256k1, P2PKH/SegWit addresses, ECDSA signing, double SHA256
    - **Ethereum (ETH)**: Keccak-256, EIP-55 checksummed addresses, EIP-1559 transactions, signature recovery
    - **Solana (SOL)**: Ed25519, Base58 addresses, EdDSA signing
    - **HD Wallet**: BIP32/39/44 multi-chain derivation (m/44'/0'/0'/0/0 for BTC, m/44'/60'/0'/0/0 for ETH, m/44'/501'/0'/0' for SOL)
  - **5G Security Education**: Interactive 5G authentication and privacy flows
    - **SUCI Deconcealment**: Profile A (Curve25519), Profile B (secp256r1), Profile C (ML-KEM-768 PQC)
    - **5G-AKA Authentication**: MILENAGE algorithm set (f1-f5 functions) with HSM integration
  - **EU Digital Identity Wallet**: EUDI Wallet ecosystem with Remote HSM architecture
    - **PID Issuance**: Mobile Driving License (mDL) per ISO/IEC 18013-5
    - **Attestations**: QEAA, PuB-EAA, and EAA issuance flows
    - **Remote QES**: Qualified Electronic Signature via CSC API
    - **Protocols**: OpenID4VCI, OpenID4VP for credential exchange
  - **TLS 1.3 Basics**: Interactive TLS 1.3 handshake simulation and cryptographic logging
    - **Dual Configuration**: GUI controls and raw OpenSSL config file editing
    - **Identity Options**: RSA, ML-DSA (Post-Quantum), and custom certificates
    - **Crypto Visibility**: Detailed key derivation, HKDF, signature, and encryption logs
    - **PQC Support**: ML-KEM (Kyber) key exchange and ML-DSA/SLH-DSA signatures
  - **PQC 101 Introduction**: Beginner-friendly module covering quantum threats, Shor's algorithm, at-risk sectors, and HNDL attacks
  - **PQC Quiz**: Interactive knowledge assessment with 70+ questions across 8 categories
    - **3 Modes**: Quick (20 random), Full (all questions), Custom (by topic)
    - **Categories**: PQC Fundamentals, Algorithm Families, NIST Standards, Migration Planning, Compliance, Protocol Integration, Industry Threats, Crypto Operations
    - **Score Tracking**: Per-category highest scores persisted across sessions
- **Migrate Module**: Comprehensive PQC migration planning with structured workflow
  - **Verified Database**: 140+ verified PQC-ready software entries (OS, Libraries, Network, etc.)
  - **7-Step Migration Workflow**: Assess, Plan, Pilot, Implement, Test, Optimize, Measure
  - **Framework Mappings**: NIST, ETSI, and CISA guideline alignment
  - **Gap Analysis**: Software category coverage assessment with priority matrix
  - **Reference Panel**: Curated authoritative migration resources
  - **Change Tracking**: "New" and "Updated" indicators for recent PQC landscape changes
  - **Filtering**: Deep filtering by category, platform, and industry
- **PQC Risk Assessment** (`/assess`): Comprehensive 12-step quantum risk evaluation wizard
  - Compound scoring engine with 4 risk dimensions: Quantum Exposure, Migration Complexity, Regulatory Pressure, Organizational Readiness
  - HNDL Risk Window visualization: data retention vs. quantum threat timeline
  - Per-algorithm migration effort estimation (quick-win to multi-year)
  - Executive summary, category breakdowns, and URL-shareable assessments
  - Enhanced CSV export with effort ratings and rationale
- **PQC Glossary**: Global floating glossary with 100+ PQC terms
  - Category filters, A-Z index, full-text search
  - Complexity badges (Beginner, Intermediate, Advanced)
  - Cross-references to learning modules
- **Guided Tour**: Interactive first-visit onboarding overlay
  - Highlights key platform features and navigation
  - Remembers completion status
- **Compliance Module**: Real-time compliance tracking and standards monitoring
  - NIST FIPS document tracking (203, 204, 205)
  - ANSSI recommendations
  - Common Criteria certifications
  - Automated data scraping and visualization
- **Standards Library**: Comprehensive PQC standards repository
  - NIST FIPS documents (203, 204, 205)
  - Protocol specifications (TLS, SSH, IKEv2)
  - **Dynamic Tree Visualization**: Interactive dependency hierarchy (Standards → Profiles → Guidelines)
  - **Advanced Filtering**: Region-based scoping (Global, US, EU) and category grouping
- **Quantum Threat Impacts**: Industry-specific quantum threat analysis
  - Interactive dashboard with criticality ratings
  - **Detailed Threat Insights**: Popups with specific "Harvest Now, Decrypt Later" risks and PQC mitigations
  - Direct access to primary source references for each threat
- **Transformation Leaders**: 115+ comprehensive profiles of key PQC transition figures

> 📋 See [REQUIREMENTS.md](REQUIREMENTS.md) for detailed specifications of each feature.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7.3.1
- **Cryptography**:
  - OpenSSL WASM v3.6.0 (with native ML-KEM, ML-DSA, and LMS/HSS support)
  - `@openforge-sh/liboqs` for additional PQC algorithms (FrodoKEM, HQC, Classic McEliece)
  - Web Crypto API for classical algorithms (X25519, P-256, ECDH)
  - `@noble/curves` and `@noble/hashes` for blockchain operations
  - `@scure/bip32`, `@scure/bip39`, `@scure/base` for HD wallet
  - `micro-eth-signer` for Ethereum transactions
  - `ed25519-hd-key` for Solana key derivation
- **Styling**: Tailwind CSS 4.1.17 with custom design system and CSS variables
- **State Management**: Zustand for module state and persistence
- **Data Processing**: Papa Parse (CSV), JSZip (file backup), LocalForage (storage)
- **UI/UX**: Framer Motion (animations), React Markdown (documentation)
- **Testing**: Vitest + React Testing Library + Playwright

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/pqctoday/pqc-timeline-app.git
   cd pqc-timeline-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5175`.

### Building for Production

Build the application for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## Contributing

We welcome contributions! Please follow these steps:

1.  **Fork the repository**.
2.  **Create a feature branch**: `git checkout -b feature/my-new-feature`.
3.  **Commit your changes**: `git commit -m 'Add some feature'`.
4.  **Push to the branch**: `git push origin feature/my-new-feature`.
5.  **Open a Pull Request**.

### Testing & Linting

Before submitting a PR, please ensure all tests and lint checks pass:

```bash
# Run Linting
npm run lint

# Run Unit Tests
npm run test

# Run End-to-End Tests
npm run test:e2e
```

## Architecture Overview

The application is structured into several key components:

- **`src/components/Playground`**: The core interactive component allowing users to generate keys, sign/verify messages, and encapsulate/decapsulate secrets.
- **`src/wasm`**: Contains TypeScript wrappers for the underlying WebAssembly cryptographic libraries (`liboqs`).
- **`src/components/OpenSSLStudio`**: A simulated OpenSSL workbench for advanced users.
- **`src/components/PKILearning`**: Educational platform with 7 modules (PKI Workshop, Digital Assets, 5G Security, EUDI Wallet, TLS 1.3 Basics, PQC 101 Introduction, PQC Quiz).
- **`src/components/Assess`**: 12-step risk assessment wizard with compound scoring engine and HNDL risk analysis.
- **`src/components/Migrate`**: Comprehensive PQC migration planning module with verified software database and workflow guidance.
- **`src/components/common/Glossary.tsx`**: Global floating PQC glossary panel.
- **`src/components/common/GuidedTour.tsx`**: Interactive first-visit onboarding tour.
- **`src/services/crypto/OpenSSLService.ts`**: Primary cryptographic service wrapping OpenSSL WASM operations.
- **`src/store`**: Zustand state stores for theme, learning progress, assessment wizard, TLS simulation, and version tracking (all persisted to localStorage).
- **`src/data`**: Static data layer — TypeScript data files, versioned CSV files (timelines, leaders, library, software references), X.509 certificate profiles, and ACVP test vectors.
- **`src/utils`**: Utility functions for data conversion and common operations.

## Project Structure

```
├── docs/                # Documentation and audit reports
├── e2e/                 # Playwright end-to-end tests
├── public/              # Static assets served at root
│   ├── data/            # Scraped compliance JSON (compliance-data.json)
│   ├── dist/            # liboqs WASM binaries (copied at build time)
│   ├── flags/           # Country flag icons
│   ├── lms-sample/      # LMS/HSS sample files
│   └── wasm/            # LMS and OpenSSL WASM binaries
├── requirements/        # Requirements specifications
├── scripts/             # Compliance data scrapers (NIST, ANSSI, Common Criteria)
├── src/
│   ├── components/          # React components
│   │   ├── About/           # About page and feedback forms
│   │   ├── ACVP/            # Automated Cryptographic Validation Protocol testing
│   │   ├── Algorithms/      # Algorithm comparison table
│   │   ├── Assess/          # 12-step PQC risk assessment with compound scoring
│   │   ├── Changelog/       # Changelog view
│   │   ├── Compliance/      # Compliance tracking and visualization
│   │   ├── ErrorBoundary.tsx # Global error boundary component
│   │   ├── Executive/       # Executive summary components
│   │   ├── Landing/         # Landing/home page
│   │   ├── Leaders/         # PQC transformation leaders profiles
│   │   ├── Layout/          # Main layout and navigation components
│   │   ├── Library/         # PQC standards library
│   │   ├── Migrate/         # PQC migration planning with verified software database
│   │   ├── OpenSSLStudio/   # OpenSSL v3.6.0 workbench (WASM)
│   │   ├── PKILearning/     # Learning platform with 7 modules
│   │   │   ├── modules/
│   │   │   │   ├── Introduction/         # PQC 101 Introduction module
│   │   │   │   ├── PKIWorkshop/          # 4-step PKI lifecycle
│   │   │   │   ├── DigitalAssets/        # Bitcoin, Ethereum, Solana, HD Wallet
│   │   │   │   ├── FiveG/                # SUCI + 5G-AKA flows
│   │   │   │   ├── DigitalID/            # EUDI Wallet ecosystem
│   │   │   │   ├── TLSBasics/            # TLS 1.3 handshake simulation
│   │   │   │   └── Quiz/                 # PQC knowledge assessment quiz
│   │   ├── Playground/      # Interactive cryptography playground
│   │   ├── Router/          # Routing utilities (ScrollToTop)
│   │   ├── Threats/         # Industry-specific threat analysis
│   │   ├── Timeline/        # Migration timeline visualization
│   │   ├── common/          # Shared components and utilities
│   │   └── ui/              # Reusable UI components (Button, Card, etc.)
│   ├── data/                # Static data (timelines, test vectors, profiles)
│   │   ├── acvp/            # NIST ACVP test vectors (ML-KEM, ML-DSA)
│   │   └── x509_profiles/   # CSV-based certificate profiles (3GPP, CAB Forum, ETSI)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries and helpers
│   ├── services/            # OpenSSL service and WASM integration
│   ├── store/               # Zustand state management stores (5 persisted stores)
│   ├── styles/              # Global CSS and design system
│   ├── test/                # Test setup and utilities
│   ├── types/               # Module-specific type definitions
│   ├── utils/               # Helper functions
│   ├── wasm/                # WebAssembly cryptography wrappers (liboqs, mlkem, LMS)
│   └── types.ts             # Global TypeScript definitions
```

## License

[GPL-3.0](LICENSE)

---

<p align="center">
  Built with <strong>Google Antigravity</strong> 🚀
</p>
