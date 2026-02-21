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
  - **PKI Workshop** (Learn | Workshop | Exercises): Certificate lifecycle education and hands-on practice
    - **Learn**: 6 educational sections — What is PKI, Certificate Lifecycle diagram, X.509 Anatomy, Trust Chains & Validation, PQC in PKI
    - **Workshop**: 4-step hands-on certificate lifecycle (CSR → Root CA → Certificate Issuance → Parsing) with CSV-based X.509 profiles
    - **Exercises**: 5 guided scenarios (RSA-2048, ECDSA P-256, ML-DSA-44, ML-DSA-87, SLH-DSA) with "Load & Run" presets
  - **Digital Assets Program** (Learn | Simulate | Exercises): Blockchain cryptography deep-dive
    - **Learn**: Blockchain crypto introduction covering key generation, address derivation, signing, and PQC threat analysis per chain
    - **Bitcoin (BTC)**: secp256k1, P2PKH/SegWit addresses, ECDSA signing, double SHA256
    - **Ethereum (ETH)**: Keccak-256, EIP-55 checksummed addresses, EIP-1559 transactions, signature recovery
    - **Solana (SOL)**: Ed25519, Base58 addresses, EdDSA signing
    - **HD Wallet**: BIP32/39/44 multi-chain derivation (m/44'/0'/0'/0/0 for BTC, m/44'/60'/0'/0/0 for ETH, m/44'/501'/0'/0' for SOL)
    - **Exercises**: Guided scenarios for each blockchain with pre-configured flows
  - **5G Security Education** (Learn | Simulate | Exercises): Interactive 5G authentication and privacy flows
    - **Learn**: 6 sections — What is 5G Security (3GPP TS 33.501), Three Pillars, SUCI Protection Schemes (Profile A/B/C), 5G-AKA Authentication (MILENAGE f1-f5, key hierarchy), SIM Provisioning, Post-Quantum Threat
    - **SUCI Deconcealment**: Profile A (Curve25519), Profile B (secp256r1), Profile C (ML-KEM-768 PQC) with hybrid and pure modes
    - **5G-AKA Authentication**: MILENAGE algorithm set (f1-f5 functions) with HSM integration
    - **Exercises**: 5 scenarios (Profile A Classical, Profile B NIST, Profile C Hybrid, Profile C Pure PQC, 5G-AKA Authentication)
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
  - **PQC 101 Introduction**: Beginner-friendly module covering quantum threats, Shor's algorithm, at-risk sectors, HNDL (Harvest Now, Decrypt Later) and HNFL (Harvest Now, Forge Later) attacks
  - **PQC Quiz**: Interactive knowledge assessment with 162 questions across 8 categories
    - **3 Modes**: Quick (20 questions, guaranteed category coverage), Full Assessment (80 questions randomly sampled), Custom (by topic)
    - **CSV-Driven**: Questions loaded from date-stamped CSV (`pqcquiz_MMDDYYYY.csv`) via `import.meta.glob`, with smart sampling guaranteeing ≥2 per category (Quick) / ≥10 per category (Full)
    - **Categories**: PQC Fundamentals, Algorithm Families, NIST Standards, Migration Planning, Compliance, Protocol Integration, Industry Threats, Crypto Operations
    - **Score Tracking**: Per-category highest scores persisted across sessions
  - **Quantum Threats**:
    - Analyzes security level degradation and algorithm vulnerability matrices
    - Features a key size analyzer and "Harvest Now, Decrypt Later" timeline calculator
  - **Hybrid Cryptography**:
    - Explores key generation, KEM encapsulation, and signatures with hybrid algorithms
    - Inspects composite PQC certificates
  - **Crypto Agility & Architecture**:
    - Three macro-architecture patterns: Provider Model (JCA/OpenSSL provider abstraction),
      Service Mesh / Sidecar Proxy (mTLS offloaded to Envoy/Istio), External KMS / HSM
      (centralized key service — upgrade once, enterprise-wide effect)
    - Interactive abstraction layer demo with live backend swapping (RSA → ML-KEM)
    - Four critical anti-patterns: hardcoded algorithms, hardcoded buffer & schema sizes
      (VARCHAR(256) breaks for PQC keys), missing crypto inventory, single-provider lock-in
    - Cryptographic Bill of Materials (CBOM) scanner and migration planning framework
  - **Stateful Hash Signatures**:
    - Deep-dives into LMS and XMSS key generation
    - Visualizes catastrophic state loss and signature state management
  - **Email & Document Signing**:
    - Explores S/MIME certificates and CMS signing/encryption workflows
    - Compares RSA key transport with KEM-based encryption (RFC 9629)
  - **VPN/IPsec & SSH**:
    - Walkthroughs for IKEv2 handshakes and SSH key exchanges using classical, hybrid, and PQC modes
    - WireGuard vs TLS 1.3 vs IPsec protocol comparisons
  - **Key Management & HSM**:
    - Explores the 7 stages of the key lifecycle and PQC impact
    - Simulates PKCS#11 HSM operations and key rotation planning for enterprises
- **Migrate Module**: Comprehensive PQC migration planning with structured workflow
  - **Verified Database**: 148+ verified PQC-ready software entries (OS, Libraries, Network, etc.)
  - **Infrastructure Layer View**: 5-layer visual stack (Hardware, OS, Database, Application,
    Cloud/Network) — click any layer to filter the software table by architectural tier
  - **7-Step Migration Workflow**: Assess, Plan, Pilot, Implement, Test, Optimize, Measure
  - **Framework Mappings**: NIST, ETSI, and CISA guideline alignment
  - **Gap Analysis**: Software category coverage assessment with priority matrix
  - **Reference Panel**: Curated authoritative migration resources
  - **Change Tracking**: "New" and "Updated" indicators for recent PQC landscape changes
  - **Filtering**: Deep filtering by category, platform, industry, and infrastructure layer
- **PQC Risk Assessment** (`/assess`): Comprehensive 13-step quantum risk evaluation wizard
  - **Country/Jurisdiction Picker**: select your regulatory jurisdiction to align deadlines with the PQC timeline
  - **Multi-select Sensitivity & Retention**: pick all applicable levels; scoring uses worst-case HNDL risk
  - **Country-aligned Deadlines**: Timeline step surfaces real regulatory deadline phases from the Gantt data
  - **"I don't know" escape hatches**: All steps with uncertainty options use a consistent dashed-border
    escape-hatch button pattern; unknowns are scored as worst-case risk (not low/moderate)
  - **Awareness-gap remediation actions**: Answering "I don't know" on any step automatically injects targeted
    recommended actions at the top of the report (e.g. "conduct a cryptographic asset inventory") to help close
    knowledge gaps first
  - **Compliance framework descriptions**: Step 5 shows deadline and regulatory notes as sub-text beneath each
    framework button for in-context guidance
  - Compound scoring engine with 4 risk dimensions: Quantum Exposure, Migration Complexity, Regulatory Pressure,
    Organizational Readiness — Regulatory Pressure now incorporates country-specific urgency weighting
  - **Consolidated HNDL / HNFL Risk Windows**: unified section with Key Milestones table (today, CRQC arrival,
    data/credential expiry dates with at-risk/safe badges) plus individual timeline visualizations; risk windows
    render with conservative estimates when users select "I don't know" on retention or credential lifetime steps
  - Per-algorithm migration effort estimation (quick-win to multi-year)
  - **Quick/Comprehensive badge** in report header — clearly identifies the depth of the completed assessment
  - **HNDL warning banner**: quick assessments with high or critical sensitivity display a banner noting that
    Harvest-Now-Decrypt-Later risk was not quantified and recommending a comprehensive assessment
  - Executive summary generated for both quick and comprehensive assessments; category breakdowns and
    URL-shareable assessments for comprehensive mode
  - Enhanced CSV export with effort ratings and rationale
  - Industry-aware wizard: compliance, crypto, use-case, and infrastructure steps prioritize industry-relevant options
  - Country compliance filtering: frameworks filtered by selected jurisdiction
  - PDF/print support: downloadable report with header/footer, page numbers, and section-aware page breaks
- **PQC Glossary**: Global floating glossary with 100+ PQC terms
  - Category filters, A-Z index, full-text search
  - Complexity badges (Beginner, Intermediate, Advanced)
  - Cross-references to learning modules
- **Personalization System**: Role, region, and industry picker on the home page that adapts the
  entire application to the user's context
  - **Role picker**: Executive/CISO, Developer/Engineer, Security Architect, Researcher/Academic —
    ordered by access breadth; unified order across home page and Learn page
  - **Persona-driven navigation**: irrelevant pages hidden from nav; always-visible pages (Home,
    Learn, Timeline, Threats, About) remain accessible to all. Each persona's nav is tuned:
    Executive includes Compliance and Migrate; Developer includes Assess; Architect includes
    Playground
  - **"For you" badges**: landing page cards highlight the top 3 recommended pages per role;
    inferred persona badge appears on home page role picker after assessment completion
  - **Persona-aware hero CTAs**: primary and secondary landing page actions adapt to the selected
    role (Executive → Assess, Developer → Playground, Architect → Timeline, Researcher → Algorithms)
  - **Persona inference**: assessment results map to all four personas using correct field values;
    returns null when signal is insufficient rather than defaulting to Architect
  - **Region pre-seeding**: pre-filters Timeline and pre-seeds Assessment country on mount
  - **Industry pre-seeding**: pre-seeds Assessment industry, pre-filters Threats and Library,
    highlights relevant Learn modules with "Relevant" badges
  - Selections persist across sessions via localStorage; "Clear all" fully resets to no selection
- **Guided Tour**: Interactive first-visit onboarding overlay
  - Filters tour steps to only show features visible in the active persona's navigation
  - Remembers completion status; re-trigger with `?tour` query parameter
- **Compliance Module**: Real-time compliance tracking and standards monitoring
  - NIST FIPS document tracking (203, 204, 205)
  - ANSSI recommendations
  - Common Criteria certifications
  - Automated data scraping and visualization
- **Standards Library**: Comprehensive PQC standards repository
  - NIST FIPS documents (203, 204, 205)
  - Protocol specifications (TLS, SSH, IKEv2)
  - **Dynamic Tree Visualization**: Interactive dependency hierarchy (Standards → Profiles → Guidelines)
  - **Advanced Filtering**: Organization-based scoping (NIST, IETF, ETSI, ISO, etc.) and category grouping
- **Quantum Threat Impacts**: Industry-specific quantum threat analysis
  - **80 threats across 20 industries**: Aerospace/Aviation, Automotive, Cloud Computing,
    Cryptocurrency/Blockchain, Energy/Critical Infrastructure, Financial Services, Government/Defense,
    Healthcare, Insurance, IoT, IT/Software, Legal/eSignature, Media/DRM, Payment Card Industry,
    Rail/Transit, Retail/E-Commerce, Supply Chain/Logistics, Telecommunications, and Water/Wastewater
  - Interactive dashboard with criticality ratings (Critical / High)
  - **Detailed Threat Insights**: Popups with specific "Harvest Now, Decrypt Later" risks, vulnerable
    algorithms, PQC replacements, and primary source citations
  - Direct access to primary source references for each threat
- **Transformation Leaders**: 100+ verified profiles of key PQC transition figures

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
- **Styling**: Tailwind CSS 4.2.0 with custom design system and CSS variables
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

1. **Fork the repository**.
2. **Create a feature branch**: `git checkout -b feature/my-new-feature`.
3. **Commit your changes**: `git commit -m 'Add some feature'`.
4. **Push to the branch**: `git push origin feature/my-new-feature`.
5. **Open a Pull Request**.

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

### Utility Scripts

```bash
# Generate test coverage report
npm run coverage

# Scrape compliance data from NIST, ANSSI, Common Criteria
# (also runs automatically before build via prebuild hook)
npm run scrape

# Download standards library PDFs
npm run download:library

# Enrich the quantum-safe software reference CSV with infrastructure_layer classification
# and append new software entries; outputs a date-stamped CSV to src/data/
python scripts/update_csv.py
```

## Architecture Overview

The application is structured into several key components:

- **`src/components/Playground`**: The core interactive component allowing users to generate keys, sign/verify messages, and encapsulate/decapsulate secrets.
- **`src/wasm`**: Contains TypeScript wrappers for the underlying WebAssembly cryptographic libraries (`liboqs`).
- **`src/components/OpenSSLStudio`**: A simulated OpenSSL workbench for advanced users.
- **`src/components/PKILearning`**: Educational platform with 14 modules including hybrid crypto, agility, stateful signatures and more.
- **`src/components/Assess`**: 13-step industry-aware risk assessment wizard with compound scoring engine, consolidated HNDL/HNFL risk analysis, and PDF print support.
- **`src/components/Migrate`**: Comprehensive PQC migration planning module with verified software database and workflow guidance.
- **`src/components/common/Glossary.tsx`**: Global floating PQC glossary panel.
- **`src/components/common/GuidedTour.tsx`**: Interactive first-visit onboarding tour.
- **`src/services/crypto/OpenSSLService.ts`**: Primary cryptographic service wrapping OpenSSL WASM operations.
- **`src/store`**: Zustand state stores for theme, learning progress, assessment wizard, TLS simulation, and version tracking (all persisted to localStorage).
- **`src/data`**: Static data layer — TypeScript data files, versioned CSV files (timelines, leaders, library, software references), X.509 certificate profiles, and ACVP test vectors.
- **`src/utils`**: Utility functions for data conversion and common operations.

## Project Structure

```text
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
│   │   ├── Assess/          # 13-step PQC risk assessment with compound scoring
│   │   ├── Changelog/       # Changelog view
│   │   ├── Compliance/      # Compliance tracking and visualization
│   │   ├── ErrorBoundary.tsx # Global error boundary component
│   │   ├── Executive/       # Executive summary components
│   │   ├── Landing/         # Landing/home page (PersonalizationSection, LandingView)
│   │   ├── Leaders/         # PQC transformation leaders profiles
│   │   ├── Layout/          # Main layout and navigation components
│   │   ├── Library/         # PQC standards library
│   │   ├── Migrate/         # PQC migration planning with verified software database
│   │   ├── OpenSSLStudio/   # OpenSSL v3.6.0 workbench (WASM)
│   │   ├── PKILearning/     # Learning platform with 14 modules
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
│   ├── data/                # Static data (timelines, test vectors, profiles, personaConfig)
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

## Security

Last audited: February 21, 2026

| Severity | Production | Dev-only |
| -------- | ---------- | -------- |
| Critical | 0          | 0        |
| High     | 0          | 12       |
| Moderate | 0          | 1        |

All runtime/production dependencies have **zero known CVEs**. The 13 dev-only findings are confined to the ESLint linting toolchain (`minimatch` ReDoS and `ajv` ReDoS) and do not affect the deployed application. See the [About page](/about) for full SBOM and CVE details.

To verify: `npm audit`

## License

[GPL-3.0](LICENSE)

---

<p align="center">
  Built with <strong>Google Antigravity</strong> 🚀
</p>
