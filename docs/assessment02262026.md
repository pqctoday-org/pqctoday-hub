# PQC Today — Value Assessment by Persona

**Date**: February 26, 2026
**Methodology**: Comprehensive codebase exploration of all features, data sources, persona-specific adaptations, accessibility patterns, and UX characteristics across 1,200+ data records, 89 authoritative sources, 25 learning modules, and 14 application views.

---

## Scoring Summary (1–10 scale)

| Dimension         | Executive | Developer | Architect | Researcher |
| ----------------- | --------- | --------- | --------- | ---------- |
| **Educational**   | 9         | 8         | 9         | 8          |
| **Practical**     | 8         | 9         | 9         | 7          |
| **Completeness**  | 8         | 8         | 9         | 7          |
| **Accuracy**      | 9         | 9         | 9         | 8          |
| **Valuable**      | 9         | 9         | 10        | 8          |
| **Accessibility** | 8.5       | 8.5       | 8.5       | 8.5        |
| **Usability**     | 9         | 8         | 8         | 7          |
| **Overall**       | **8.6**   | **8.5**   | **8.9**   | **7.6**    |

---

## Dimension Definitions

- **Educational** — Does it teach the persona what they need to know, at the right depth?
- **Practical** — Can the persona take action with what the app provides (tools, reports, catalogs)?
- **Completeness** — Does the app cover the full scope of what this persona needs for PQC readiness?
- **Accuracy** — Is the information correct, current, and properly sourced?
- **Valuable** — Would this persona recommend the app to peers? Does it save them real time/effort?
- **Accessibility** — Can users with disabilities (visual, motor, cognitive) use it effectively? (WCAG 2.1 AA)
- **Usability** — Is the UX intuitive, responsive, and well-designed for this persona's workflow?

---

## 1. Executive / CISO

**Profile**: Risk & strategy focus. Needs business cases, compliance deadlines, board-ready reports. Less interested in cryptographic internals.

### Educational — 9/10

- **6 dedicated executive-track modules** (PQC Risk Management, Business Case, Governance & Policy, Vendor & Supply Chain Risk, Migration Program Management, Compliance & Regulatory Strategy) — each 45 min, totaling ~4.5 hours of executive-focused curriculum
- Persona-specific learning path: 10 modules, ~9.5 hours curated sequence
- Wizard hints translate technical questions into business language ("If unsure, your security team can provide this detail")
- Threat landscape dashboard frames risk in terms of industry impact, not algorithm math
- **Gap**: Could benefit from more C-suite case studies and board presentation templates

### Practical — 8/10

- **Quick Assessment mode**: 6 questions, ~2 min — produces actionable risk report with country-aligned deadlines
- Report hides technical sections (HNDL/HNFL windows, algorithm migration details) and surfaces top-5 recommended actions
- Report CTAs: "Share with your board", "View compliance deadlines", "Start learning path"
- Print/PDF support with professional header/footer (version, industry, country, date)
- Timeline view shows compliance deadlines by country — directly usable for board planning
- Leaders view: 100+ industry leaders/experts for networking and benchmarking
- **Gap**: No executive dashboard with KPIs or trend tracking over time; no export to PowerPoint

### Completeness — 8/10

- Covers risk assessment, compliance mapping, threat landscape, vendor readiness, migration timeline
- 46 compliance frameworks tracked across FIPS, ACVP, Common Criteria, ISO, ETSI, 3GPP
- 89 authoritative sources with verification dates
- Cross-references from report to compliance, migrate, and timeline views
- **Gap**: Missing ROI calculator with dollar figures, insurance/liability considerations, peer benchmarking data

### Accuracy — 9/10

- Government sources (NIST IR 8547, NSA CNSA 2.0, ANSSI, BSI, NCSC) are primary references
- Timeline events cite source URLs and dates — all verifiable
- Compliance data scraped weekly from official databases (NIST CMVP, ACVP, Common Criteria)
- Risk scoring uses conservative defaults (worst-case for ambiguous inputs) — appropriate for executive risk posture
- **Minor concern**: FIPS 206 (FN-DSA) and HQC shown as standards but still in draft — could mislead non-technical executives

### Valuable — 9/10

- **Time savings**: Consolidates information from 89 authoritative sources into one platform — would take weeks to assemble manually
- **Decision support**: Risk report with country-specific deadlines directly informs budget and timeline decisions
- Compliance view answers "what do we need to certify against?" instantly
- Threat dashboard answers "what are we exposed to?" by industry
- Learning path builds PQC literacy without requiring engineering background
- **Would recommend**: Yes — this is one of very few tools that frames PQC as a business/governance challenge, not just a technical one

### Accessibility — 8.5/10

(See shared accessibility section below)

### Usability — 9/10

- Quick assessment mode respects executive time constraints (2 min)
- Auto-suggests "I don't know" for technical questions (crypto algorithms, agility, infrastructure)
- Report sections collapse/hide based on executive persona — no information overload
- Landing page CTAs are clear: "Assess Your Risk" primary, "View the Timeline" secondary
- Navigation filtered to only relevant views (assess, report, leaders, library, compliance, migrate)
- Print support is production-quality for board distribution
- **Gap**: Could benefit from a persistent executive dashboard rather than re-running assessments

---

## 2. Developer

**Profile**: Hands-on implementer. Needs working code, algorithm specs, library compatibility, and testing tools.

### Educational — 8/10

- 16 technical modules covering PQC fundamentals through protocol-specific implementation (TLS, VPN/SSH, email signing, PKI, key management, code signing, API/JWT, IoT/OT)
- Persona learning path: 15 modules, ~14 hours — heavier on protocol and implementation modules
- Wizard hints use developer language ("Check package.json, go.mod, or requirements.txt")
- Algorithm transition guide maps classical to PQC directly (RSA-2048 → ML-KEM-768, ECDSA → ML-DSA)
- **Gap**: Limited code-level tutorials; modules teach concepts but don't walk through library integration step-by-step (no copy-paste code snippets for specific languages/frameworks)

### Practical — 9/10

- **Playground**: 8-tab interactive crypto environment with real WASM execution (ML-KEM, ML-DSA, AES, hashing, signing) — not simulated
- **OpenSSL Studio**: Full OpenSSL v3.6.0 CLI in browser with 14 command categories, workbench builder, file manager
- Algorithm comparison table: 45 algorithms with key sizes, performance, security levels — directly usable for implementation decisions
- Migrate catalog: 223 products across 7 infrastructure layers with FIPS certification status
- Performance metrics in playground (color-coded latency: <100ms green, 100-500ms amber, >500ms red)
- Key persistence across sessions in playground
- **Gap**: No SDK/library integration guides, no language-specific code generation, no CI/CD integration templates

### Completeness — 8/10

- Covers all NIST-standardized PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) plus drafts (FN-DSA, HQC)
- Includes lesser-known algorithms (FrodoKEM, Classic McEliece, BIKE, NTRUPrime) via liboqs
- Library: 133 reference documents (RFCs, NIST papers, ETSI specs)
- X.509 certificate profiles for Financial, General IT, and Telecom use cases
- **Gap**: No API documentation for the WASM bindings; no performance benchmarking suite; limited coverage of language-specific libraries (Go, Rust, Python crypto ecosystems)

### Accuracy — 9/10

- Algorithm parameters sourced from FIPS 203/204/205 specifications
- Key sizes, security levels, and performance ratios match official NIST documents
- OpenSSL WASM runs real OpenSSL 3.6.0 — not a simulation
- IETF RFC references are current (RFC 9794, 9802, 9810, 9814, 9882)
- **Minor concern**: Relative performance metrics (1x, 1.5x, 2x) rather than absolute cycle counts — platform-dependent

### Valuable — 9/10

- **Unique offering**: Browser-based OpenSSL + liboqs lab is extremely rare — eliminates local setup friction
- Algorithm comparison table saves hours of manual spec-reading
- Migrate catalog answers "which libraries/products support PQC already?" — critical for technology selection
- FIPS certification badges prevent compliance surprises during implementation
- Report CTAs: "Try algorithms in Playground", "Browse PQC libraries" — actionable next steps
- **Would recommend**: Yes — the playground and OpenSSL studio alone justify adoption for any developer evaluating PQC

### Accessibility — 8.5/10

(See shared accessibility section below)

### Usability — 8/10

- Playground tabs are well-organized by operation type
- OpenSSL Studio workbench builder reduces CLI learning curve
- Navigation filtered to technical views (algorithms, library, migrate, playground, openssl)
- Deep linking with URL params for sharing filtered views
- **Gap**: OpenSSL command builder could benefit from more inline help/examples; playground lacks "recipes" for common operations (e.g., "generate ML-KEM keypair and encapsulate"); no API/SDK for programmatic access

---

## 3. Architect

**Profile**: System-level thinker. Needs infrastructure mapping, migration planning, compliance alignment, and cross-cutting analysis.

### Educational — 9/10

- Learning path spans the full breadth: 16 modules, ~18+ hours covering fundamentals through governance
- Wizard hints frame questions at the system level ("Map all algorithms across your system topology — consider protocol-level, storage-level, and identity-level uses")
- Crypto agility module teaches abstraction patterns directly relevant to architecture decisions
- 5G Security, IoT/OT, and Digital ID modules cover emerging architecture domains
- QKD module is a 5-part deep dive (150 min) — the deepest single module, suited to architectural evaluation
- **Gap**: No architecture decision record (ADR) templates or system modeling tools

### Practical — 9/10

- **Comprehensive Assessment**: 13-step wizard produces multi-dimensional risk score (Security, Compliance, Operational, Timeline)
- Report shows all sections open (assessment profile, threat landscape, migration roadmap, toolkit)
- Infrastructure stack visualization in Migrate view maps 7 layers — directly mirrors enterprise architecture
- Compliance heat map shows standards x products — identifies certification gaps
- Cross-references from report to compliance, migrate, timeline enable end-to-end planning
- Report CTAs: "View migration catalog", "Explore infrastructure layers", "Start learning path"
- **Gap**: No dependency graph visualization, no migration sequence planner, no architecture diagram export

### Completeness — 9/10

- **Best coverage of any persona** — architect sees all navigation paths (same as researcher except persona-specific framing)
- Full compliance framework coverage (FIPS, ACVP, Common Criteria, ISO, ETSI, 3GPP, BSI, ANSSI, NCSC)
- 223 products across 7 infrastructure layers with certification cross-references
- 187 timeline events across 80+ organizations for migration planning context
- 79 threats mapped by industry for risk-informed architecture
- X.509 profiles for 3 sectors (Financial, General IT, Telecom)
- **Gap**: Limited coverage of hybrid deployment patterns (how to run classical + PQC simultaneously during migration); no integration testing guidance

### Accuracy — 9/10

- Same data quality as other personas — sourced from 89 authoritative bodies
- Infrastructure layer mapping reflects real enterprise stack (OS/Runtime → Networking → Browsers → Databases → Cloud → Enterprise → Middleware)
- FIPS certification status uses three-tier system (Validated/Partial/No) — accurately reflects real-world certification complexity
- Compliance data scraped from official databases with 7-day refresh cycle

### Valuable — 10/10

- **Highest value persona** — the app was essentially built for this use case
- Consolidates migration planning (what products?), compliance alignment (what standards?), risk assessment (what urgency?), and timeline tracking (what deadlines?) in one platform
- Infrastructure stack visualization is unique — no other public tool maps PQC readiness across all enterprise layers
- Country-specific deadline recommendations align architecture decisions with regulatory reality
- Would enable an architect to produce a PQC migration plan that would otherwise take months of research
- **Would recommend**: Strongly yes — this is the most complete PQC migration planning tool publicly available

### Accessibility — 8.5/10

(See shared accessibility section below)

### Usability — 8/10

- Comprehensive mode assessment (13 steps) is the right depth for architectural planning
- Infrastructure layer visualization provides intuitive navigation of the product landscape
- Deep linking enables sharing specific views with team members
- Filter patterns are consistent across views (FilterDropdown component)
- **Gap**: The breadth of content can be overwhelming — no guided "architect's workflow" that sequences the views logically; would benefit from a migration planning wizard that connects assess → comply → migrate → timeline into a single flow

---

## 4. Researcher

**Profile**: Deep technical exploration. Wants comprehensive algorithm data, academic references, and experimental tools. All paths visible.

### Educational — 8/10

- Full learning path: all 16 modules, ~25 hours — the most comprehensive
- QKD module (150 min) is research-grade: BB84 simulator with configurable Eve interception, real deployment data, post-processing algorithms, HSM key derivation
- Entropy & Randomness module covers NIST SP 800-90, DRBG, TRNG vs QRNG with interactive testing
- Merkle Tree Certificates module: interactive tree building, inclusion proofs
- Stateful hash signatures: LMS/HSS state management — a niche but important research topic
- **Gap**: No primary research papers integration (arXiv/IACR links in library but not embedded); no hypothesis testing tools; no algorithm implementation comparison framework

### Practical — 7/10

- OpenSSL Studio provides real command-line access for experimentation
- Playground enables KEM/signature/hashing operations with real WASM
- Algorithm comparison table with 45 algorithms and full parameter sets
- ACVP test vector support for validation testing
- **Gap**: No batch operation mode for performance benchmarking; no algorithm implementation source code access; no custom parameter experimentation beyond predefined options; no data export for analysis; no comparative benchmarking framework

### Completeness — 7/10

- Algorithm coverage: 45 algorithms (11 standardized/draft PQC, 8 classical, ~26 hash/stateful variants)
- Library: 133 references but research-focused papers are a small subset
- Standards tracking: NIST, IETF, ISO covered — but academic conference proceedings (PQCrypto, CRYPTO, Eurocrypt) not systematically tracked
- **Gap**: Missing advanced topics — side-channel analysis, fault injection, multi-party computation with PQC, lattice reduction techniques, cryptanalysis developments; no coverage of NIST additional digital signature round 2 candidates beyond FN-DSA

### Accuracy — 8/10

- Algorithm parameters match published standards
- References to specific RFCs and NIST documents are verifiable
- Conservative security level claims (NIST 5-level framework correctly applied)
- **Concern**: Performance metrics are relative (not absolute cycle counts on reference hardware); no confidence intervals on CRQC timeline estimates; some threat quantification (e.g., "$500B+ Bitcoin exposure") is price-dependent and may date quickly

### Valuable — 8/10

- **Unique value**: Browser-based PQC experimentation without local toolchain setup
- Algorithm transition guide provides quick reference for classical → PQC mapping
- Glossary (100+ terms) is a useful reference
- RAG chatbot enables natural-language queries across all content
- **Limitation**: A researcher likely already has local OpenSSL/liboqs installed — the browser tools are convenient but not essential
- **Would recommend**: Yes for students and early-career researchers; experienced cryptographers would find the depth insufficient but the breadth useful as a reference

### Accessibility — 8.5/10

(See shared accessibility section below)

### Usability — 7/10

- All navigation paths visible (researcher = no filtering) — maximum discoverability
- Landing page CTAs: "Explore Algorithms", "Try the Playground" — correctly prioritized
- Deep linking works well for sharing specific algorithm comparisons
- **Gap**: No data export functionality; no API access for programmatic queries; the flat navigation (14 top-level routes) makes it harder to find specific content without prior knowledge of the app structure; could benefit from a research-oriented view that surfaces related content across modules/views (e.g., "show me everything about ML-KEM-1024")

---

## 5. Accessibility — 8.5/10 (All Personas)

Accessibility is persona-independent — the same UX serves all users.

### Strengths

| Area                | Rating    | Evidence                                                                                     |
| ------------------- | --------- | -------------------------------------------------------------------------------------------- |
| Semantic HTML       | Good      | `<header>`, `<nav>`, `<main>`, `<footer>` landmarks with proper roles                        |
| ARIA attributes     | Excellent | 40+ files with aria-label, aria-live regions, full listbox pattern in FilterDropdown         |
| Keyboard navigation | Excellent | Escape/Enter/Space handlers, focus restoration, 131 focus-visible occurrences                |
| Color contrast      | Excellent | HSL semantic token system enforces WCAG AAA-level contrast ratios                            |
| Focus indicators    | Excellent | Consistent `focus-visible:ring-2 focus-visible:ring-primary` across all interactive elements |
| Alt text            | Good      | All images have alt attributes; decorative images use empty alt=""                           |
| ESLint jsx-a11y     | Active    | Recommended ruleset enforced across all .tsx files                                           |
| E2E a11y testing    | Active    | axe-playwright integration in timeline tests (desktop, mobile, interactive states)           |

### Gaps

| Area                     | Rating      | Impact                                                                           |
| ------------------------ | ----------- | -------------------------------------------------------------------------------- |
| Skip-to-main link        | Missing     | Keyboard users must tab through entire nav to reach content                      |
| prefers-reduced-motion   | Missing     | 57 animated components (framer-motion) play regardless of user preference        |
| Focus trapping in modals | Partial     | RightPanel (chat) doesn't trap focus — tabs can escape the modal                 |
| Heading hierarchy        | Needs audit | Spot checks show h3 without preceding h2 in some views                           |
| Label associations       | Partial     | Label component exists but some form inputs may lack explicit `htmlFor` bindings |

---

## 6. Usability — Shared Strengths (All Personas)

| Area              | Rating    | Evidence                                                                     |
| ----------------- | --------- | ---------------------------------------------------------------------------- |
| Responsive design | Excellent | Mobile-first Tailwind; 44px touch targets; safe-area-inset padding           |
| Loading states    | Excellent | Skeleton components, Suspense boundaries, spinner fallbacks                  |
| Error handling    | Good      | ErrorBoundary with chunk-load retry, ErrorAlert component                    |
| Empty states      | Good      | Dedicated EmptyState component (icon + title + description + action)         |
| Dark/light mode   | Excellent | System preference detection + user override + localStorage persistence       |
| Print support     | Excellent | Professional header/footer, light-mode forced, page-break control            |
| Performance       | Excellent | 15 lazy-loaded routes, WASM loading with progress indicators                 |
| Search/filter     | Excellent | Consistent FilterDropdown pattern across views, deep linking with URL params |
| Onboarding        | Good      | Guided tour, persona picker, What's New toast, ScoreCard progression         |

---

## Key Findings

### Who benefits most?

1. **Architect** (8.9) — the app's breadth across compliance, migration, timeline, and risk assessment perfectly matches the architect's cross-cutting responsibilities
2. **Executive** (8.6) — the persona-aware simplification (quick mode, auto-"I don't know", executive report sections) makes PQC accessible without technical depth
3. **Developer** (8.5) — the playground and OpenSSL studio are uniquely valuable; the migrate catalog answers real procurement questions
4. **Researcher** (7.6) — useful as a reference platform but lacks the depth, data export, and benchmarking tools that serious research demands

### Standout differentiators

- **Browser-based OpenSSL + liboqs**: No other public tool offers real PQC crypto operations in-browser
- **Persona-adaptive assessment**: Same wizard, radically different experience per role
- **89 authoritative sources with verification dates**: Rare level of data provenance for a free tool
- **Infrastructure stack visualization**: Unique PQC readiness mapping across all enterprise layers
- **Weekly compliance scraping**: Automated currency from NIST, ACVP, Common Criteria, ANSSI, ENISA

### Top improvement opportunities

1. **Skip-to-main link + prefers-reduced-motion** — low-effort, high-impact accessibility fixes
2. **Data export** (CSV/PDF/API) — all personas would benefit from getting data out of the app
3. **Executive dashboard** — persistent KPI tracking instead of point-in-time assessment
4. **Research depth** — algorithm benchmarking suite, paper integration, custom parameter experimentation
5. **Guided workflows** — "Architect's migration planning flow" connecting assess → comply → migrate → timeline

---

## Data Foundation

| Dataset               | Records    | Last Updated | Sources                            |
| --------------------- | ---------- | ------------ | ---------------------------------- |
| Timeline Events       | 187        | Feb 24, 2026 | 80+ organizations, 50+ countries   |
| Library Resources     | 133        | Feb 26, 2026 | 30+ standards bodies               |
| Algorithm Reference   | 45         | Feb 26, 2026 | FIPS 203/204/205/206, NIST IR 8545 |
| Compliance Frameworks | 46         | Feb 24, 2026 | NIST, ACVP, Common Criteria, ANSSI |
| Migrate Products      | 223        | Feb 28, 2026 | 7 infrastructure layers            |
| Threat Landscape      | 79         | Feb 16, 2026 | 8+ industry sectors                |
| Industry Leaders      | 101        | Feb 25, 2026 | Public, Private, Academic sectors  |
| Quiz Questions        | 440        | Feb 26, 2026 | All PQC topic areas                |
| Authoritative Sources | 89         | Feb 22, 2026 | Government, Academic, Industry     |
| Learning Modules      | 25         | Feb 26, 2026 | 2,000+ min of content              |
| **Total**             | **1,368+** |              |                                    |
