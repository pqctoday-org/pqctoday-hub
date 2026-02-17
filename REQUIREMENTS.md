# PQC Timeline Application - Master Requirements

## 1. Project Overview

The goal is to build a high-end, visually stunning web application that visualizes the global transition to Post-Quantum Cryptography (PQC). The application serves as a comprehensive resource for understanding regulatory timelines, algorithm transitions, industry impacts, and key leaders in the field.

## 2. Functional Modules

The application is divided into ten main modules. Detailed requirements for each are linked below:

1.  **[Migration Timeline](requirements/timeline.md)**: Visualization of global regulatory recommendations and migration phases.
2.  **[Quantum Threat Impacts](requirements/impacts.md)**: Dashboard showing specific risks to industries like Finance, IoT, and Government.
3.  **[Algorithms Transition](requirements/algorithms.md)**: Comparison table showing the shift from Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) standards.
4.  **[Standards Library](requirements/library.md)**: Comprehensive PQC standards repository with categorized documents.
5.  **[Learning Platform](requirements/learn.md)**: Comprehensive educational platform with multiple modules:
    - **[PKI Workshop](requirements/learn.md#module-1-pki-workshop-implemented)**: 4-step certificate lifecycle (CSR → Root CA → Certificate Issuance → Parsing)
    - **[Digital Assets Program](requirements/digital_assets.md)**: Blockchain cryptography for Bitcoin, Ethereum, Solana, and HD Wallet (BIP32/39/44)
    - **[5G Security Education](requirements/5G_Security_Educational_Module_Requirements.md)**: SUCI Deconcealment (Profiles A/B/C) and 5G-AKA authentication with MILENAGE
    - **[EU Digital Identity Wallet](requirements/EUDI_Wallet_Educational_Module_Requirements.md)**: EUDI Wallet ecosystem with Remote HSM architecture. Features 7-step interactive flows for PID Issuance (OpenID4VCI) and Relying Party verification (OpenID4VP), plus QEAA Attestation and Remote QES.
    - **[TLS 1.3 Basics](requirements/learn_openssltls13_requirement.md)**: Interactive TLS 1.3 handshake simulation with PQC algorithm support (ML-KEM, ML-DSA)
    - **PQC 101 Introduction**: Beginner-friendly overview of quantum threats, Shor's algorithm, at-risk sectors, and HNDL attacks
    - **[PQC Quiz](requirements/learn.md#module-7-pqc-quiz-implemented)**: Interactive knowledge assessment with 70+ questions across 8 categories, 3 quiz modes, and per-category score tracking
6.  **[Migrate Module](requirements/Migrate_Module_Requirements.md)**: Comprehensive reference database of PQC-ready software and infrastructure.
    - Software Reference Database (OS, Libraries, Network, etc.)
    - Change tracking with "New" and "Updated" indicators
    - Filterable dashboard for migration planning
7.  **[Interactive Playground](requirements/playground.md)**: Hands-on testing environment for ML-KEM and ML-DSA cryptographic operations.
    - Includes **[ACVP Testing](requirements/playground.md#11-acvp-testing-automated-cryptographic-validation)**: Automated validation against NIST test vectors (now part of playground.md).
8.  **[OpenSSL Studio](requirements/opensslstudio.md)**: Browser-based OpenSSL v3.6.0 workbench with WebAssembly.
    - Full PQC algorithm support (ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA all 12 variants, LMS/HSS)
    - 13 operation types: Key Generation, CSR, Certificate, Sign/Verify, Random, Version, Encryption, Hashing, KEM, PKCS#12, LMS/HSS
    - Virtual file system with backup/restore capabilities
9.  **[Compliance Module](requirements/Compliance_Module_Requirements.md)**: Real-time compliance tracking and standards monitoring.
    - NIST FIPS document tracking (203, 204, 205)
    - ANSSI recommendations
    - Common Criteria certifications
    - Automated data scraping and visualization
10. **[Transformation Leaders](requirements/leaders.md)**: Profiles of key public and private figures driving the transition.
11. **[About & Feedback](requirements/about.md)**: Project information, feedback mechanisms, and Software Bill of Materials (SBOM).
12. **PQC Risk Assessment** (`/assess`): 12-step quantum risk evaluation wizard with compound scoring engine, 4 risk dimensions (Quantum Exposure, Migration Complexity, Regulatory Pressure, Organizational Readiness), HNDL risk window visualization, and URL-shareable assessments.

## 3. Non-Functional Requirements

### 3.1 Design & Aesthetics

- **Premium Feel**: The app must have a "wow" factor.
- **Style**: Modern, tech-forward, potentially dark mode with vibrant accents (neon blues/purples/greens) representing "quantum" themes.
- **Animations**: Smooth transitions between views, staggered entrance animations, and interactive elements.
- **Glassmorphism**: Use of translucent elements to create depth.
- **Navigation**: A persistent, intuitive navigation bar to switch between the four main modules.

### 3.2 Accessibility (ADA/WCAG 2.1 Level AA)

The application meets WCAG 2.1 Level AA accessibility standards. For comprehensive accessibility requirements, see **[Accessibility Requirements](requirements/accessibility.md)**.

**Key Requirements:**

- Semantic HTML and proper ARIA labels
- Full keyboard navigation support
- Minimum 4.5:1 color contrast ratio
- Screen reader compatibility
- Focus indicators on all interactive elements

### 3.3 Tech Stack

- **Framework**: React 19 (Vite 7)
- **Styling**: Tailwind CSS 4 (using CSS Variables for theming)
- **Cryptography**: OpenSSL WASM v3.6.0 (with native ML-KEM, ML-DSA, LMS/HSS support), @openforge-sh/liboqs (FrodoKEM, HQC, Classic McEliece), @noble/curves, @noble/hashes, @scure ecosystem (bip32/bip39/base)
- **State Management**: Zustand
- **Deployment**: Static build (ready for Netlify/Vercel)
- **Analytics**: Google Analytics 4 (GA4) with route tracking
- Build Info: Static build timestamp injected at compile time

### 3.4 Development Standards (React Best Practices)

- **Code Splitting**:
  - All top-level route components must be lazy-loaded using `React.lazy`.
  - Heavy sub-modules (e.g., Learning Modules) must use nested lazy loading.
  - `React.Suspense` boundaries must be used with appropriate fallback loaders (global spinner for routes, scoped spinner for modules).
- **State Management**:
  - **Global & Persisted**: Use `Zustand` with `persist` middleware for long-lived data (e.g., `useOpenSSLStore` for keys/certs).
  - **Decoupling**: Business logic and data storage must remain independent of View components to ensure data persists across lazy-loaded chunks.
- **Quality Assurance**:
  - **Linting**: Strict adherence to `eslint-plugin-security` and `react-hooks/exhaustive-deps`.
  - **False Positives**: Must be explicitly suppressed with `eslint-disable-next-line` and a justification if the pattern is safe.
  - **Performance**: Avoid synchronous imports of large libraries (like `framer-motion` or `lucide-react` full sets) where possible.

### 3.5 User Interface

- **No Login Required**: Publicly accessible.
- **Responsive Design**: Must work seamlessly on desktop and mobile devices.
  - **Desktop**: Full Gantt chart with sortable columns and filters
  - **Mobile** (<768px): Card-based layout with swipeable phase navigation
  - **Breakpoint**: `md:` prefix (768px) used to toggle between desktop and mobile views

## 4. Global Data Model

The application will use a static JSON configuration. Below are the shared interfaces:

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
```
