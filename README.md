# PQC Timeline App

Test your PQC readiness with this interactive web application visualizing the global transition to Post-Quantum Cryptography.

## Features

- **Migration Timeline**: Global regulatory recommendations and migration phases visualization
  - Country filter with active filter chips, result count, and empty state
  - Document table: select a country to see all its phases/milestones in a structured table
    with organization, phase type, title, period, description, and source links
  - **Enrichment analysis in popovers**: Gantt phase popover shows a compact enrichment preview
    (main topic, mandate level badge, migration urgency badge, sector tags) for phases with
    document enrichment data; document detail popover renders a full 8-dimension analysis panel
    (mandate level, migration urgency, implementation timeline, sector applicability, key
    requirements, related standards, comparison points, priority action) and a cross-link to the
    matching Library record when the source URL maps to a known library entry
- **Algorithm Comparison**: Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) transition table
  - Interactive table with 3-way column sorting (asc → desc → none) and drag-to-resize columns
  - "Find tools" deep-links from each PQC algorithm cell to pre-filtered `/migrate` catalog
  - Mobile-responsive layout with accessible `aria-sort` attributes; separate mobile list view
  - AI-powered context button on each row for classical↔PQC migration rationale
  - **Deep-linkable sub-tabs**: performance/security/sizes/usecases sub-tabs URL-persisted via `?subtab=` param
  - **Region filter**: filter algorithms by standardisation body — NIST (US), IETF (Global), BSI/ANSSI (Europe), ETSI, KpqC (Korea), CACR (China); sortable Region column
  - **Status filter**: filter by certification status — Certified, Candidate, To Be Checked; sortable Status column; Multivariate and Isogeny added to crypto-family filter
  - **Algorithm Implementations Modal**: click the code icon on any PQC algorithm to see its open-source reference implementations; backed by `algo_product_xref` CSV; smart family-prefix fallback (SLH-DSA covers all SLH-DSA-\* variants); deep-links to `/migrate` catalog and `/library` entries
  - **Live performance benchmarks** (Performance sub-tab): in-browser keygen / sign / verify /
    encaps / decaps timing for every algorithm, measured through the real softhsmv3 Rust PKCS#11
    engine (v0.4.23) — engine priority: softhsmv3 Rust → liboqs → WebCrypto → @noble; covers
    ML-KEM, ML-DSA, SLH-DSA (all 12 param sets), RSA-2048/3072/4096, ECDSA P-256/P-384,
    Ed25519, ECDH P-256/P-384, X25519, X448, LMS-SHA256, XMSS-SHA2; P-521 curves fall back to
    WebCrypto; **classical counterparts auto-included** — when PQC algorithms are added to the
    comparison panel their classical predecessors (ECDH, RSA, ECDSA, Ed25519…) are automatically
    benchmarked alongside them with Classical/PQC labels for direct performance comparison
- **Interactive Playground**: Hands-on cryptographic testing environment
  - **Software ↔ PKCS#11 HSM mode toggle**: switch all tabs between the software stack and a
    SoftHSMv3 WASM engine backed by PKCS#11 v3.2 — run ML-KEM and ML-DSA through a real HSM
    interface in the browser
  - Real WASM-powered cryptography (`@oqs/liboqs-js`) and SoftHSMv3 PKCS#11 WASM
  - **KEM Operations**: Classical (X25519, P-256), PQC (ML-KEM), and Hybrid modes in software;
    ML-KEM-512/768/1024 via `C_GenerateKeyPair` / `C_EncapsulateKey` / `C_DecapsulateKey` in HSM
    mode — shared-secret match verification, PKCS#11 call log
    - Separate encapsulation/decapsulation flows with state isolation
    - HKDF-Extract normalization for variable-sized secrets
    - Visual comparison of generated vs recovered secrets
  - **Sign & Verify**: Unified PQC/Classical panel — PQC (ML-DSA-44/65/87, SLH-DSA) and classical
    (RSA, ECDSA, EdDSA) signing share a single tab with a PQC/Classical toggle in software;
    ML-DSA-44/65/87 via `C_SignInit + C_Sign` / `C_VerifyInit + C_Verify` in HSM mode —
    hedging mode, pre-hash options; SLH-DSA HSM panel includes PKCS#11 log and key inspector;
    pre-hash mechanism labels (CKM_HASH_SLH_DSA_SHA256/SHA512/SHAKE128/SHAKE256)
  - **Key Wrap / Unwrap**: Dedicated PKCS#11 key wrapping tab with four mechanisms — AES-KW
    (RFC 3394), AES-KWP (RFC 5649), AES-GCM wrap, and RSA-OAEP wrap. Wrap symmetric or
    asymmetric keys, inspect wrapped blobs, and unwrap them back — all logged to the PKCS#11
    call log
  - **HSM Key Store**: session-scoped table of all PKCS#11-generated keys with handle, algorithm,
    role, variant, size (FIPS 203/204 spec-accurate estimation), and timestamp; aggregate key
    count and total byte size shown in the header; expanded attribute inspector for `CKA_EXTRACTABLE`,
    `CKA_SENSITIVE`, `CKA_LOCAL`, `CKA_ALWAYS_SENSITIVE`, `CKA_NEVER_EXTRACTABLE`,
    `CKA_ENCAPSULATE`, `CKA_DECAPSULATE`, `CKA_KEY_GEN_MECHANISM`, `CKA_PARAMETER_SET`;
    all key generation forms expose `CKA_EXTRACTABLE` and usage attribute toggles
    (`CKA_ENCRYPT`, `CKA_DECRYPT`, `CKA_WRAP`, `CKA_UNWRAP`, `CKA_DERIVE`);
    **CKA_CHECK_VALUE (KCV)**: 3-byte SHA-256 fingerprint shown for all key types — symmetric
    (AES-ECB zero-block for AES, SHA-256 for HMAC) and asymmetric (SHA-256 of public/private key
    bytes for ML-KEM, ML-DSA, SLH-DSA, RSA, ECDSA, EdDSA) — in both C++ and Rust engines
  - **PKCS#11 call log**: per-session log of all C\_ function calls with return-value decoding,
    timing, and full parameter inspection mode (powered by `src/wasm/pkcs11Inspect.ts`); click
    the `Eye` button to enable inspect mode — every log row becomes expandable (`▶`) showing
    decoded **request parameters** (mechanism name + description, all `CK_ATTRIBUTE` template
    fields by type, raw data / signature / ciphertext payloads as collapsible hex) and **response
    outputs** (output handles, byte lengths, signature / ciphertext / digest payloads, VALID /
    INVALID verification result); complete coverage against PKCS#11 v3.2: `C_CreateObject`,
    `C_DestroyObject`, `C_FindObjects*`, `C_GetMechanismList/Info`, `C_SignUpdate/Final`,
    `C_DigestUpdate/Final`, `C_SignMessage`, `C_VerifyMessage`, `C_WrapKeyAuthenticated`,
    `C_UnwrapKeyAuthenticated`, `C_SeedRandom`, and all session / keygen / KEM / encrypt /
    derive / digest / wrap functions; step-separator headers group multi-step workflows; all
    panels in the HSM Playground (KEM, Sign, Symmetric, Hashing, Key Agreement, KDF, HMAC,
    AES, VPN simulation) show the full inspectable log inline
  - **SoftHSM tab**: modular demo components — Token Setup, ML-KEM encapsulate/decapsulate,
    ML-DSA sign/verify (+ pre-hash), SLH-DSA (all 12 param sets); HSM symmetric panel split into
    AES-CBC/GCM, AES-CMAC, AES-CTR, HMAC, Key Wrap, and RNG panels
  - **Mechanism Discovery**: live PKCS#11 mechanism browser in HSM mode — queries `C_GetMechanismList`
    and `C_GetMechanismInfo` for all slot mechanisms; resolves results against a 100+ entry MECH_TABLE
    (RSA, ML-KEM, ML-DSA, SLH-DSA, SHA-1/2/3, AES, EC/ECDSA/EdDSA, ECDH, PBKDF2, HKDF, SP 800-108
    KBKDFs); decodes CKF\_ flag bitmasks to human-readable names; groups by algorithm family
    (PQC, asymmetric, symmetric, hash, kdf)
  - **ACVP Testing**: validates 14 algorithm families against NIST test vectors — AES-GCM-256
    (SP 800-38D), AES-CBC, AES-CTR, AES Key Wrap, HMAC-SHA-256/384/512 (FIPS 198-1),
    SHA-256, RSA-PSS-2048 signature verify, ECDSA P-256/SHA-256, ECDSA P-384, EdDSA (Ed25519),
    ML-KEM-768 key decapsulation (FIPS 203), and ML-DSA-65 sign/verify (FIPS 204); runs on both
    C++ and Rust engines in Dual Mode simultaneously; **XMSS-SHA2_10_256 KAT** (RFC 8391 / NIST SP 800-208):
    deterministic keygen self-test via `_set_kat_seed` seed injection hook — zero-seed produces a
    known public key on every run, proving XMSS keygen is reproducible
  - **Key size display**: Software Key Store and HSM Key Registry both show per-key material
    sizes (B/KB) with sortable Size column and aggregate totals in the header
  - **Persona-aware simplification**: Curious and Executive personas see a streamlined Playground
    with no HSM mode toggle and no ACVP tab
  - **Mobile Playground** (`MobilePlaygroundOps`): Interactive ML-KEM + ML-DSA experience on
    mobile — real WASM-powered KEM encapsulation/decapsulation and signing/verification on small
    screens (not just informational)
  - **Responsive mobile layout**: abbreviated tab labels, responsive grids, touch-target-compliant
    buttons (44px minimum), and viewport-clamped dropdowns
  - **Accessibility**: full `role="tablist/tab"` keyboard navigation (ArrowLeft/Right/Home/End),
    `aria-selected`, `aria-controls`, and `aria-hidden` on all decorative icons
  - **TLS 1.3 Simulator** (Playground workshop tool): interactive client/server TLS 1.3 handshake simulator — configure cipher suites, key exchange groups (X25519, ML-KEM-768, X25519MLKEM768), mTLS, and PQC/hybrid certificate options; step-through handshake visualization with PKCS#11 log
  - **Playground Workshop**: tools under active development show a WIP badge (Wrench icon); WIP tools are hidden by default with a toggle to reveal or show only WIP tools; includes DRBG Architecture demo
- **OpenSSL Studio**: Browser-based OpenSSL v3.6.2 workbench powered by WebAssembly
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
  - **Digital Assets Program** (Learn | Workshop | Exercises): Blockchain cryptography deep-dive
    - **Architecture Overview**: Blockchain cryptographic requirements table (Bitcoin secp256k1/ECDSA, Ethereum Keccak-256, Solana Ed25519) with OpenSSL 3.6.2 support matrix per operation and chain
    - **Learn**: Blockchain crypto introduction covering key generation, address derivation, signing, and PQC threat analysis per chain
    - **Bitcoin (BTC)**: secp256k1, P2PKH/SegWit addresses, ECDSA signing via SoftHSMv3 PKCS#11 (pure HSM path — private key never leaves the token; public key extracted via `C_GetAttributeValue(CKA_PUBLIC_KEY_INFO)` SPKI parse)
    - **Ethereum (ETH)**: Keccak-256, EIP-55 checksummed addresses, EIP-1559 transactions, signature recovery
    - **Solana (SOL)**: Ed25519, Base58 addresses, EdDSA signing
    - **HD Wallet**: BIP32/39/44 multi-chain derivation (m/44'/0'/0'/0/0 for BTC, m/44'/60'/0'/0/0 for ETH, m/44'/501'/0'/0' for SOL)
    - **PQC Defense** (5-part): Quantum threat landscape, Bitcoin BIP-360 (P2QRH), Ethereum AA (EIP-4337/7702), Solana structural challenge, and **live ML-DSA-65 vs secp256k1 side-by-side demo** with real OpenSSL WASM v3.6.2 crypto — key gen, sign, verify, and BIP-360 witness overhead calculation
    - **Exercises**: Guided scenarios for each blockchain with pre-configured flows
  - **5G Security Education** (Learn | Simulate | Exercises): Interactive 5G authentication and privacy flows
    - **Learn**: 6 sections — What is 5G Security (3GPP TS 33.501), Three Pillars, SUCI Protection Schemes (Profile A/B/C), 5G-AKA Authentication (MILENAGE f1-f5, key hierarchy), SIM Provisioning, Post-Quantum Threat
    - **SUCI Deconcealment**: Profile A (Curve25519), Profile B (secp256r1), Profile C (ML-KEM-768, FIPS 203) with hybrid and pure modes; full spec-correct implementation — ANSI X9.63-KDF (SHA-256 for A/B, SHA3-256 for C), AES-128/256-CTR with zero IV, HMAC-SHA-256/SHA3-256, BCD MSIN encoding per TS 23.003, authenticate-then-decrypt at SIDF with full SUPI recovery; Profile C hybrid combines Z_ecdh ‖ Z_kem via SHA-256 per TR 33.841 §5.2.5.2; official 3GPP TS 33.501 Annex C.4 reference vectors accessible via "Reference Vectors" button
    - **5G-AKA Authentication**: MILENAGE algorithm set (f1-f5 functions) with HSM integration
    - **Exercises**: 5 scenarios (Profile A Classical, Profile B NIST, Profile C Hybrid, Profile C Pure PQC, 5G-AKA Authentication)
  - **EU Digital Identity Wallet**: EUDI Wallet ecosystem with pluggable crypto provider architecture
    - **Pluggable CryptoProvider**: unified interface (`CryptoProvider`) with OpenSSL, SoftHSM PKCS#11,
      and Dual-mode (parallel execution) backends — components call `getCryptoProvider()` instead of
      branching on HSM readiness; provider implementations in `DigitalID/utils/`
    - **PID Issuance**: Mobile Driving License (mDL) per ISO/IEC 18013-5 with native CBOR encoding via `cborg`
    - **Attestations**: QEAA, PuB-EAA, and EAA issuance flows with X.509 qualified certificate generation
    - **Remote QES**: Qualified Electronic Signature via CSC API with P-384 signing key and qualified certificate
    - **Protocols**: OpenID4VCI, OpenID4VP for credential exchange
    - **X.509 Utilities**: self-signed X.509 v3 certificate generation (ES256/ES384) via `@peculiar/asn1-schema`
  - **TLS 1.3 Basics**: Interactive TLS 1.3 handshake simulation and cryptographic logging
    - **Dual Configuration**: GUI controls and raw OpenSSL config file editing
    - **Identity Options**: RSA, ML-DSA (Post-Quantum), and custom certificates
    - **Crypto Visibility**: Detailed key derivation, HKDF, signature, and encryption logs
    - **PQC Support**: ML-KEM (Kyber) key exchange and ML-DSA/SLH-DSA signatures
  - **PQC 101 Introduction**: Beginner-friendly module covering quantum threats, Shor's algorithm, at-risk sectors, HNDL (Harvest Now, Decrypt Later) and HNFL (Harvest Now, Forge Later) attacks
  - **PQC Quiz**: Interactive knowledge assessment with 820 questions across 49 categories
    - **3 Modes**: Quick (20 questions, guaranteed category coverage), Full Assessment (80 questions randomly sampled), Custom (by topic)
    - **CSV-Driven**: Questions loaded from date-stamped CSV (`pqcquiz_MMDDYYYY.csv`) via `import.meta.glob`, with smart sampling guaranteeing ≥2 per category (Quick) / ≥10 per category (Full)
    - **Categories**: PQC Fundamentals, Algorithm Families, NIST Standards, Migration Planning, Compliance, Protocol Integration, Industry Threats, Crypto Operations, Entropy & Randomness, Standards Bodies, Data Asset Sensitivity, Energy & Utilities, Healthcare, Aerospace & Space, Automotive, Cryptographic APIs, Secrets Management, Network Security, Database Encryption, IAM, Secure Boot, OS Crypto, Platform Engineering, PQC Testing & Validation, and additional topic categories covering all 49 learning modules
    - **Score Tracking**: Per-category highest scores persisted across sessions
  - **Module cross-linking**: 26+ learning modules include a "Related Modules" navigation panel
    with contextual deep-links to prerequisite and follow-on modules; all 5 Role Guide modules
    cross-link to relevant industry and specialist modules
  - **Quantum Threats**:
    - Analyzes security level degradation and algorithm vulnerability matrices
    - Features a key size analyzer and "Harvest Now, Decrypt Later" timeline calculator
  - **Hybrid Cryptography** (5-step workshop):
    - Explores key generation, KEM encapsulation, and signatures with hybrid algorithms
    - Hybrid CA Setup: configure and generate classical (ECDSA) and PQC (ML-DSA-65) root CAs
    - Hybrid Cert Formats: generates **real DER-encoded certificates** for all six X.509
      approaches — Pure PQC (ML-DSA, RFC 9881), Pure PQC (SLH-DSA, RFC 9909), Composite
      (draft-ietf-lamps-pq-composite-sigs-15, OID 1.3.6.1.5.5.7.6.45), Alt-Sig / Catalyst
      (ITU-T X.509 §9.8, extensions 2.5.29.72-74), Related Certificates (RFC 9763, two-pass
      bidirectional binding), and Chameleon (draft-bonnell-lamps-chameleon-certs-07,
      DeltaCertificateDescriptor). ASN.1 encoding via `@peculiar/asn1-schema`; all signing
      via SoftHSMv3 PKCS#11 (`C_GenerateKeyPair` + `C_Sign`/`C_MessageSign`); format-specific
      SPKI breakdown in parsed view; PEM and parsed text downloadable per certificate
    - Hybrid Cert Inspector: DER structure viewer with five IETF/RFC reference certificates
      including real SLH-DSA cert from RFC 9909 Appendix C.3
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
    - **Cross-engine sign and verify**: sign on Rust engine, verify on C++ engine — public key bytes cached and imported via `C_CreateObject`; tamper-detection toggles (flip message / flip signature)
  - **Email & Document Signing**:
    - Explores S/MIME certificates and CMS signing/encryption workflows
    - Compares RSA key transport with KEM-based encryption (RFC 9629)
  - **VPN/IPsec & SSH**:
    - Walkthroughs for IKEv2 handshakes and SSH key exchanges using classical, hybrid, and PQC modes
    - WireGuard vs TLS 1.3 vs IPsec protocol comparisons
    - **VPN Simulation certificate generation**: RSA-3072 key pair generated in HSM, TBS certificate signed via `C_Sign` (SHA256withRSA), full DER construction and certificate inspector; warning badge for classical auth per draft-ietf-ipsecme-ikev2-mldsa
  - **Key Management & HSM**:
    - Explores the 7 stages of the key lifecycle and PQC impact
    - Simulates PKCS#11 HSM operations and key rotation planning for enterprises
  - **Entropy & Randomness** (SP 800-90 A/B/C):
    - DRBG mechanism comparison: CTR_DRBG, Hash_DRBG, HMAC_DRBG, and XOF_DRBG (SHAKE-based, SP 800-90A Rev 2)
    - **HMAC_DRBG Architecture Demo**: interactive SP 800-90A HMAC_DRBG lifecycle visualization —
      Instantiate → Generate → Reseed phases with real-time (K, V, reseed counter) state tracking,
      configurable entropy/nonce/personalization inputs, and action history log
    - TRNG vs QRNG comparison; min-entropy estimation with danger-zone gauge arc; entropy source health monitoring
    - QRNG demo with "Simulated" badge to distinguish from hardware-backed sources
    - FIPS 203 & 204 seed requirements (32-byte entropy for ML-KEM/ML-DSA; security strength matching per SP 800-131A)
    - LMS/XMSS stateful signature entropy failure analysis
  - **Quantum Key Distribution (QKD)**:
    - Interactive BB84 protocol simulator with configurable qubit count, toggleable Eve
      eavesdropper, and **adjustable interception rate** (10%–100%) for partial-eavesdropping experiments
    - Post-processing pipeline visualization (error correction, privacy amplification, hybrid
      key derivation via HKDF)
    - Global QKD deployment explorer with real-world adoption data including AWS Center for Quantum
      Networking (CQN) and Chicago Quantum Exchange (CQE) 111 km fiber network
  - **Merkle Tree Certificates** (5-step workshop):
    - Build Merkle trees interactively, generate inclusion proofs, and compare MTC vs traditional PKI for post-quantum TLS
    - **Step 5 — CT Log Simulator**: simulate a Certificate Transparency log with ML-DSA-44 signing via SoftHSMv3, consistency proofs, and misissuance detection
  - **Code Signing** (5-step workshop):
    - Binary signing with ML-DSA-87 vs ECDSA P-384 with real byte-size comparison
    - PQC certificate chain builder (root CA → intermediate → leaf) with ML-DSA
    - Hybrid package signing (RPM-style, ML-DSA-87 + Ed448 dual signatures)
    - Keyless Sigstore flow with transparency-log inclusion proof visualization
    - Secure Boot Chain: 4-stage firmware signing comparison (LMS vs XMSS vs ML-DSA) with stateful signature counter tracking and CNSA 2.0 mandate timelines
  - **Secure Boot PQC** (5-step workshop):
    - Secure Boot Chain Analyzer: UEFI PK/KEK/db key hierarchy quantum vulnerability
    - **Firmware Signing Migrator**: multi-algorithm wizard (RSA-2048/3072, ECDSA P-256/P-384, ML-DSA-44/65/87, SLH-DSA-SHA2-128S) with 4-step flow — key gen, sign, verify, KAT validation; per-key PKCS#11 attribute inspector; refactored to reusable `StepWizard` component with per-step output/error reporting
  - **API Security & JWT** (5-step workshop):
    - JWT Inspector: decode and flag quantum-vulnerable algorithms (RS256/HS256)
    - PQC JWT Signing with ML-DSA-87 vs RS256 signature byte size comparison
    - Hybrid JWT: dual-sign with Ed25519 + ML-DSA-87 for backward-compatible migration tokens
    - JWE Encryption with ML-KEM-768 key agreement
    - Token Size Analyzer: side-by-side header/payload/signature breakdown for RS256, ES256, ML-DSA-44/65/87
  - **IoT & OT Security** (5-step workshop):
    - Constrained Algorithm Explorer: algorithm selection for RFC 7228 Class 0/1/2 devices with memory and compute constraints
    - Firmware Signing Simulator: LMS/XMSS stateful signatures with state counter tracking
    - DTLS 1.3 Handshake Visualizer: protocol visualization with PQC impact analysis
    - SCADA Migration Planner: ICS migration strategy across Purdue Model levels with priority scoring
    - Cert Chain Bloat Analyzer: certificate size impact analysis for constrained device environments
  - **Standards Bodies** (5-step workshop, Strategy track):
    - Covers who creates PQC standards (NIST, ISO/IEC, ETSI, IETF), who certifies products
      (CMVP/ACVP, CC/CCRA/EUCC, NCSC CPA), and who mandates compliance (BSI, ANSSI, ENISA, NSA, KISA)
    - BodyClassifier: drag-and-drop categorisation of 12 organisations into the three-role model
    - OrganizationExplorer: deep-dive cards for each body with scope, jurisdiction, and PQC output
    - StandardsCertChain: step-through visualisation of the NIST → CMVP → CC/CCRA certification chain
    - CoverageGrid: heat-map of regional coverage across standardisation, certification, and compliance
    - ScenarioChallenge: real-world scenarios (US federal procurement, EU NIS2 audit, etc.) requiring
      learners to identify the relevant bodies and cite correct regulatory references
  - **Cryptographic APIs & Developer Languages** (8-step workshop, Developer track):
    - API Architecture Explorer: compare JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG, and Bouncy Castle
    - Language Ecosystem Comparator: PQC library availability across Java, Python, Go, Rust, C/C++, .NET, JavaScript
    - Provider Pattern Workshop: pluggable provider design and abstraction strategies
    - Build vs Buy vs Open Source Analyzer: decision framework for PQC library selection
    - PQC Library Explorer: liboqs, BouncyCastle, AWS-LC-FIPS, Bouncy Castle, Microsoft's SEAL, and others
    - PQC Support Matrix: feature/algorithm coverage table across libraries and languages
    - Crypto Agility Patterns: factory pattern, interface-based swap, feature flags, and adapter layer
    - Migration Decision Lab: interactive decision tree for library migration planning
  - **Energy & Utilities PQC** (5-step workshop, Industries track):
    - Protocol Security Analyzer: quantum vulnerability assessment for DNP3, Modbus, IEC 61850, and IEC 62351
    - Substation Migration Planner: phased PQC rollout for substations with NERC CIP compliance mapping
    - Smart Meter Key Manager: DUKPT-based key management at AMI scale
    - Safety Risk Scorer: environmental and operational risk scoring for grid-connected systems
    - Grid Migration Roadmap: multi-year roadmap generator for power utility PQC programs
  - **Healthcare PQC** (5-step workshop, Industries track):
    - Biometric Vault Assessor: biometric data permanence analysis and quantum vulnerability scoring
    - Pharma IP Calculator: pharmaceutical intellectual property protection timeline estimator
    - Patient Privacy Mapper: HIPAA/GDPR lifecycle analysis for long-lived patient records
    - Device Safety Simulator: FDA-regulated medical device safety-crypto intersection (IEC 62443)
    - Hospital Migration Planner: network migration across clinical, imaging, and administrative systems
  - **Aerospace & Space PQC** (6-step workshop, Industries track):
    - Avionics Protocol Analyzer: ARINC 429/629 and DO-326A airborne cybersecurity assessment
    - Satellite Link Budget: bandwidth constraint analysis for PQC signatures on satellite links
    - Certification Impact Analyzer: DO-178C/DO-326A recertification impact assessment
    - Fleet Interoperability Matrix: multi-decade fleet crypto interoperability planning
    - Export Control Classifier: ITAR/EAR export control classification for PQC implementations
    - Mission Lifecycle Planner: end-to-end mission crypto lifecycle (design → launch → deorbit)
  - **Automotive PQC** (6-step workshop, Industries track):
    - Vehicle Architecture Mapper: ECU/CAN bus/V2X topology and quantum risk mapping
    - Sensor Data Integrity: LiDAR/camera data signing with PQC algorithms
    - Safety-Crypto Analyzer: ISO 26262 ASIL safety levels crossed with crypto requirements
    - OTA Orchestration Planner: 15–20 year lifecycle OTA key management and rollout
    - Car Key Protocol Explorer: digital car keys, Ultra-Wideband, and in-vehicle payment PQC
    - Lifecycle Migration Roadmap: vehicle model-year migration roadmap generator
  - **Role Guides track** (5 quick-start modules, 30 min each, beginner):
    - **Executive Quantum Impact**: fiduciary risk, CNSA 2.0/NIS2/DORA deadlines, board-level action plan
    - **Developer Quantum Impact**: library transitions, key/signature size impacts, JWT/TLS migration
    - **Architect Quantum Impact**: KMS/HSM/PKI decisions, hybrid deployment patterns, crypto-agile design
    - **Ops Quantum Impact**: certificate scaling, VPN/SSH key exchange, monitoring recalibration
    - **Research Quantum Impact**: algorithm evaluation, open problems, standards convergence timelines
  - **Confidential Computing & TEEs** (5-step workshop, Infrastructure track):
    - TEE Architecture Explorer: 7 vendor platforms (Intel SGX, AMD SEV-SNP, ARM CCA, AWS Nitro, Google Cloud CC, Azure Confidential, IBM SE)
    - Attestation Workshop: remote attestation flows, engines, integrations, and quantum threat analysis
    - Encryption Mechanisms: TEE-specific encryption and key sealing strategies
    - TEE-HSM Trusted Channel: establishing quantum-safe channels between TEEs and HSMs
    - Quantum Threat Migration: migration roadmap for TEE-dependent workloads
  - **Secrets Management PQC** (5-step workshop, Infrastructure track):
    - Secrets Architecture Mapper: Vault, AWS, Azure, GCP secrets topology and quantum risk
    - Vault PQC Simulator: transit encryption engine migration to ML-KEM/ML-DSA
    - Rotation Policy Designer: automated rotation schedules with PQC algorithm support
    - Cloud Secrets Comparator: cross-provider PQC readiness matrix
    - Pipeline Integration Lab: CI/CD secrets injection with PQC key material
  - **Network Security PQC** (5-step workshop, Protocols track):
    - NGFW Cipher Analyzer: next-gen firewall cipher suite quantum vulnerability assessment
    - TLS Inspection Lab: TLS 1.3 inspection compatibility with PQC cipher suites
    - IDS Signature Updater: IDS/IPS signature updates for PQC-aware traffic patterns
    - Vendor Migration Matrix: firewall/IDS vendor PQC support comparison
    - ZTNA PQC Designer: Zero Trust Network Access architecture with PQC identity verification
  - **PQC Testing & Validation** (6-step workshop, Protocols track):
    - Passive Discovery Lab: classify TLS/SSH/IKEv2 sessions from a network tap/SPAN by quantum safety
    - Active PQC Scanner: detect PQC support, hybrid key exchange, and quantum-vulnerable configs per host
    - Performance Benchmark Designer: compare classical vs hybrid vs pure-PQC latency/throughput
    - Interop Test Matrix: validate client/server algorithm compatibility per RFC 9794
    - TVLA Leakage Analyzer: identify side-channel leakage in ML-KEM/ML-DSA implementations (NTT/INTT focus)
    - Test Strategy Builder: compose a complete PQC validation program by phase and environment
  - **Database Encryption PQC** (5-step workshop, Infrastructure track):
    - Encryption Layer Mapper: TDE, CLE, and queryable encryption topology analysis
    - TDE Migration Planner: transparent data encryption key algorithm migration
    - BYOK Key Designer: bring/hold your own key architecture with PQC key wrapping
    - Queryable Encryption Lab: encrypted query operations with post-quantum algorithms
    - Database Migration Readiness: cross-vendor database PQC readiness assessment
  - **IAM PQC** (5-step workshop, Applications track):
    - IAM Crypto Inventory: JWT, SAML, OIDC token signing algorithm audit
    - Token Migration Lab: RS256/ES256 to ML-DSA token signing migration
    - Directory Services Analyzer: Active Directory/LDAP Kerberos PQC impact analysis
    - Vendor Readiness Scorer: IdP vendor PQC support scoring (Okta, Entra ID, Ping, ForgeRock)
    - Zero Trust Identity Architect: ZTNA identity architecture with PQC device attestation
  - **Secure Boot PQC** (5-step workshop, Infrastructure track):
    - Secure Boot Chain Analyzer: UEFI PK/KEK/db key hierarchy quantum vulnerability
    - Firmware Signing Migrator: ML-DSA firmware signing with TPM 2.0 integration
    - TPM Key Hierarchy Explorer: TPM 2.0 key hierarchy PQC migration planning
    - Firmware Vendor Matrix: 8 vendor platform PQC readiness (HPE, AMI, Dell, Lenovo, etc.)
    - Attestation Flow Designer: DICE-based attestation with post-quantum algorithms
  - **OS PQC** (5-step workshop, Infrastructure track):
    - OS Crypto Inventory: system-wide cryptographic library and provider audit
    - System TLS Configurator: OS-level TLS policy configuration for PQC cipher suites
    - SSH Host Key Migrator: SSH host key migration to ML-DSA across server fleets
    - Package Signing Migrator: RPM/DEB/APK package signing algorithm migration
    - FIPS Compatibility Checker: FIPS 140-3 mode compatibility with PQC algorithms
  - **Platform Engineering PQC** (6-step workshop, Applications track):
    - CI/CD pipeline crypto inventory and HNDL risk assessment
    - Container signing migration (cosign/Notation to ML-DSA)
    - IaC crypto defaults and OPA/Kyverno policy enforcement
    - Prometheus/SIEM posture monitoring for algorithm drift detection
    - Platform migration planner with SLSA and SBOM integration
  - **Tools & Products Tab**: Every module includes a "Tools & Products" tab sourcing products
    directly from the migrate catalog CSV via `getMigrateItemsForModule()`, grouped by
    infrastructure layer with PQC support badge, FIPS badge, ACVP/CC certification chips,
    license info, and a deep-link to the full Migrate catalog entry
- **Migrate Module**: Comprehensive PQC migration planning with structured workflow
  - **Reference Catalog**: 519 PQC-relevant product entries across 7 infrastructure layers (under active review — WIP banner shown)
  - **7-Layer Infrastructure Stack**: Cloud, Network, Application Servers & Software, Database,
    Security Stack, Operating System, Hardware & Secure Elements — click any layer to filter the
    catalog. Products can span multiple layers (e.g., AWS KMS in Cloud + Security Stack).
  - **Security Stack Layer**: KMS, PKI, Crypto Libraries, Certificate Lifecycle, Secrets, IAM,
    Data Protection, CIAM — 42 products including OpenSSL, Bouncy Castle, HashiCorp Vault, Okta
  - **Mobile migration phase selector**: `FilterDropdown` visible on mobile replacing the desktop
    step rail that was hidden on small screens
  - **7-Step Migration Workflow**: Assess, Plan, Pilot, Implement, Test, Optimize, Measure
  - **Framework Mappings**: NIST, ETSI, and CISA guideline alignment
  - **Gap Analysis**: Coverage assessment with priority matrix
  - **Reference Panel**: Curated authoritative migration resources
  - **Change Tracking**: "New" and "Updated" indicators for recent PQC landscape changes
  - **PQC Certifications**: Expanded product rows show per-product FIPS 140-3, ACVP, and Common
    Criteria certification badges pulled from a certification cross-reference dataset
  - **Three-tier FIPS badge**: `Validated` (green) / `Partial` (amber, covers FedRAMP/WebTrust/FIPS-mode
    claims) / `No` (gray) with icon indicators on every catalog row
  - **AI Product Enrichment**: 535 products have AI-analyzed enrichments extracted directly from
    their published proof documents (press releases, product pages, whitepapers) — covering 19
    structured dimensions (PQC algorithms, hybrid approaches, security levels, migration timelines,
    compliance frameworks, and more). Products with enrichments show a ✨ "Enriched" badge;
    clicking "View Extraction" opens a modal with the full structured analysis alongside any
    legacy extraction data
  - **Three View Modes**: Stack (infrastructure layers), Cards (responsive grid with sort), and Table
    (sortable columns) with persistent view toggle. Four sort options: Name, PQC Support, Migration
    Priority, FIPS Status
  - **Product Comparison**: Compare up to 3 catalog products side-by-side — queue products via the
    Scale icon on any row or card; a sticky bottom bar shows the queue and triggers an inline
    comparison table (PQC Support, FIPS, License, Priority, Platforms, Capability, Version)
  - **Filtering**: Contextual cascading filters by category, PQC support status, and infrastructure
    layer with search; selected layer and sub-category persist across sessions
  - **WIP filter**: toggle for work-in-progress catalog entries — hidden by default, `?wip=include`
    shows WIP products alongside standard entries, `?wip=only` shows only WIP products; URL-persisted
- **PQC Risk Assessment** (`/assess`): Comprehensive 14-step quantum risk evaluation wizard
  - **Country/Jurisdiction Picker**: select your regulatory jurisdiction to align deadlines with the PQC timeline
  - **Multi-select Sensitivity & Retention**: pick all applicable levels; scoring uses worst-case HNDL risk
  - **Country-aligned Deadlines**: Timeline step surfaces real regulatory deadline phases from the Gantt data
  - **"I don't know" escape hatches**: All steps with uncertainty options use a consistent dashed-border
    escape-hatch button pattern; unknowns are scored as worst-case risk (not low/moderate)
  - **Smart defaults for Org Scale**: clicking "I'm not sure" on the Org Scale step auto-populates
    system count and team size based on the selected industry — no guessing required
  - **Awareness-gap remediation actions**: Answering "I don't know" on any step automatically injects targeted
    recommended actions at the top of the report (e.g. "conduct a cryptographic asset inventory") to help close
    knowledge gaps first
  - **Compliance framework descriptions**: Step 5 shows deadline and regulatory notes as sub-text beneath each
    framework button for in-context guidance
  - **Industry-weighted compound scoring**: 4 risk dimensions (Quantum Exposure, Migration Complexity,
    Regulatory Pressure, Organizational Readiness) with per-industry category weights — government and
    finance boost regulatory pressure, telecom and energy boost migration complexity
  - **Country planning horizons**: HNDL/HNFL risk windows use country-specific regulatory deadlines
    (US/France/Canada 2030, Germany/UK/Australia 2035) instead of a universal planning horizon
  - **Compliance deadline-aware scoring**: Regulatory pressure parses actual deadline years from
    frameworks — imminent deadlines score higher than distant ones
  - **Category score driver explanations**: Human-readable descriptions below each risk category bar
    explaining what drives the score
  - **Industry-specific recommended actions**: Tailored actions per industry (CNSA 2.0 for government,
    SCADA/OT for energy, V2X for automotive, cloud KMS for technology)
  - **Algorithm-highlighted threat landscape**: Threats matching the user's selected algorithms are
    visually highlighted in the report
  - **Country-aware migration roadmap**: Swim lane phases dynamically compress or expand based on
    deadline proximity
  - **Consolidated HNDL / HNFL Risk Windows**: unified section with Key Milestones table (today, CRQC arrival,
    data/credential expiry dates with at-risk/safe badges) plus individual timeline visualizations; risk windows
    render with industry-aware conservative estimates when users select "I don't know"
  - Per-algorithm migration effort estimation (quick-win to multi-year)
  - **Quick/Comprehensive badge** in report header — clearly identifies the depth of the completed assessment
  - **HNDL warning banner**: quick assessments with high or critical sensitivity display a banner noting that
    Harvest-Now-Decrypt-Later risk was not quantified and recommending a comprehensive assessment
  - Executive summary generated for both quick and comprehensive assessments; category breakdowns and
    URL-shareable assessments for comprehensive mode; URL-hydrated parameters validated against canonical
    allowlists to prevent injection of arbitrary values via shared links
  - Enhanced CSV export with effort ratings and rationale
  - Industry-aware wizard: compliance, crypto, use-case, and infrastructure steps prioritize industry-relevant options
  - Country compliance filtering: frameworks filtered by selected jurisdiction
  - PDF/print support: downloadable report with header/footer, page numbers, and section-aware page breaks
- **Standalone Report** (`/report`): Dedicated shareable report page extracted from the assessment
  wizard. Accepts URL query parameters to auto-hydrate and auto-complete assessments from a shared
  link. Includes all report sections: Risk Score gauge, Category Breakdown, HNDL/HNFL risk windows,
  Algorithm Migration priorities, Recommended Actions, Migration Roadmap (with MigrationToolkit
  product suggestions), and Threat Landscape. Contextual info buttons on all 11 report sections
  explain methodology, data sources, and interpretation guidance.
- **Google Drive cloud sync** (optional, home page Backup & Restore section): backs up and restores
  all app progress to the user's Google Drive `appDataFolder` (hidden from file list). Access token
  stored in browser memory only; scope is `drive.appdata` (least-privileged). API keys are
  explicitly excluded from the sync payload. Privacy terms documented on the About page
  (`#cloud-sync-privacy`).
- **Business Center** (`/business`): GRC command center integrating assessment results, compliance
  framework selections, and learning progress into a unified dashboard. Live risk scores, compliance
  tracking, vendor posture analysis, and prioritized next steps. Artifact management for creating,
  viewing, and editing executive documents.
  - **14 Interactive Business Tools** (`/business/tools`): Persona-aware planning and governance
    toolkit — all tools adapt to the user's industry, geography, and regulatory context
    - **Risk & Strategy**: ROI Calculator (IBM breach baselines, quantum amplification), Board Pitch
      Builder (section-by-section editor with assessment pre-population), CRQC Scenario Planner
      (interactive CRQC year slider with algorithm impact, compliance deadlines, HNDL exposure)
    - **Compliance & Audit**: Audit Readiness Checklist (30 items across 6 sections with NIST/CNSA/ISO
      standards references, maturity tier scoring: Not Started → Optimized)
    - **Governance & Policy**: RACI Builder (10 activities × 6 roles with multi-accountable validation),
      Policy Template Generator (4 policy types with FIPS 203/204/205 algorithm lists), KPI Dashboard
      Builder (6 weighted dimensions, auto-scored vendor readiness from catalog)
    - **Vendor & Supply Chain**: Vendor Scorecard (product-level auto-detection from Migrate catalog),
      Contract Clause Generator (5 articles with CNSA 2.0 milestones through 2035), Supply Chain Risk
      Matrix (per-layer PQC/FIPS/hybrid breakdown with export)
    - **Migration Planning**: Roadmap Builder (regulatory deadline overlay from Timeline data),
      Stakeholder Comms Planner (4-tier message framework), KPI Tracker (live data integration
      with manual override tracking), Deployment Playbook (6-phase checklist: prep → hybrid →
      canary → rollout → validation → rollback)
    - All tools export to Markdown, save to executive document portfolio, and include GA4 event tracking
    - **WAI-ARIA keyboard navigation**: ArrowLeft/Right cycles tabs, Home/End jump to first/last
      across the Business Center shell
- **PQC Glossary**: Global floating glossary with 503 PQC terms
  - Category filters, A-Z index, full-text search
  - Complexity badges (Beginner, Intermediate, Advanced)
  - Cross-references to learning modules
  - **Inline tooltips** on key terms throughout all 49 learning modules — portal-rendered with
    `position: fixed` so they always appear above overflow-constrained containers (modals,
    scrollable panels, diagram wrappers)
- **Personalization System**: 4-step onboarding wizard on the home page that adapts the entire
  application to the user's context across 6 personas
  - **4-step wizard**: Experience → Role → Region → Industry with animated stepper, info modals
    explaining how each choice shapes the experience, `PersonalizedAvatar` live preview, and
    embedded `ScoreCard`
  - **Experience level**: Curious/Basics/Expert — adjusts guided tour length, learning paths, and
    quiz difficulty filtering; `Curious` replaces `New` as the entry-level tier with simplified
    language, plain-language module summaries, and beginner AI chat suggestions
  - **Role picker**: Curious Explorer, Executive/CISO, Developer/Engineer, Security Architect,
    IT Ops/DevOps, Researcher/Academic — ordered by access breadth; unified order across home page
    and Learn page
  - **Curious Explorer persona**: 6th persona for non-technical users exploring quantum security
    for the first time. Curated 9-module learning path (PQC 101 → Quantum Threats → Risk Management
    → Data Sensitivity → Compliance Strategy → Standards Bodies → Crypto Agility → Migration Program
    → Quiz), simplified AI chat language with a "Curious" badge, and beginner-friendly suggested
    questions across all 6 pages; auto-completes onboarding wizard (Global region, all industries);
    Playground hides HSM mode toggle and ACVP tab for streamlined experience
  - **"In Simple Terms" banner**: collapsible `CuriousSummaryBanner` shown at the top of every
    learning module when experience level is Curious — renders plain-language `curious-summary.md`
    content (~8th-grade reading level, real-world analogies, ~200-350 words); **Curious persona
    variant**: dedicated `curious-summary-curious.md` with further simplified language and
    persona-specific `gcp_*-curious.png` infographics for all 50 modules (generated via Gemini
    1.5 Pro + Imagen 3.0); gracefully absent if a module has no summary file
  - **Visual tab**: dedicated Visual tab on all 48 modules rendering a 640×640 single-panel
    infographic and a fully rewritten "In Simple Terms" summary — conversational prose verified
    line-by-line against each module's source content, available at all experience levels;
    accessible via deep link (`/learn/module?tab=visual`)
  - **Inline NIST KAT validation**: seven modules (5G Security, Code Signing, Email Signing,
    IoT/OT, Digital ID, QKD, Digital Assets) embed a `KatValidationPanel` in their workshop
    steps — click "Run NIST KAT" to execute use-case-specific Known Answer Tests against NIST
    FIPS 203/204 ACVP vectors (ML-KEM + ML-DSA) with per-spec pass/fail results displayed inline
  - **Persona-driven navigation**: irrelevant pages hidden from nav; always-visible pages (Home,
    Learn, Timeline, Threats, About) remain accessible to all. Each persona's nav is tuned:
    Executive includes Compliance and Migrate; Developer includes Assess; Architect includes
    Playground
  - **"For you" badges**: landing page cards highlight the top 3 recommended pages per role;
    inferred persona badge appears on home page role picker after assessment completion
  - **Persona-aware hero CTAs**: primary and secondary landing page actions adapt to the selected
    role (Executive → Assess, Developer → Playground, Architect → Timeline, Researcher → Algorithms)
  - **Journey step rail**: landing page features a horizontal 7-step progression (Learn → Assess →
    Explore → Test → Deploy → Ramp Up → Stay Agile); steps inaccessible to the active persona are
    dimmed; persona-priority steps receive "For you" badges; each card shows route chips for all
    available paths
  - **Persona inference**: assessment results map to all four personas using correct field values;
    returns null when signal is insufficient rather than defaulting to Architect
  - **Region pre-seeding**: pre-filters Timeline and pre-seeds Assessment country on mount
  - **Industry pre-seeding**: pre-seeds Assessment industry, pre-filters Threats and Library,
    highlights relevant Learn modules with "Relevant" badges
  - Selections persist across sessions via localStorage; "Clear all" fully resets to no selection
  - **PQC Explainer**: Dismissible "Why does this matter?" component with 3 educational cards
    for newcomers; persistent dismissal via localStorage
- **Achievement Badge System**: 27 unlockable badges tracking learning milestones across all
  modules, quiz performance, and cross-page engagement; badges organized by category (Foundation,
  Deep Dive, Industry, Strategy, Practice) and displayed on the landing page
- **Right Panel** (slide-out, accessible via panel icon in nav):
  - **Bookmarks**: Save Library documents (by `referenceId`) and Migrate products (by name) for
    quick access. Bookmark icon on every Library row and Migrate table row; Bookmarks tab in the
    Right Panel lists all saved items with deep-links and one-click JSON/CSV export.
    Persisted via `useBookmarkStore` (localStorage).
  - **Knowledge Graph**: Explore (force-directed graph of all PQC concepts and modules),
    Coverage (bar chart of quiz/module coverage per category), Pathways (recommended learning
    sequences per persona), and **Mindmap** (visual overview of the PQC learning landscape,
    modules grouped by track with cross-module relationship edges)
  - **Journey Map**: Persona-driven visual representation of the user's learning journey —
    completed modules, recommended next steps, and progress toward persona-specific goals
  - Body scroll is locked when the panel is open on mobile (drawer mode)
  - **Airplane Mode**: Toggle in the mobile More menu disables cloud-dependent features (AI chat,
    external links) for offline or restricted environments; pulsing plane badge on the PQC logo
    indicates active state; AI Assistant gate shows "Enable AI Assistant" entry when WebGPU is
    unavailable and no Gemini API key is configured
- **Guided Tour**: Interactive first-visit onboarding with 3-phase design
  - Phase 1 — Intro (3 slides explaining why PQC matters)
  - Phase 2 — Knowledge Gate: adjusts tour length based on experience level
  - Phase 3 — Feature tour (up to 13 persona-filtered slides) with swipeable cards
  - Remembers completion status; re-trigger with `?tour` query parameter
- **Community Endorse/Flag System**: Stamp and Flag icon buttons on every resource — library
  documents, threats, leaders, timeline milestones, and all 49 learning module workshop steps.
  Endorse opens a prefilled GitHub Discussion for community validation; Flag opens a prefilled
  report for inaccuracies, broken links, or outdated content. Activation state persisted via
  `useEndorsementStore` (localStorage); re-clicking an activated button navigates to the existing
  discussion thread. `WorkshopStepHeader` component provides consistent endorse/flag affordance
  across all 43 module workshop steps. Mobile-visible endorse/flag buttons on all page headers.
- **Transparency & Disclaimer**: First-visit `DisclaimerModal` (`alertdialog` role, `z-[110]`)
  explains that PQC Today is community-driven, not endorsed by cited organizations, sourced from
  public information, and may contain inaccuracies. Persisted per major app version via
  `useDisclaimerStore`. `TransparencyBanner` on the landing page links to the `/about#transparency`
  anchor. About page includes a dedicated "Transparency & Disclaimer" section with animated WIP
  badge and contact links. A **"Link to Us"** card at the bottom of the About page provides
  deep-link sharing snippets for community outreach. A **Google Drive Sync privacy terms** panel
  (`#cloud-sync-privacy`) explains exactly what data the optional sync feature stores and how to
  revoke access.
- **What's New Modal**: Persona-aware, filterable notification modal showing app updates and
  data changes since the user's last visit. Auto-opens for returning users with unseen changes;
  filters by persona and industry; shows deep-linked new/updated items from library, migrate,
  threats, timeline, and leaders data sources
- **Terms of Service** (`/terms`): Legal compliance page covering GPL-3.0 licensing, educational
  crypto disclaimer, export compliance (ECCN 5D002), prohibited destinations, acceptable use,
  and privacy (zero tracking, client-side only)
- **Page Accuracy Feedback**: Fixed bottom-left thumbs-up/down widget on content pages;
  GA4 analytics logging; resets on navigation
- **PQC Assistant**: AI-powered chatbot for post-quantum cryptography questions
  - **Cloud mode**: Google Gemini 2.5 Flash with BYOK (Bring Your Own Key) — cloud accuracy,
    instant startup, configurable context window presets (4K / 6K / 8K / 12K / 16K tokens)
    feeding up to 40 RAG chunks for deeper answers
  - **Local mode**: WebLLM browser-native Qwen 3 models — no API key, no cloud, fully private;
    model cards show speed/accuracy ratings (1–5 dots), VRAM requirements, and recommendation
    tips to guide model selection
  - Client-side RAG retrieval using MiniSearch over 6,468 content chunks from 22 data sources
  - Three-phase search: entity matching, query expansion, keyword search with source diversity
  - **Document enrichment**: 1,100+ archived HTML/PDF documents enriched with 19 structured
    dimensions (algorithms, threats, protocols, infrastructure layers, compliance frameworks,
    etc.) and fed into the RAG corpus; catalog enrichments cover 535 product proof documents
    (press releases, whitepapers, product pages) — a new 4th enrichment collection alongside
    library, timeline, and threats
  - **Entity inventory**: Extracted entity list injected into the system prompt to prevent
    hallucination — model says "not in the current database" for unlisted items
  - **Cross-domain linking**: Post-processing adds links between threats↔compliance,
    leaders↔algorithms, library↔algorithms, and compliance↔timeline
  - Streaming markdown responses with deep-linked references to app pages
  - SPA-aware navigation: internal links close the chat panel and navigate via React Router
  - Covers: glossary, algorithms, threats, timeline, library, compliance, migrate catalog, leaders,
    quiz content, assessment config, certifications, priority matrix, document enrichments, and
    all 49 learning modules
  - **Precision deep links**: 10 views accept URL params for direct navigation — Library `?ref=`,
    Threats `?id=`, Learn `?tab=`, Algorithms `?highlight=`, Compliance `?cert=`, Assess `?step=`,
    Playground `?algo=`, Leaders `?leader=`/`?sector=`/`?country=`, OpenSSL `?cmd=`,
    Quiz `?category=`
  - **RAG deep-link integration**: 95% of corpus chunks carry pre-computed `deepLink` URLs;
    system prompt prioritizes these for more precise navigation links in responses
  - **Sample Questions**: `?` button in chat header opens categorized question bank (22 questions
    across 11 categories) with copy-to-clipboard
  - **Source attribution**: Collapsible source references with deep-linked titles on assistant messages
  - **Follow-up suggestions**: Entity-aware follow-up question chips after each response
  - **Multi-turn context**: Conversation history (last 3 queries) improves retrieval for follow-up
    questions
  - **Provider-aware response caching**: Flash and Local modes maintain independent caches;
    local mode gracefully suggests Flash when answers are thin for complex intents
  - **SLH-DSA fact verification**: 16 SLH-DSA parameter set variants (SHA2 + SHAKE, 128/192/256-bit)
    added to the security level validation engine
  - **40 golden query tests**: Regression suite covering definitions, comparisons, catalog lookups,
    country queries, recommendations, and cross-intent queries
  - **Detail-view AI buttons**: Context-aware `Ask Assistant` buttons embedded in all seven detail
    panels (Algorithms, Compliance, Leaders, Library, Migrate, Threats, Timeline) — each pre-fills
    a relevant question using the current item's context
- **Study Pack for NotebookLM**: Download all PQC Today content as a structured ZIP file for use
  with Google NotebookLM — includes glossary, algorithms, library, threats, compliance, migrate
  catalog, leaders, timeline, and learning module summaries
- **Compliance Module**: Real-time compliance tracking and standards monitoring
  - **Compliance Landscape**: Interactive 2024–2036 deadline timeline with urgency color-coding
    (imminent/near-term/future), country filters, sort controls (Deadline / Name), and
    persona-aware pre-filtering
  - **Mobile certification filtering**: cert type filter pills (All/FIPS/ACVP/CC) and progressive
    "Load more" pagination on mobile viewports
  - **Curious persona context banner**: standardization bodies vs. certification schemes vs.
    compliance frameworks explained inline for non-technical users
  - Framework cards with PQC requirement indicators, enforcement body, website links, and
    cross-references to Library and Timeline; ViewToggle (grid / list) for layout preference
  - **My Frameworks bookmarking**: checkbox toggle on every card and table row — add frameworks
    to a personal list persisted via `useComplianceSelectionStore`; selections auto-import into
    the Assessment wizard compliance step
  - **Deadline urgency indicators**: deadline badges color-coded as imminent (red) / near-term
    (amber) / future (green) using extracted deadline years
  - **Body-type awareness**: 91 records categorised as `standardization_body`, `technical_standard`,
    `certification_body`, or `compliance_framework` — enabling richer filtering and UI context
  - NIST FIPS document tracking (203, 204, 205, 206)
  - ANSSI recommendations, BSI Technical Guidelines, ENISA PQC guidelines
  - Common Criteria certifications (CC/CCRA/EUCC), CMVP/ACVP validation
  - Automated data scraping and visualization
- **Standards Library**: Comprehensive PQC standards repository (336 entries)
  - NIST FIPS documents (203, 204, 205)
  - Protocol specifications (TLS, SSH, IKEv2)
  - Government guidance: ANSSI, NATO, NSA CNSA 2.0, UK NCSC, G7, CISA, GSMA, SG MAS, AU ASD, and more
  - **Dynamic Tree Visualization**: Interactive dependency hierarchy (Standards → Profiles → Guidelines)
  - **Advanced Filtering**: Organization-based scoping (NIST, IETF, ETSI, ISO, etc.) and category grouping
- **Quantum Threat Impacts**: Industry-specific quantum threat analysis
  - **79 threats across 20 industries**: Aerospace/Aviation, Automotive, Cloud Computing,
    Cryptocurrency/Blockchain, Energy/Critical Infrastructure, Financial Services, Government/Defense,
    Healthcare, Insurance, IoT, IT/Software, Legal/eSignature, Media/DRM, Payment Card Industry,
    Rail/Transit, Retail/E-Commerce, Supply Chain/Logistics, Telecommunications, and Water/Wastewater
  - Interactive dashboard with criticality ratings (Critical / High)
  - **Detailed Threat Insights**: Popups with specific "Harvest Now, Decrypt Later" risks, vulnerable
    algorithms, PQC replacements, and primary source citations
  - Direct access to primary source references for each threat
- **Transformation Leaders**: 71 consent-verified profiles of key PQC transition figures

> 📋 See [REQUIREMENTS.md](REQUIREMENTS.md) for detailed specifications of each feature.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7.3.1
- **Cryptography**:
  - OpenSSL WASM v3.6.2 (with native ML-KEM, ML-DSA, and LMS/HSS support)
  - `@pqctoday/softhsm-wasm` v0.4.18 — SoftHSMv3 PKCS#11 v3.2 WASM; C++ engine v0.4.18 (ML-KEM, ML-DSA, SLH-DSA, AES, PBKDF2, HKDF, KBKDF, EdDSA, secp256k1, X25519, BIP32); Rust engine v0.4.18 (PKCS#11 v3.2 KEM compliance, CKA_PARAMETER_SET flags, wasm-bindgen 0.2.117)
  - `@oqs/liboqs-js` for additional PQC algorithms (FrodoKEM, HQC, Classic McEliece)
  - Web Crypto API for classical algorithms (X25519, P-256, ECDH)
  - `@noble/curves` and `@noble/hashes` for blockchain operations
  - `@scure/bip32`, `@scure/bip39`, `@scure/base` for HD wallet
  - `micro-eth-signer` for Ethereum transactions
  - `ed25519-hd-key` for Solana key derivation
- **Styling**: Tailwind CSS 4.2.2 with custom design system and CSS variables
- **State Management**: Zustand for module state and persistence
- **Data Processing**: Papa Parse (CSV), JSZip (file backup), LocalForage (storage), cborg (CBOR encoding for EUDI mDocs)
- **UI/UX**: Framer Motion (animations), React Markdown (documentation)
- **Testing**: Vitest + React Testing Library + Playwright
- **Resilience**: `lazyWithRetry` wrapper retries failed chunk loads with exponential backoff; WASM
  instance caches self-heal on failure

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

# Generate module infographics via Google Vertex AI Imagen 3
# Requires GCLOUD_TOKEN env var; use --test for first 3, --all for all 50
node scripts/generate-infographics.mjs --all
```

## Architecture Overview

The application is structured into several key components:

- **`src/components/Playground`**: The core interactive component allowing users to generate keys, sign/verify messages, and encapsulate/decapsulate secrets.
- **`src/wasm`**: TypeScript wrappers for WebAssembly cryptographic libraries (`liboqs`, ML-KEM, ML-DSA, LMS). `softhsm/` provides the Phase 6 PKCS#11 singleton loader and modular sub-modules; `inspect/` decodes PKCS#11 call parameters for the call log.
- **`src/components/OpenSSLStudio`**: A simulated OpenSSL workbench for advanced users.
- **`src/components/PKILearning`**: Educational platform with 49 modules across 8 tracks — foundations, strategy, protocols, infrastructure, applications, industries, role guides, and executive.
- **`src/components/Assess`**: 14-step industry-aware risk assessment wizard with compound scoring engine, consolidated HNDL/HNFL risk analysis, and PDF print support.
- **`src/components/Migrate`**: Comprehensive PQC migration planning module with verified software database and workflow guidance.
- **`src/components/common/Glossary.tsx`**: Global floating PQC glossary panel.
- **`src/components/common/GuidedTour.tsx`**: Interactive first-visit onboarding tour.
- **`src/services/crypto/OpenSSLService.ts`**: Primary cryptographic service wrapping OpenSSL WASM operations.
- **`src/store`**: Zustand state stores for theme, learning progress, assessment (proxy delegating to form + result sub-stores), TLS simulation, version tracking, persona, compliance selection, endorsements, bookmarks, and disclaimer (all persisted to localStorage).
- **`src/data`**: Static data layer — TypeScript data files, versioned CSV files (timelines, leaders, library, software references), X.509 certificate profiles, and ACVP test vectors. `csvUtils.ts` provides a shared date-stamped / revision-sorted CSV loader used by all data modules.
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
│   │   ├── About/           # About page, SBOM, CVE details, and Rust WASM crate versions
│   │   ├── ACVP/            # Automated Cryptographic Validation Protocol testing
│   │   ├── Algorithms/      # Algorithm comparison table
│   │   ├── Assess/          # 14-step PQC risk assessment with compound scoring
│   │   ├── Changelog/       # Changelog view
│   │   ├── Compliance/      # Compliance tracking and visualization
│   │   ├── Terms/           # Terms of Service page (/terms)
│   │   ├── ErrorBoundary.tsx # Global error boundary component
│   │   ├── Executive/       # Executive summary components
│   │   ├── Landing/         # Landing/home page (PersonalizationSection, LandingView)
│   │   ├── Leaders/         # PQC transformation leaders profiles
│   │   ├── Layout/          # Main layout and navigation components
│   │   ├── Library/         # PQC standards library
│   │   ├── Migrate/         # PQC migration planning with verified software database
│   │   ├── OpenSSLStudio/   # OpenSSL v3.6.2 workbench (WASM)
│   │   ├── BusinessCenter/  # GRC command center dashboard
│   │   ├── PKILearning/     # Learning platform with 49 modules across 8 tracks
│   │   │   ├── modules/     # 49 module directories + Quiz
│   │   │   │   ├── Introduction/         # PQC 101 Introduction module
│   │   │   │   ├── PKIWorkshop/          # 4-step PKI lifecycle
│   │   │   │   ├── DigitalAssets/        # Bitcoin, Ethereum, Solana, HD Wallet
│   │   │   │   ├── FiveG/                # SUCI + 5G-AKA flows
│   │   │   │   ├── DigitalID/            # EUDI Wallet ecosystem
│   │   │   │   ├── TLSBasics/            # TLS 1.3 handshake simulation
│   │   │   │   ├── MerkleTreeCerts/      # Merkle Tree Certificates for PQC TLS
│   │   │   │   ├── QKD/                  # Quantum Key Distribution (BB84)
│   │   │   │   ├── CodeSigning/          # Code & firmware signing with PQC
│   │   │   │   ├── APISecurityJWT/       # JWT/JWE with PQC algorithms
│   │   │   │   ├── IoTOT/               # IoT/OT constrained device security
│   │   │   │   ├── SecretsManagementPQC/ # Vault/AWS/Azure/GCP secrets migration
│   │   │   │   ├── NetworkSecurityPQC/   # NGFW, IDS/IPS, TLS inspection, ZTNA
│   │   │   │   ├── DatabaseEncryptionPQC/# TDE, CLE, queryable encryption, BYOK
│   │   │   │   ├── IAMPQC/              # JWT/SAML/OIDC, AD/LDAP, Zero Trust
│   │   │   │   ├── SecureBootPQC/       # UEFI, TPM 2.0, DICE attestation
│   │   │   │   ├── OSPQC/              # OpenSSL providers, SSH, package signing
│   │   │   │   ├── PlatformEngPQC/      # CI/CD, container signing, IaC, OPA
│   │   │   │   ├── PQCTestingValidation/ # Passive/active discovery, TVLA, interop, benchmarks
│   │   │   │   └── Quiz/                 # PQC knowledge assessment quiz
│   │   ├── Playground/      # Interactive cryptography playground
│   │   ├── Router/          # Routing utilities (ScrollToTop)
│   │   ├── Threats/         # Industry-specific threat analysis
│   │   ├── Timeline/        # Migration timeline visualization
│   │   ├── common/          # Shared components (CuriousModuleView, CuriousStackCarousel,
│   │   │                    #   CuriousSummaryBanner, WorkshopStepHeader, GuidedTour, etc.)
│   │   └── ui/              # Reusable UI components (Button, Card, EndorseButton, FlagButton, etc.)
│   ├── data/                # Static data (timelines, test vectors, profiles, personaConfig)
│   │   ├── acvp/            # NIST ACVP test vectors (14 algorithm families)
│   │   ├── doc-enrichments/ # Enriched document metadata for RAG corpus
│   │   └── x509_profiles/   # CSV-based certificate profiles (3GPP, CAB Forum, ETSI)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries and helpers
│   ├── services/            # OpenSSL service and WASM integration
│   ├── store/               # Zustand state management stores (20+ stores)
│   ├── styles/              # Global CSS and design system
│   ├── test/                # Test setup and utilities
│   ├── types/               # Module-specific type definitions
│   ├── utils/               # Helper functions
│   ├── wasm/                # WebAssembly cryptography wrappers (liboqs, mlkem, LMS)
│   └── types.ts             # Global TypeScript definitions
```

## Security

Last audited: March 22, 2026

| Severity | Production | Dev-only |
| -------- | ---------- | -------- |
| Critical | 0          | 0        |
| High     | 0          | 5        |
| Moderate | 0          | 1        |

All runtime/production dependencies have **zero known CVEs**. The 6 dev-only findings are confined to the ESLint linting toolchain (`minimatch` ReDoS) and do not affect the deployed application. Full resolution requires ESLint 9→10 major bump (tracked). See the [About page](/about) for full SBOM and CVE details.

To verify: `npm audit`

## License

This project is licensed under [GPL-3.0-only](LICENSE). See [Terms of Service](TERMS.md) for usage terms, export compliance (ECCN 5D002), and sanctions restrictions.

**Fork policy**: forks and redistributions (source or built artifacts) must be licensed under GPL-3.0-only and include the corresponding source. Private/internal forks with no distribution have no obligation to publish changes.

---

<p align="center">
  Built with <strong>Google Antigravity</strong> 🚀
</p>
