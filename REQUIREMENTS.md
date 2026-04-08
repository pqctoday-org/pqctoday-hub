# PQC Timeline Application - Master Requirements

## 1. Project Overview

The goal is to build a high-end, visually stunning web application that visualizes the global transition to Post-Quantum Cryptography (PQC). The application serves as a comprehensive resource for understanding regulatory timelines, algorithm transitions, industry impacts, and key leaders in the field. It also provides hands-on cryptographic tooling, an interactive learning platform, a PQC risk assessment wizard, and a migration planning catalog.

## 2. Functional Modules

The application is divided into the following main modules. Detailed requirements for each are linked below:

1. **[Migration Timeline](requirements/timeline.md)**: Visualization of global regulatory recommendations and migration phases.
2. **[Quantum Threat Impacts](requirements/impacts.md)**: Dashboard showing specific risks to 20 industries (80 verified threats).
3. **[Algorithms Transition](requirements/algorithms.md)**: Comparison table showing the shift from Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) standards.
4. **[Standards Library](requirements/library.md)**: Comprehensive PQC standards repository with categorized documents.
   - *Note on SoftHSMv3 Integration*: SoftHSMv3 integration for PKCS#11 v3.2 complies with OASIS spec for PQC constants (CKK_ML_DSA = 0x4a, CKK_SLH_DSA = 0x4b).
5. **[Learning Platform](requirements/learn.md)**: 25 interactive educational modules with 470-question quiz:
   - *Note on Dynamic Tooling*: All "Featured Products" module lists are now powered dynamically by the `ModuleMigrateTab` component, which sources tagged products directly from the global CSV database (`quantum_safe_cryptographic_software_reference`).
   - *Note on Curious Summaries*: All learning modules strictly feature standardized 3-panel "In Simple Terms" (What This Is About, Why It Matters, The Key Takeaway) neon infographics and factually-verified, jargon-free markdown summaries without hallucination.
   - **[PKI Workshop](requirements/learn.md#module-1-pki-workshop-implemented)**: 4-step certificate lifecycle (CSR → Root CA → Certificate Issuance → Parsing) with CSV-based X.509 profiles
   - **[Digital Assets Program](requirements/digital_assets.md)**: Blockchain cryptography for Bitcoin (secp256k1, P2PKH/SegWit, ECDSA), Ethereum (Keccak-256, EIP-55, EIP-1559), Solana (Ed25519), and HD Wallet (BIP32/39/44)
   - **[5G Security Education](requirements/5G_Security_Educational_Module_Requirements.md)**: SUCI Deconcealment (Profiles A/B/C with ML-KEM-768) and 5G-AKA authentication with MILENAGE (f1–f5)
   - **[EU Digital Identity Wallet](requirements/EUDI_Wallet_Educational_Module_Requirements.md)**: EUDI Wallet ecosystem with Remote HSM architecture, OpenID4VCI/OpenID4VP flows, QEAA, Remote QES. Generates verified structural encodings natively including CBOR/COSE for mDocs (via `cborg`), SD-JWT strict base64url boundaries, and X.509 Qualified Certificates (via `@peculiar/asn1-schema`).
   - **[TLS 1.3 Basics](requirements/learn_openssltls13_requirement.md)**: Interactive TLS 1.3 handshake simulation with PQC support (ML-KEM, ML-DSA), certificate inspector
   - **PQC Testing Validation**: Passive/Active scanning with `pqcscan`, IKEv2 Performance cliffs, TVLA side-channel analysis, and NIST ACVP KAT vector simulations.
   - **PQC 101 Introduction**: Quantum threats, Shor's algorithm, at-risk sectors, HNDL and HNFL attacks
   - **Quantum Threats**: Threat actor profiles, attack timelines, industry risk mapping
   - **Hybrid Cryptography**: Hybrid KEM via X25519 ECDH + ML-KEM-768 + HKDF, migration patterns
   - **Crypto Agility & Architecture**: Macro architecture patterns for crypto-agile systems
   - **Stateful Hash Signatures**: LMS/HSS overview and operational considerations
   - **Email & Document Signing**: S/MIME, PDF signing, PQC migration paths
   - **VPN/IPsec & SSH**: PQC integration in network protocols
   - **Key Management & HSM**: HSM roles, key lifecycle, PQC readiness
   - **Entropy & Randomness**: SP 800-90 A/B/C coverage, `EntropyTestingDemo`, NIST DRBG analysis
   - **Quantum Key Distribution (QKD)**: BB84 with configurable Eve interception rate slider, real-world deployment data
   - **[PQC Quiz](requirements/learn.md#module-7-pqc-quiz-implemented)**: 470 questions across 32 categories; persona-filtered mode; per-category score tracking; judo belt grading via `ScoreCard`; InlineTooltip glossary links in all module introductions; deep links via `?category=`
6. **[Migrate Module](requirements/Migrate_Module_Requirements.md)**: 186+ verified PQC-relevant product entries across 8 infrastructure categories:
   - 7 infrastructure layers (OS, Libraries, Network, HSM, PKI, Cloud, Containers) + Web Browsers (Chrome, Edge, Firefox, Safari)
   - Three-tier FIPS badge: Validated (FIPS 140/203 certified) / Partial (FedRAMP, WebTrust, FIPS-mode) / No
   - `migration_phases` column for phase-based filtering (Crypto Discovery, migrate, launch, etc.)
   - Infrastructure stack visualization (`InfrastructureStack.tsx`)
   - Change tracking with "New" and "Updated" indicators
   - Full header cluster: SourcesButton, ShareButton, GlossaryButton
7. **[Interactive Playground](requirements/playground.md)**: Hands-on testing environment for PQC cryptographic operations.
   - KEM Operations: Classical (X25519, P-256), PQC (ML-KEM), and Hybrid modes with HKDF-Extract normalization
   - Key Store with sortable/resizable columns
   - ACVP Testing against NIST test vectors
8. **[OpenSSL Studio](requirements/opensslstudio.md)**: Browser-based OpenSSL v3.6.0 workbench powered by WebAssembly.
   - 13 operation types: Key Generation, CSR, Certificate, Sign/Verify, Random, Version, Encryption, Hashing, KEM, PKCS#12, LMS/HSS
   - Full PQC support: ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA (all 12 variants), LMS/HSS
   - Classical algorithms: RSA, EC (P-256/384/521, secp256k1), Ed25519, X25519, Ed448, X448
   - Virtual File System: upload, edit, download, backup/restore with ZIP
   - Deep linking via `?cmd=` query parameter with aliases (keygen→genpkey, cert→x509, sign→dgst)
   - ShareButton and GlossaryButton in desktop header
9. **[Compliance Module](requirements/Compliance_Module_Requirements.md)**: Real-time compliance tracking and standards monitoring.
   - NIST FIPS document tracking (203, 204, 205, and delayed 206 draft), ANSSI recommendations, Common Criteria certifications
   - Compliance Landscape Dashboard tab with industry-specific hints
   - Unified responsive UI: Dual-layout architecture (`ComplianceTable.tsx`) combining desktop data tables and mobile cards
   - Centralized Filters: Global "Active Filters" bar and `MobileFilterDrawer` for discoverable multi-select filtering
   - Automated data scraping at build time; SourcesButton, ShareButton, GlossaryButton in header
   - Industry-aware filtering: frameworks filtered to match selected industry
10. **[Transformation Leaders](requirements/leaders.md)**: 100+ verified profiles of key public and private figures driving the PQC transition.
11. **[About & Feedback](requirements/about.md)**: Project information, feedback mechanisms, Software Bill of Materials (SBOM), and security audit summary.
    - **Career Journey**: 6-panel interactive comic-style modal showcasing the creator's professional transition to PQC with custom artwork.
12. **PQC Risk Assessment** (`/assess`): Comprehensive 14-step quantum risk evaluation wizard.
    - **Wizard steps** (in order): Industry → Country → Crypto → Sensitivity → Compliance → Migration → Use Cases → Retention → Credential → Scale → Agility → Infra → Vendors → Timeline
    - **4 risk dimensions**: Quantum Exposure, Migration Complexity, Regulatory Pressure, Organizational Readiness
    - **Scoring features**:
      - Industry-weighted composite scoring (government/finance boost regulatory pressure, telecom/energy boost migration complexity)
      - Country planning horizons for HNDL/HNFL risk windows (US/France/Canada 2030; Germany/UK/Australia 2035)
      - Compliance deadline-aware scoring (passed=15, ≤2yr=14, ≤5yr=12, distant=8)
      - Worst-case scoring for multi-select fields (`dataSensitivity`, `dataRetention`)
      - Conservative "I don't know" escape hatches at every step
    - **Report features**:
      - Methodology modal (`ReportMethodologyModal`) explaining scoring logic; `print:hidden`
      - Category score driver explanations (human-readable text per bar)
      - Industry-specific recommended actions (9 tailored action types)
      - Algorithm-highlighted threat landscape (rows matching user's crypto selections highlighted)
      - Country-aware migration roadmap (`MigrationRoadmap.tsx`) with deadline-proximity swim lanes
      - HNDL/HNFL risk window visualization (`ReportTimelineStrip.tsx`, 2024–2035)
      - Industry-specific threats appendix (`ReportThreatsAppendix.tsx`)
      - Quick/Comprehensive mode badge in report header
      - Executive summary for both modes
    - **Sharing**: URL-shareable via 14 query params (`i`, `cy`, `c`, `d`, `f`, `m`, `u`, `r`, `s`, `t`, `a`, `n`, `v`, `p`)
    - **Export**: Download PDF (`window.print()`), Export CSV (algorithm migrations + effort items)
    - **Print/PDF**: Fixed header (`PQC Today — v{version}` | industry/country | datetime) and footer (URL); `print-report-table` spacer pattern for per-page header/footer clearance
13. **Landing Page** (`/`): Persona-aware entry point.
    - 7-step journey rail: Learn → Assess → Explore → Test → Deploy → Ramp Up → Stay Agile
    - Persona-driven CTAs (Executive → Assess, Developer → Playground, Architect → Timeline, Researcher → Algorithms)
    - `ALWAYS_VISIBLE_PATHS`: `/learn`, `/timeline`, `/threats` (never dimmed)
    - Learning Journey `ScoreCard` with judo belt grading
14. **PQC Glossary**: Global floating glossary with 100+ PQC terms; accessible from any page via `GlossaryButton`; `InlineTooltip` links in learning module introductions.
15. **Personalization System**: 4-step onboarding wizard (Experience → Role → Region → Industry) with `PersonalizedAvatar` preview, info modals, and embedded `ScoreCard`. `usePersonaStore` v2 (Zustand, persisted) with `ExperienceLevel` (new/basics/expert). Drives nav visibility, landing CTAs, journey step prominence, and learning difficulty filtering.
    - **PQC Explainer**: Dismissible "Why does this matter?" landing component with 3 educational cards; persistent dismissal via localStorage.
    - **Page Accuracy Feedback**: Fixed bottom-left thumbs-up/down widget on 8 content routes; GA4 logging.
16. **Guided Tour**: Interactive first-visit onboarding with 3-phase centered card design.
    - Phase 1 — Intro (3 slides on why PQC matters)
    - Phase 2 — Knowledge Gate (adjusts tour length by experience level)
    - Phase 3 — Feature tour (up to 13 persona-filtered slides); swipeable cards
17. **Document Enrichment Pipeline**: `scripts/enrich-public-docs.py` extracts 11 structured dimensions from 220+ archived docs; outputs to `src/data/doc-enrichments/`; consumed by RAG corpus generator. Cross-domain linking and entity inventory for hallucination prevention.

## 3. Non-Functional Requirements

### 3.1 Design & Aesthetics

- **Premium Feel**: The app must have a "wow" factor.
- **Style**: Modern, tech-forward with dark/light mode toggle; vibrant accents (neon blues/purples/greens) representing "quantum" themes; `.glass-panel` glassmorphism for all card/pane containers.
- **Semantic tokens only**: ALWAYS use `text-primary`, `text-secondary`, `text-accent`, `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `bg-muted`, `border-border`. NEVER use raw palette classes (`text-blue-400`, `bg-gray-900`, etc.). See `docs/ux-standard.md`.
- **Animations**: Smooth Framer Motion transitions between views, staggered entrance animations.
- **Navigation**: Persistent, intuitive navigation bar across all routes.

### 3.2 Accessibility (ADA/WCAG 2.1 Level AA)

See **[Accessibility Requirements](requirements/accessibility.md)**.

- Semantic HTML and proper ARIA labels
- Full keyboard navigation support
- Minimum 4.5:1 color contrast ratio
- Screen reader compatibility
- Focus indicators on all interactive elements

### 3.3 Tech Stack

- **Framework**: React 19 + TypeScript + Vite 7.3.1
- **Styling**: Tailwind CSS 4.2.0 — theme defined inline in `src/styles/index.css` via `@theme` block (no separate config file)
- **Cryptography**:
  - OpenSSL WASM v3.6.0 (primary — ML-KEM, ML-DSA, SLH-DSA, LMS/HSS, RSA, EC, Ed25519, X25519)
  - `@oqs/liboqs-js` (FrodoKEM, HQC, Classic McEliece)
  - WASM wrappers in `src/wasm/` (ML-KEM, ML-DSA, LMS/HSS bindings)
  - `@noble/curves`, `@noble/hashes`, `@scure/bip32`, `@scure/bip39`, `@scure/base` (blockchain crypto)
  - `micro-eth-signer`, `ed25519-hd-key` (Ethereum/Solana)
  - Web Crypto API (`src/utils/webCrypto.ts`) — X25519, P-256, ECDH
  - `cborg` — Strict deterministic binary CBOR encoding for EUDI ISO 18013-5 mDoc structures.
- **State Management**: Zustand 5 with `persist` middleware
- **Routing**: React Router v7 (lazy-loaded routes)
- **Data**: Papa Parse (CSV), JSZip (file backup), LocalForage (storage)
- **UI/UX**: Framer Motion, Lucide React (icons only), React Markdown
- **Analytics**: Google Analytics 4 (GA4) with route tracking
- **Deployment**: Static build; GitHub Pages via `deploy.yml`; `Cross-Origin-Embedder-Policy: require-corp` + `Cross-Origin-Opener-Policy: same-origin` headers required for WASM SharedArrayBuffer

### 3.4 Development Standards

- **Code Splitting**: All top-level routes lazy-loaded via `React.lazy()` in `src/App.tsx`; `React.Suspense` boundaries with appropriate fallback loaders.
- **State**: Global/persisted state in Zustand stores (`src/store/`); business logic decoupled from view components.
- **Component contracts**: Use `<Button>` for all click targets, `<Input>` for text inputs, `<FilterDropdown>` for selects, `<CodeBlock>` for multi-line code. Shared UI components (`<Skeleton>`, `<EmptyState>`, `<ErrorAlert>`, `<CategoryBadge>`) exist in `src/components/ui/` — use them, do not inline-style as workaround.
- **TypeScript**: Strict mode; `interface` for objects, `type` for unions/primitives; no `any`.
- **Linting**: ESLint flat config (v9); `@typescript-eslint/no-explicit-any: error`; `no-console: error` (only `warn`/`error` in production; `console.log` permitted in PKILearning and data-loading services).
- **Formatting**: Prettier — no semicolons, single quotes, 100-char width, 2-space indent. Pre-commit hooks (Husky + lint-staged).
- **Icons**: `lucide-react` exclusively; icon colors must use semantic tokens.

### 3.5 User Interface

- **No Login Required**: Publicly accessible.
- **Responsive Design**: Desktop (full Gantt/table views) and mobile (<768px card/swipe layouts).
- **Content page header pattern** (all major views except Landing and About): `<Icon> + .text-gradient title + muted description + [SourcesButton, ShareButton, GlossaryButton]` (cluster hidden on mobile).
- **Theme**: Dark/light mode toggle, persisted via `useThemeStore`.

### 3.6 Testing

- **Unit**: Vitest + @testing-library/react; accessible queries preferred; 70% line/function/statement coverage, 60% branch coverage.
- **E2E**: Playwright in `e2e/`; 60s timeout (WASM loading); Chromium/Firefox/WebKit; axe-playwright accessibility checks.
- **Mocking**: WASM modules and external deps mocked in unit tests; `VITE_USE_MOCK_DATA` env var for mock data mode.

## 4. CSV Data Management

All CSV operations (insert, update, delete, format change, web source refresh) MUST follow `docs/CSVmaintenance.md`. Key rules:

- **Never edit a CSV in place** — copy to a new file with today's date (`MMDDYYYY`); loaders auto-discover latest via `import.meta.glob`.
- **Keep 2 versions** in `src/data/` for `New`/`Updated` badge tracking; archive older files to `src/data/archive/`.
- **ID fields are sacred** — never change `referenceId`, `threatId`, `name`, `softwareName`, etc.
- **Cross-references**: `compliance.libraryRefs → library.referenceId`, `compliance.timelineRefs → timeline events`, `library.dependencies → library.referenceId`.
- **Line endings**: Always normalize CRLF → LF after appending with shell tools.
- **After changes**: `npm run build && npm run test`, then visual check in browser.

## 5. Global Data Model

```typescript
// --- Timeline Types ---
type Phase =
  | 'Discovery'
  | 'Testing'
  | 'POC'
  | 'Migration'
  | 'Standardization'
  | 'Guidance'
  | 'Policy'
  | 'Regulation'
  | 'Research'
  | 'Deadline'

interface TimelineEvent {
  startYear: number
  endYear: number
  phase: Phase
  type: EventType
  title: string
  description: string
  sourceUrl?: string
  sourceDate?: string
  status?: string
  orgName: string
  orgFullName: string
  countryName: string
  flagCode: string
}

interface RegulatoryBody {
  name: string
  fullName: string
  countryCode: string
  events: TimelineEvent[]
}

interface CountryData {
  countryName: string
  flagCode: string
  bodies: RegulatoryBody[]
}

// --- Algorithm Types ---
interface AlgorithmTransition {
  classical: string
  pqc: string
  function: 'Encryption/KEM' | 'Signature'
  deprecationDate: string
  standardizationDate: string
}

// --- Impact Types ---
interface IndustryImpact {
  industry: string
  icon: string
  threats: string[]
  riskLevel: 'High' | 'Critical'
  description: string
}

// --- Leader Types ---
interface Leader {
  name: string
  role: string
  organization: string
  type: 'Public' | 'Private'
  contribution: string
  imageUrl?: string
}

// --- Assessment Types ---
interface AssessmentInput {
  industry: string
  country: string
  currentCrypto: string[]
  currentCryptoUnknown: boolean
  dataSensitivity: string[] // multi-select; worst-case (max) used in scoring
  complianceRequirements: string[]
  migrationStatus: string
  cryptoUseCases: string[]
  dataRetention: string[] // multi-select; worst-case (max) used in scoring
  systemCount: string
  teamSize: string
  cryptoAgility: string
  infrastructure: string[]
  vendorDependency: string
  timelinePressure: string
}

// --- Authoritative Sources ---
interface AuthoritativeSource {
  // 13-column CSV: lastVerifiedDate at index 12
  complianceCsv: boolean
  migrateCsv: boolean
  // ... other fields
}

type ViewType = 'Timeline' | 'Library' | 'Threats' | 'Leaders' | 'Compliance' | 'Migrate'
```
