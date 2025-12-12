# PQC Timeline Application - Master Requirements

## 1. Project Overview

The goal is to build a high-end, visually stunning web application that visualizes the global transition to Post-Quantum Cryptography (PQC). The application serves as a comprehensive resource for understanding regulatory timelines, algorithm transitions, industry impacts, and key leaders in the field.

## 2. Functional Modules

The application is divided into ten main modules. Detailed requirements for each are linked below:

1.  **[Migration Timeline](requirements/timeline.md)**: Visualization of global regulatory recommendations and migration phases.
2.  **[Algorithms Transition](requirements/algorithms.md)**: Comparison table showing the shift from Classical (RSA/ECC) to PQC (ML-KEM/ML-DSA) standards.
3.  **[Interactive Playground](requirements/playground.md)**: Hands-on testing environment for ML-KEM and ML-DSA cryptographic operations.
    - Includes **[ACVP Testing](requirements/playground.md#11-acvp-testing-automated-cryptographic-validation)**: Automated validation against NIST test vectors (now part of playground.md).
4.  **[OpenSSL Studio](requirements/opensslstudio.md)**: Browser-based OpenSSL v3.5.4 workbench with WebAssembly.
    - Full PQC algorithm support (ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA all 12 variants)
    - 12 operation types: Key Generation, CSR, Certificate, Sign/Verify, Random, Version, Encryption, Hashing, KEM, PKCS#12
    - Virtual file system with backup/restore capabilities
5.  **[Quantum Threat Impacts](requirements/impacts.md)**: Dashboard showing specific risks to industries like Finance, IoT, and Government.
6.  **[Transformation Leaders](requirements/leaders.md)**: Profiles of key public and private figures driving the transition.
7.  **[Learning Platform](requirements/learn.md)**: Comprehensive educational platform with multiple modules:
    - **[PKI Workshop](requirements/learn.md#module-1-pki-workshop-implemented)**: 4-step certificate lifecycle (CSR → Root CA → Certificate Issuance → Parsing)
    - **[Digital Assets Program](requirements/digital_assets.md)**: Blockchain cryptography for Bitcoin, Ethereum, Solana, and HD Wallet (BIP32/39/44)
    - **[5G Security Education](requirements/5G_Security_Educational_Module_Requirements.md)**: SUCI Deconcealment (Profiles A/B/C) and 5G-AKA authentication with MILENAGE
    - **[EU Digital Identity Wallet](requirements/EUDI_Wallet_Educational_Module_Requirements.md)**: EUDI Wallet ecosystem with Remote HSM architecture, PID issuance, and QES
    - **Introduction Module**: Overview and getting started guide
8.  **[Compliance Module](requirements/Compliance_Module_Requirements.md)**: Real-time compliance tracking and standards monitoring.
    - NIST FIPS document tracking (203, 204, 205)
    - ANSSI recommendations
    - Common Criteria certifications
    - Automated data scraping and visualization
9.  **[Standards Library](requirements/library.md)**: Comprehensive PQC standards repository with categorized documents.
10. **[About & Feedback](requirements/about.md)**: Project information, feedback mechanisms, and Software Bill of Materials (SBOM).

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
- **Cryptography**: OpenSSL WASM v3.5.4 with PQC support, @noble/curves, @noble/hashes, @scure ecosystem (bip32/bip39/base)
- **State Management**: Zustand
- **Deployment**: Static build (ready for Netlify/Vercel)
- **Analytics**: Google Analytics 4 (GA4) with route tracking
- **Build Info**: Static build timestamp injected at compile time

### 3.4 User Interface

- **No Login Required**: Publicly accessible.
- **Responsive Design**: Must work seamlessly on desktop and mobile devices.
  - **Desktop**: Full Gantt chart with sortable columns and filters
  - **Mobile** (<768px): Card-based layout with swipeable phase navigation
  - **Breakpoint**: `md:` prefix (768px) used to toggle between desktop and mobile views

## 4. Global Data Model

The application will use a static JSON configuration. Below are the shared interfaces:

```typescript
// --- Timeline Types ---
type Phase = 'Discovery' | 'Testing' | 'POC' | 'Migration' | 'Deadline' | 'Standardization'

interface TimelineEvent {
  year: number
  quarter?: string
  phase: Phase
  title: string
  description: string
  sourceUrl: string
  sourceDate: string
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
