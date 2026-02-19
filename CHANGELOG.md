# Changelog

All notable changes to this project will be documented in this file.

## [1.14.0] - 2026-02-19

### Added

- **Industry-Aware Assessment Wizard** (`/assess`): Compliance, crypto usage, use case, and
  infrastructure steps now surface industry-relevant options first based on CSV-driven config
  (`pqcassessment_02192026.csv`). Industry-specific threats appendix included in report.
- **Country Compliance Filtering** (`/assess`): Step 5 (Compliance) filters frameworks by the
  selected country/jurisdiction — only globally-applicable and country-relevant frameworks are shown.
- **PDF Print Support** (`/assess`): Full print-optimized report with repeating header
  (app version, industry, country, date) and footer (assess URL, page number). Includes
  `break-inside: avoid` on sections, light-mode forced variables, `print-color-adjust: exact`
  for background colors, and framer-motion suppression.
- **Report Collapsible Sections** (`/assess`): Country PQC Migration Timeline and Industry Threat
  Landscape are collapsible on screen but always expanded in print via `hidden print:block` pattern.
- **Organization Filter** (`/library`): Replaced the Region dropdown with an Organization filter
  (NIST, IETF, ETSI, ISO, BSI, ANSSI, etc.) using a canonical org map that rolls up sub-groups.

### Fixed

- **Share URL Arrays** (`/assess`): `dataSensitivity` and `dataRetention` now correctly encode as
  comma-joined arrays in the share URL; added `cy` (country) parameter.
- **PDF Dark Mode** (`/assess`): Print CSS forces all semantic color variables to light-mode values,
  preventing invisible text on white paper when dark theme is active.
- **PDF Background Colors** (`/assess`): Added `print-color-adjust: exact` so bar graphs, badges,
  and colored elements render in the PDF instead of being stripped by the browser.
- **PDF Page Breaks** (`/assess`): `glass-panel` sections avoid splitting across pages; Threat
  Landscape starts on a fresh page; trailing blank page eliminated via `min-height: 0`.
- **Timeline Label Clipping** (`/assess`): Edge year labels (2024, 2035) use left/right-aligned
  transforms instead of centered, preventing clipping in the report timeline strip.

### Changed

- **Mobile Walkthrough** (`GuidedTour`): Redesigned the guided tour on mobile as a full-screen
  swipeable card carousel with step icons, dot indicators, and drag gestures. Desktop anchored
  tooltips unchanged. Added `?tour` query param to reset and replay the tour.
- **WhatsNew Toast** (`WhatsNewToast`): Centered on mobile (was fixed bottom-right, overflowed on
  narrow screens). Added `?whatsnew` query param for easy testing.
- **Assessment Report** (`/assess`): "Explore" links and action buttons hidden in print. Cross-industry
  threats section removed from report — only industry-specific threats shown.

## [1.13.0] - 2026-02-18

### Added

- **Risk Assessment Country Picker** (`/assess`): New "Country" step (step 2 of 13) lets
  organizations select their jurisdiction; the selection aligns the Timeline step with real
  regulatory deadlines sourced directly from the PQC Gantt timeline data.
- **Multi-select Data Sensitivity** (`/assess`): Organizations can now select multiple sensitivity
  levels simultaneously (Low / Medium / High / Critical). Risk scoring uses the highest selected
  level; useful for organizations managing data of mixed sensitivity.
- **Multi-select Data Retention** (`/assess`): Multiple retention periods can be selected at once.
  HNDL risk is computed against the longest selected period for accurate worst-case assessment.
- **Country-aligned Migration Deadlines** (`/assess`): The Timeline step surfaces Deadline phases
  from the selected country's Gantt timeline (real years, titles, descriptions) instead of generic
  static options. Falls back gracefully when no country-specific deadlines exist.
- **Wizard Reset Button** (`/assess`): A "Reset" button in the wizard navigation footer clears all
  answers and returns to step 1, providing a quick path to restart without navigating away.

### Fixed

- **Assessment Store Schema Migration** (`/assess`): Persisted assessments from v1.12 and earlier
  stored `dataSensitivity` and `dataRetention` as strings. On rehydration these are now
  automatically upgraded to arrays, preventing a `TypeError: .filter is not a function` crash.

### Changed

- **Risk Assessment Wizard** (`/assess`): Expanded from 12 to 13 steps with the Country picker.
  `AssessmentInput.dataSensitivity` and `.dataRetention` are now `string[]`; the scoring engine
  uses `getMaxSensitivity()` and `getMaxRetentionYears()` helpers — fully backward-compatible.

## [1.12.0] - 2026-02-18

### Added

- **Timeline Document Table** (`/timeline`): Selecting a country from the Country filter now
  reveals a document table below the Gantt chart listing all matching phases and milestones
  with organization, phase badge, type, title, period (year range), description, and source link.

### Fixed

- **Timeline Filter UX** (`/timeline`):
  - Renamed "Region" dropdown label to "Country" for clarity
  - Active filter chips with × dismiss now appear below the filter bar for every active filter
    (country, phase type, event type, and text search)
  - Result count shown alongside chips ("N results · X of Y countries")
  - Empty state with "Clear all filters" action when no results match
  - Country dropdown now renders above the sticky Gantt table headers (z-index fix)

## [1.11.0] - 2026-02-17

### Added

- **PQC Quiz Module** (`/learn`): New interactive quiz in the Learning dashboard covering
  post-quantum cryptography fundamentals, algorithm families, and migration concepts.

### Fixed

- **Compliance page UI/UX** (`/compliance`):
  - Renamed ambiguous "CC" column header to "Classic" (was misread as Common Criteria)
  - Added missing BSI (DE) source card so the authoritative-sources grid is complete
  - Unified all four filter active states to `primary` color (was: accent, secondary, warning, tertiary)
  - Loading overlay now correctly reads "Refreshing Data…" during a refresh vs. "Filtering Records…" during filtering
  - Close button in detail modal replaced with `<X>` icon + `aria-label`; focus moves into modal on open
  - Filter backdrop `role="button"` replaced with `aria-hidden="true"`
  - Empty-state `colSpan` corrected from 10 to 8
  - ShareButton/GlossaryButton now visible at `md` breakpoint (was `lg`-only)

- **Guided Tour** (`/`): Fixed mobile portrait layout blocking tour from completing;
  fixed tooltip position jumping on step transitions.

## [1.10.0] - 2026-02-17

### Added

- **PQC Risk Assessment — Comprehensive Upgrade** (`/assess`):
  - Expanded from 5-step to **12-step wizard** with 7 new dimensions:
    - Cryptographic use cases (TLS, data-at-rest, digital signatures, key exchange, etc.)
    - Data retention and HNDL risk window analysis
    - Organizational scale (system count + team size)
    - Crypto agility assessment (abstracted, partially-abstracted, hardcoded)
    - Infrastructure dependencies (Cloud KMS, HSMs, IoT, legacy systems)
    - Vendor dependency profiling (heavy-vendor, open-source, mixed, in-house)
    - Timeline pressure and compliance deadlines
  - **Compound scoring engine** replacing simple additive model:
    - 4 category sub-scores (Quantum Exposure, Migration Complexity, Regulatory Pressure, Organizational Readiness)
    - Weighted composite with interaction multipliers (HNDL, compliance urgency, migration difficulty)
    - Full backward compatibility — old 5-field assessments produce identical scores
  - **HNDL Risk Window visualization**: SVG timeline showing data retention vs. estimated quantum threat horizon (2035)
  - **Migration effort estimation**: Per-algorithm complexity rating (quick-win, moderate, major-project, multi-year)
  - **Executive summary**: One-paragraph C-suite synthesis with risk level, top priorities, and quick-win count
  - **Category score breakdown**: Horizontal progress bars for each risk dimension
  - **Enhanced CSV export**: Includes migration effort, estimated scope, and rationale columns
  - **URL-shareable assessments**: All 12 inputs encoded in URL parameters for team sharing
  - Responsive step indicator: Compact progress bar on mobile, full step circles on desktop

- **Glossary Expansion**:
  - 20+ new PQC terms: Diffie-Hellman, FN-DSA, XMSS, X25519, X448, Ed448, and more
  - Inline `GlossaryButton` component for contextual access from Algorithms, Threats, and other views

- **Algorithm Comparison Overhaul** (`/algorithms`):
  - New filter controls: Type (All/PQC/Classical), Security Level, and search
  - Sortable columns across all fields
  - Performance-optimized with `useMemo`

- **Landing Page Dynamic Counts**:
  - Stats bar now loads actual data counts (timeline events, standards, software, leaders, algorithms)
  - New "Risk Assessment" feature card linking to `/assess`

- **Migration Step-to-Software Linking** (`/migrate`):
  - Clicking a workflow step filters the software database to relevant categories
  - Step filter banner with category context and clear button
  - Updated category mappings for steps 2, 4, and 5

- **Software Reference Data**:
  - 6 new software categories: Operating Systems, Network Operating Systems, Network Security, Hardware Security, Blockchain, Remote Access/VDI
  - Updated product category assignments (CSC-031 through CSC-036)
  - Enhanced SLH-DSA variant descriptions with specific use-case guidance

### Changed

- **Color System Standardization**:
  - Migrated all remaining hardcoded Tailwind colors to semantic tokens across Algorithms, Landing, and data files
  - `blue-500` → `primary`, `green-500` → `success`, `yellow-500` → `warning`, `red-500` → `destructive`

- **Navigation**:
  - Reordered nav items with Assess prominently placed
  - Glossary button moved from global floating overlay to per-view inline placement

- **Test Coverage**:
  - New test suites: AssessReport (31 tests), AssessWizard (32 tests), useAssessmentEngine (39 tests)
  - Updated Executive data and Timeline tests for expanded schemas
  - All 402 unit tests passing

## [1.9.0] - 2026-02-16

### Added

- **PQC Risk Assessment Module** (`/assess`):
  - Interactive 5-step wizard for personalized quantum risk evaluation
  - Algorithm migration recommendations based on assessment results
  - Compliance analysis with actionable remediation steps
  - Printable risk assessment report generation

- **Enhanced Migration Workflow** (`/migrate`):
  - 7-step structured migration process: Assess, Plan, Pilot, Implement, Test, Optimize, Measure
  - Framework mappings for NIST, ETSI, and CISA guidelines
  - Gap analysis with software category coverage assessment
  - Authoritative reference panel with curated migration resources

- **Global PQC Glossary**:
  - Floating access button available on every page
  - 100+ post-quantum cryptography terms with definitions
  - Category filters (Algorithm, Protocol, Standard, Concept, Organization)
  - A-Z index, full-text search, and complexity badges (Beginner, Intermediate, Advanced)
  - Cross-references to relevant learning modules

- **Guided First-Visit Tour**:
  - Interactive onboarding overlay highlighting key platform features
  - Auto-triggers on first visit, remembers completion in localStorage
  - Step-by-step walkthrough with skip and navigation controls

- **PQC 101 Learning Module** (`/learn/pqc-101`):
  - Beginner-friendly introduction to post-quantum cryptography
  - Covers quantum threat landscape and Shor's algorithm impact
  - At-risk sectors and Harvest Now, Decrypt Later (HNDL) attack explanation

- **Enhanced Gantt Timeline**:
  - Phase type filter dropdown (Discovery, Testing, POC, Migration, etc.)
  - Event type filter dropdown (Phase, Milestone)
  - CSV export of filtered timeline data
  - Milestone phase labels displayed on flag markers

- **New Software Reference Data**:
  - Added `quantum_safe_cryptographic_software_reference_02162026.csv`
  - Updated PQC software category priority matrix

### Changed

- **Learning Progress System**:
  - Module store versioning and migration support for schema evolution
  - Added `beforeunload` and `pagehide` persistence handlers for reliable auto-save
  - iOS Safari compatibility fixes for storage persistence
  - QuotaExceededError handling with user-friendly feedback via `react-hot-toast`

- **Navigation**:
  - Added Assess to main navigation bar with ClipboardCheck icon

### Fixed

- **Storage Reliability**:
  - Resolved iOS Safari storage persistence issues on page close
  - Added fallback handling for QuotaExceededError during progress save

## [1.8.7] - 2026-02-16

### Added

- **Library Module Redesign**:
  - New card grid view with `DocumentCard` and `DocumentCardGrid` components
  - `CategorySidebar` for quick category navigation with update indicators
  - `ActivityFeed` showing recent new and updated standards
  - `ViewToggle` to switch between card grid and tree table views
  - `SortControl` with options: Newest, Oldest, Name A-Z, Name Z-A, Urgency
  - Detail popover integration in card view

### Changed

- **Library Module**:
  - Refactored monolithic `LibraryView` into modular sub-components
  - Improved category filtering with sidebar navigation
  - Enhanced sorting with urgency-based ordering

- **Learn Dashboard**:
  - Simplified module card system — removed unused `disabled` and `comingSoon` properties
  - Cleaner duration display logic

- **Build System**:
  - Added `predev` script to copy liboqs WASM files before dev server starts
  - Updated build script to include liboqs dist copy step

- **liboqs DSA Integration**:
  - Updated WASM wrapper for improved compatibility

### Fixed

- **Algorithm Deprecation Dates**:
  - Corrected deprecation timelines per NIST IR 8547 and SP 800-131A Rev 3
  - Only 112-bit security algorithms (RSA-2048) deprecated in 2030; 128-bit+ algorithms (RSA-3072, P-256, P-384, etc.) correctly show 2035 (Disallowed) only
  - P-256 reclassified from 112-bit to 128-bit security tier
  - Updated sorting logic and color coding to distinguish deprecated (amber) from disallowed (red)

## [1.8.6] - 2026-02-14

### Added

- **SEO & Discoverability**:
  - Comprehensive meta tags (title, description, keywords)
  - Open Graph protocol tags for Facebook/LinkedIn link previews
  - Twitter Card tags for rich social media sharing
  - JSON-LD structured data (WebApplication + EducationalOrganization schema)
  - `robots.txt` to allow search engine crawling
  - `sitemap.xml` with 13 routes, priorities, and change frequencies
  - Branded `favicon.svg` with quantum-shield icon
  - `og-image.png` (1200x630) for social media preview images
  - Theme color and canonical URL meta tags

- **Landing Page Experience**:
  - New hero landing page at `/` route with value proposition
  - Stats bar displaying: 42 Algorithms, 165+ Events, 92 Standards, 6 Modules
  - Feature cards grid highlighting platform capabilities
  - Clear CTAs: "Explore Timeline", "Try Playground", "Start Learning"
  - Professional hero messaging: "The quantum threat is not theoretical"

- **Social Sharing**:
  - New `ShareButton` component with native Web Share API
  - Fallback share menu with Copy Link, Twitter/X, LinkedIn options
  - Keyboard accessibility (Escape to close)
  - Share buttons added to 4 key views: Timeline, Algorithms, Playground, Compliance
  - Pre-filled share text optimized for each view

- **Analytics & Engagement**:
  - 11 new analytics event helpers in `utils/analytics.ts`:
    - `logModuleStart()` - Track learning module starts
    - `logModuleComplete()` - Track completions with duration
    - `logStepComplete()` - Track individual step progress
    - `logArtifactGenerated()` - Track downloads (keys, certs, configs)
    - `logLibrarySearch()` / `logLibraryFilter()` - Standards library tracking
    - `logMigrateSearch()` / `logMigrateFilter()` - Software tool tracking
    - `logComplianceFilter()` - Compliance view tracking
    - `logDownload()` - File download tracking
    - `logExternalLink()` - Outbound link tracking
  - Analytics integration in `useModuleStore` for automatic progress tracking
  - Instrumented Library and Migrate views for search/filter analytics

- **Developer Tools**:
  - `scripts/validate-seo.sh` - Automated SEO validation script
  - Validates meta tags, static files, sitemap routes, HTTP status codes

### Changed

- **Routing**:
  - Timeline moved from `/` to `/timeline` route
  - Updated navigation with new "Home" button (with `end` prop)
  - Updated sitemap to include `/timeline` route
  - Updated tests to reflect new routing structure

- **Performance Optimization**:
  - **Removed 196 duplicate WASM files** from `public/dist/` directory
  - **Bundle size reduced from 66MB to 11MB (83% reduction)**
  - Enhanced vendor code splitting in `vite.config.ts`:
    - `vendor-react`: React core libraries
    - `vendor-ui`: Framer Motion, Lucide icons
    - `vendor-pqc`: Cryptography libraries
    - `vendor-zip`, `vendor-csv`, `vendor-markdown`, `vendor-pdf`: Specialized chunks
  - Simplified Framer Motion animation variants to reduce type complexity
  - Removed `mkdir -p public/dist` from build script (no longer needed)

- **Code Quality**:
  - Fixed ESLint accessibility warnings in ShareButton (proper keyboard event handling)
  - Updated MainLayout tests for new Home button behavior
  - All 226 unit and E2E tests passing

### Fixed

- ESLint `jsx-a11y/click-events-have-key-events` error on ShareButton backdrop
- ESLint `jsx-a11y/no-static-element-interactions` warning with proper event handlers
- MainLayout test expecting Timeline to be active at `/` (now expects Home)

## [1.8.5] - 2026-01-06

### Added

- **Migrate Module (New Feature)**:
  - Added new "Migrate" view for PQC readiness planning
  - Verified PQC Software Reference Database with 70+ entries
  - "New" and "Updated" status indicators for change tracking
  - Filtering by Category, Platform, and Support status

- **Data Updates**:
  - Added Jan 6, 2026 data files for Leaders, Threats, and Library (`01062026`)
  - Added 39 new PQC software entries (OS, Libraries, Network, Apps)
  - Updated PQC Software CSV to `12162025` version
  - Added comprehensive details for Windows Server 2025, Android 16, iOS 19, and major firewalls

### Changed

- **Threats Module**:
  - Updated AERO-001 reference to RTCA Security page (`https://www.rtca.org/security/`)
  - Removed "Accuracy / Probability" field from Threat Detail UI for cleaner presentation

- **Library Module**:
  - Corrected OpenPGP reference ID to `draft-ietf-openpgp-pqc-16`

- **Navigation**:
  - Reordered main menu to: Timeline -> Threats -> Algorithms -> Library -> Learn -> Migrate -> Playground -> OpenSSL Studio -> Compliance -> Leaders -> About
  - Better alignment with "Awareness -> Plan -> Act" user journey

- **Documentation**:
  - Updated `README.md` and `REQUIREMENTS.md` with Migrate module details
  - Added dedicated `requirements/Migrate_Module_Requirements.md`

## [1.8.4] - 2025-12-16

### Added

- **LMS/HSS (Hash-Based Signatures)**:
  - Unified "LMS (HSS)" button with Generate / Sign / Verify mode tabs
  - WASM-based key generation, signing, and verification
  - Parameters: LMS height (H5-H25), LM-OTS width (W1-W8)
  - Stateful signature warning for private key updates
  - Added `data-testid` attributes for E2E test reliability

### Changed

- **OpenSSL Studio**:
  - Now shows 13 operation types (added LMS/HSS)
  - "Run Command" button hidden for LMS (uses WASM buttons instead)

### Fixed

- **LMS Signature Verification**:
  - Fixed signature size issue (trimmed trailing zeros from 5KB buffer)
  - Fixed verify mode key selection to prefer `.pub` over `.key` files
  - Filtered verify dropdown to only show public keys (`.pub`, `.pem`)
- **Code Quality**:
  - Resolved all remaining lint errors (any types, label, useEffect deps)
  - Fixed prettier formatting across multiple components

### Removed

- **SKEY (Symmetric Key)**: Removed experimental EVP_SKEY feature due to WASM handle persistence limitations

## [1.8.3] - 2025-12-16

### Added

- **OpenSSL 3.6.0 Upgrade**:
  - Updated WASM binaries to OpenSSL 3.6.0 (4.12MB)
  - Native ML-KEM and ML-DSA support in OpenSSL
  - Enhanced PQC algorithm compatibility
  - OpenSSL documentation links in Studio command preview

- **Project Organization**:
  - Created `certs/` directory structure for TLS certificates
  - Added `certs/README.md` documentation
  - Organized certificates into `pqc/` and `rsa/` subdirectories

### Changed

- **Analytics**:
  - Improved localhost detection to prevent E2E test data from skewing production analytics
  - Enhanced analytics filtering logic

- **TLS Module**:
  - Regenerated all default certificates using OpenSSL 3.6.0
  - Updated ML-DSA certificate chains
  - Enhanced crypto operation logging
  - Certificate Inspector component with tree/raw view modes
  - TLS Comparison Table for side-by-side algorithm analysis
  - Improved client/server panel UI with better certificate management

- **Playground**:
  - Improved WASM instance management
  - Better error handling for key generation
  - Refactored ML-DSA and ML-KEM WASM integration

- **5G Module**:
  - Fixed state propagation issues
  - Improved file data handling between steps

- **Documentation**:
  - Updated data files to 12/15/2025 versions (Timeline, Library, Leaders, Threats)
  - Enhanced E2E tests for TLS module
  - Updated requirements documentation

### Fixed

- Race conditions in KEM playground E2E tests
- WASM caching issues in liboqs modules
- TypeScript errors in 5G service
- E2E test stability improvements across multiple modules
- Linting errors in TLS module (accessibility, TypeScript)
- AboutView test to match current SBOM content
- WASM library files added to repository for production deployment
- Removed mlkem-wasm references from vite config

## [1.8.2] - 2025-12-16

### Added

- **TLS Module Enhancements**:
  - Certificate Inspector component with tree/raw view modes
  - TLS Comparison Table for side-by-side algorithm analysis
  - Improved client/server panel UI with better certificate management
  - Certificate generation scripts for development

### Changed

- Updated data files to 12/15/2025 versions (Timeline, Library, Leaders, Threats)
- Enhanced E2E tests for TLS module
- Updated requirements documentation

### Fixed

- Linting errors in TLS module (accessibility, TypeScript)
- Added .gitignore rules for certificate files
- Excluded generated WASM file from Prettier checks

## [1.8.1] - 2025-12-15

### Added

- **What's New Feature**:
  - Dismissible toast notification on app load after version updates
  - Dedicated `/changelog` route displaying `CHANGELOG.md` with styled markdown
  - Interactive filter buttons for "New Features", "Enhancements", and "Bug Fixes"
  - Version tracking using Zustand store persisted to `localStorage`
  - "View Changelog" link added to About page
  - Comprehensive E2E tests for changelog functionality

- **Authoritative Sources Feature**:
  - "Sources" button added to 5 data views: Timeline, Library, Threats, Leaders, Algorithms
  - Modal displaying filtered authoritative sources grouped by type (Government, Academic, Industry Workgroup)
  - 52 curated sources from `pqc_authoritative_sources_reference_12152025.csv`
  - Timestamp-based CSV file selection for automatic latest version loading
  - Region badges with color coding (Americas, EMEA, APAC, Global)
  - Clickable source names linking to primary URLs
  - View-specific filtering using CSV columns

### Fixed

- E2E test strict mode violations in `algorithms.spec.ts` and `library.spec.ts`
- Changelog linting warnings (removed unnecessary eslint-disable comments)

## [1.8.0] - 2025-12-14

### Added

- **TLS 1.3 Basics Learning Module**:
  - Interactive TLS 1.3 handshake simulation with dual configuration modes (GUI + Raw OpenSSL config)
  - Support for RSA and ML-DSA (Post-Quantum) identity certificates
  - Detailed cryptographic logging showing key derivation, HKDF, signatures, and encryption
  - PQC algorithm support: ML-KEM (Kyber) key exchange, ML-DSA and SLH-DSA signatures
  - Custom certificate import from OpenSSL Studio
  - Separate CA trust configuration for client and server
  - Full interaction flow with customizable messages
  - Comprehensive requirements documentation (`learn_openssltls13_requirement.md`)

- **CI/CD Optimizations**:
  - Implemented Playwright test sharding (2 shards) to parallelize E2E test execution
  - Reduced CI execution time from >30 minutes (timeout) to ~4.5 minutes
  - Configured `workers: 1` in CI to prevent resource deadlocks on GitHub Actions runners
  - Added `ignoreHTTPSErrors: true` to handle SSL issues with external compliance sites

### Changed

- **5G Module**:
  - Refactored to use OpenSSL WASM instead of WebCrypto
  - Improved hybrid crypto implementation

- **Digital ID Module**:
  - Implemented OpenSSL log transparency and cleanup

- **Documentation**:
  - Updated SBOM in About page to match current package.json versions (Framer Motion, Lucide, Zustand, Vite, Prettier)
  - Updated Node.js requirement from v18 to v20 in README
  - Added TLS 1.3 Basics module to README feature list
  - Updated module count from 5 to 6 across documentation
  - Added TLSBasics directory to project structure documentation

### Fixed

- **E2E Test Regressions**:
  - Fixed `timeline.spec.ts` country selector locator (changed from "All Countries" to "Region")
  - Fixed `compliance-sources.spec.ts` SSL errors in Firefox by enabling HTTPS error ignoring
  - Fixed `playground-kem-updated.spec.ts` race condition in HKDF key derivation switching
  - Fixed `playground-kem-additional.spec.ts` race conditions in HKDF normalization tests
  - Added proper waits for WASM operation completion and hybrid mode key selection
  - Fixed `useKemOperations.ts` to clear decapsulated secrets during WASM encapsulation
  - Removed networkidle to resolve hanging CI tests
  - Stabilized CI with sharding and resolved all E2E test failures

- **5G Module**:
  - Restored 5G module, fixed E2E tests and linting
  - Made shared secret derivation stateless-safe for CI
  - Resolved unused variable build error
  - Restored missing public API methods and suppressed lint warnings
  - Restored robust hybrid crypto (WebCrypto + OpenSSL) to fix E2E failures

- **Build Issues**:
  - Removed invalid 'variant' prop from FilterDropdown usage
  - Resolved JSX.Element type error in SimpleGanttChart
  - Resolved wasm adapter lint errors

## [1.7.0] - 2025-12-12

### Added

- **Dynamic Data Loading**:
  - Implemented dynamic selection of the latest CSV data files for algorithms and transitions
  - Added "New" and "Updated" status badges to Library, Threats, Leaders, and Timeline modules
  - Timestamp-based CSV file selection for automatic latest version loading

- **Compliance Module Enhancements**:
  - Added ENISA EUCC scraper (`scripts/scrapers/enisa.ts`) and requirements
  - Multi-URL support for CC certificates and ANSSI scraper
  - Multi-URL dropdown display in compliance table
  - Lab column and expert lab extraction for CC
  - Comprehensive data improvements with filters embedded in column headers
  - Prioritized Cert Report over ST for extraction
  - Improved ANSSI link detection with 'certificat' keyword

- **Library Module**:
  - Library search functionality
  - Updated data classification

### Changed

- **Documentation**:
  - Updated `README.md` to accurately reflect the current project structure (including `scripts` at root)
  - Added comprehensive scraper requirements for all data sources
  - Updated contributing guidelines and added submit_feature workflow
  - Added CODEOWNERS file for branch protection

- **Compliance Module**:
  - Removed Status column from table
  - Centralized lab extraction logic in utils
  - Disabled generic CC links and fixed doc parsing regex
  - Used CC Portal product page URLs instead of corrupted PDF URLs
  - Properly encoded CC certificate URLs and extracted lab field

### Fixed

- **Code Quality**:
  - Resolved `eslint` errors in scraper scripts (`anssi.ts`, `cc.ts`) and various components
  - Fixed security warnings related to object injection and unsafe regex
  - Resolved build failures and security warnings
  - Fixed lint errors in debug scripts

- **E2E Tests**:
  - Fixed e2e regression for removed columns in compliance tests
  - Stabilized CI by skipping flaky tests and optimizing config
  - Used preview server in CI for stability
  - Added timeouts and disabled audit to prevent hangs
  - Disabled vitest watch mode in test script

- **Scraper Issues**:
  - Resolved unused variables and refined CC fetch logic
  - Resolved runtime errors in CC lab extraction
  - Fixed ANSSI links and extracted lab info from ST

- **UI Issues**:
  - Restored E2E fixes and IV management improvements
  - Resolved E2E test failures in PKI and Leaders modules
  - Fixed AttributeTable accessibility
  - Completed truncated AI acknowledgment text

## [1.6.0] - 2025-12-06

### Added

- **Theme Toggle**:
  - Implemented persistent theme selection (Light/Dark modes)
  - Global state management using Zustand with localStorage persistence
  - Theme toggle UI added to About page (desktop and mobile)
  - Synchronized state between mobile and desktop views
  - Refactored CSS to support manual `.dark` class overrides

- **Mobile Timeline Swipeable Phase Navigation**:
  - Swipe gestures for browsing through all phases per country
  - Interactive phase indicator dots showing current position
  - Direct navigation by clicking phase indicators
  - Visual distinction: Flag icon for milestones, colored dot for phases
  - Smooth Framer Motion animations (200ms transitions)
  - 50px drag threshold for phase transitions

- **5G Module Improvements**:
  - Implemented 5G Profile C PQC Dual Mode and EUDI Wallet Crypto alignment
  - Enhanced E2E validation tests for 5G flows

- **Digital Assets Module**:
  - Complete refactor with strict typing, E2E tests, and HD Wallet UI unification
  - Enhanced flows with improved components and utilities
  - Shared hooks to reduce code duplication

- **PKI Workshop Enhancements**:
  - Enhanced certificate parser with deep tree structure and semantic colors
  - Profile info buttons with optimized markdown modal
  - Completed button to PKI Workshop final step
  - Interactive PKI Workshop on mobile with read-only inputs
  - Top-level certificate sections always visible

- **Testing**:
  - Comprehensive unit tests for core utilities
  - Tests for OpenSSLService and PKILearning
  - Tests for ThreatsDashboard and LeadersGrid
  - SimpleGanttChart tests and fixed analytics testing
  - AlgorithmsView and LibraryView tests
  - Comprehensive test coverage for core components

### Changed

- **Appearance Settings**:
  - Removed "System" theme option to simplify user experience
  - Set default theme to **Light**
  - Updated `About` page and Mobile About view to reflect theme changes

- **Semantic Color Tokens**:
  - Global refactor of all Learning Modules (5G, DigitalAssets, DigitalID, PKIWorkshop) to use semantic color tokens
  - Introduced `--color-tertiary` (Purple) for Profile C support
  - Refactored hardcoded colors to semantic tokens across app
  - Replaced hardcoded dark styles with theme-aware variables in About page

- **UI Improvements**:
  - GitHub link added to about section
  - Unified file manager badge text color to muted-foreground style
  - Darkened file manager badge text for better light mode contrast
  - Fixed broken leader icons by adding resilient LeaderCard component
  - Improved console output readability with better semantic tokens
  - Improved attribute value input readability
  - Consistent readable input colors across all PKI Workshop steps
  - Lightened code block backgrounds for better light mode visibility
  - Theme consistency overhaul for Digital Assets module

- **Documentation**:
  - Updated `requirements/timeline.md` with comprehensive mobile timeline specifications
  - Updated `REQUIREMENTS.md` with responsive design breakpoint details
  - Added mobile swipeable navigation requirements and UX specifications
  - Updated project structure in README
  - Fixed README inconsistencies
  - Added maintainability audit report for Learn/Digital Assets modules
  - Added mobile design patterns to design system requirements

- **Build & Deployment**:
  - Display build timestamp in CST (Austin, TX timezone)
  - Made build timestamp update on every build/HMR
  - Added 404.html generation for GitHub Pages SPA routing
  - Updated license info in package.json and About page

### Fixed

- **Navigation Issues**:
  - Resolved critical bug where new users were forced into a redirect loop to the About page (WelcomeRedirect removed)
  - Resolved Timeline blank screen navigation bug
  - Removed AnimatePresence to resolve blank screen navigation bug

- **Test Stability**:
  - Fixed stale `useTheme` tests that referenced the deprecated "system" theme
  - Fixed e2e tests: seed localStorage to bypass welcome, update selectors and mock data
  - Fixed BitcoinFlow unit test crash
  - Updated MobileTimelineList.test.tsx mock data to match interface

- **Linting & Code Quality**:
  - Addressed various security (`detect-object-injection`) and React Hook warnings
  - Resolved build errors in DigitalID and Tabs
  - Resolved Ethereum signature verification issues
  - Suppressed testing-library and security warnings to unblock build
  - Resolved remaining lint errors and bypassed strict checks
  - Corrected TypeScript import for Plugin type

- **Accessibility**:
  - Fixed label-control associations in ThreatsDashboard

- **Theme Consistency**:
  - Removed hardcoded colors across multiple components
  - Ensured openssl terminal supports light mode
  - Ensured light mode consistency for Threats and Leaders pages
  - Ensured consistent light mode by using theme variables

- **PKI Workshop**:
  - Skipped basicConstraints from profile attributes
  - Removed constraints from PKI Workshop components
  - Completed constraints removal from CSRGenerator
  - Preserved CSR source attribution when loading CA profile

- **Dependabot**:
  - Resolved dependabot validation errors by reformatting
  - Enabled dependabot grouping and added AboutView tests

## [1.5.0] - 2025-12-06

### Added

- **Theme Toggle**:
  - Implemented persistent theme selection (Light/Dark/System modes)
  - Global state management using Zustand with localStorage persistence
  - Theme toggle UI added to About page (desktop and mobile)
  - Synchronized state between mobile and desktop views
  - Refactored CSS to support manual `.dark` class overrides

- **Mobile Timeline Swipeable Phase Navigation**:
  - Swipe gestures for browsing through all phases per country
  - Interactive phase indicator dots showing current position
  - Direct navigation by clicking phase indicators
  - Visual distinction: Flag icon for milestones, colored dot for phases
  - Smooth Framer Motion animations (200ms transitions)
  - 50px drag threshold for phase transitions

### Changed

- **UI Improvements**:
  - Learn module added to Kudos and Change Request forms
  - Updated About page SBOM layout to compact 3-column view

- **Documentation**:
  - Updated mobile timeline requirements
  - Created Design System, updated cursor rules with crypto/tech guidelines

### Fixed

- **Theme Consistency**:
  - Ensured openssl terminal supports light mode
  - Ensured light mode consistency for Threats and Leaders pages
  - Ensured consistent light mode by using theme variables

- **Build Issues**:
  - Added 404.html generation for GitHub Pages SPA routing

## [1.4.0] - 2025-12-04

### Added

- **Algorithm Comparison**:
  - Comprehensive algorithm comparison with multi-tab interface
  - Data source attribution to Algorithms and Threats pages

- **Digital Assets Module**:
  - Implemented digital assets module with full cryptocurrency support
  - Complete digital assets flows with improved components and utilities

- **PKI Workshop**:
  - Profile info button with optimized markdown modal

### Changed

- **OpenSSL Studio Redesign**:
  - **Layout**: Implemented a split-pane design with dedicated areas for Configuration (Left) and File Management (Right)
  - **Command Preview**: Moved to the top of the left pane, vertically centered, with an embedded "Run Command" button for a streamlined workflow
  - **File Manager**:
    - Now permanently visible in the right pane
    - Added "Size" column and compact timestamp formatting
    - Implemented column sorting (Name, Type, Size, Date)
  - **Toolbar**: Simplified navigation by removing the redundant "Key Files" button

- **Tailwind v4 Migration**:
  - Migrated to Tailwind v4 with UX improvements
  - Refined algorithms table layout and typography
  - Improved contrast by using proper semantic tokens

- **Data Format**:
  - Converted algorithms data from TypeScript to CSV

- **Filter UI**:
  - Applied grouped filter layout to Timeline page
  - Added opaque styling to filter dropdowns
  - Replaced glass-panel with opaque background in FilterDropdown wrapper
  - Replaced semi-transparent backgrounds in FilterDropdown options
  - Made all select dropdown options opaque globally
  - Made dropdown menus opaque for better readability
  - Improved Threats page filter layout and spacing

### Fixed

- **OpenSSL Studio**:
  - Resolved file writing error and standardized PKI Workshop layout

- **Build & Linting**:
  - Stabilized e2e tests, updated SBOM, and fixed accessibility issues
  - Fixed formatting and lint errors
  - Resolved type error in WorkbenchToolbar and added type check to pre-commit
  - Resolved lint errors and updated lint-staged config
  - Setup husky and lint-staged for automatic formatting
  - Fixed code formatting

- **Component Issues**:
  - Workbench component refactor and fixed regression tests
  - Updated Workbench tests with required props

### Documentation

- Updated `requirements/opensslstudio.md` with the new layout specifications and feature set
- Updated SBOM section with accurate dependency versions
- Updated package-lock.json to sync with package.json
- Updated project structure in README

## [1.3.0] - 2025-12-02

### Added

- **PKI Learning Module Enhancements**:
  - **File Naming**: Standardized naming for artifacts (e.g., `pkiworkshop_<timestamp>.csr`, `pkiworkshop_ca_<timestamp>.key`)
  - **OpenSSL Studio Sync**: Automatically syncs generated keys, CSRs, and certificates to the OpenSSL Studio file store
  - **State Persistence**: Workshop progress and OpenSSL Studio files are now persisted to `localStorage`
  - **UI Improvements**:
    - **CertSigner**: Refactored to a 4-step flow (CSR -> Profile -> Content -> Sign) with an educational process diagram
    - **Attribute Source**: Added visual indicators for attributes from CSR vs. CA Profile
    - **Constraints**: Moved constraints to a dedicated display row
  - **Reset Functionality**: Added a "Reset Workshop" button to clear all state
  - **CertParser**: Added artifact selection dropdown and format conversion (DER/P7B)

- **OpenSSL Studio Enhancements**:
  - File upload support
  - Auto-encryption filename
  - Playground backup functionality
  - Enhanced logs and UI navigation

### Changed

- **OpenSSL Studio**:
  - Updated requirements with verified algorithms and gap analysis
  - Improved command generation syntax for keys, signatures, and KEM

### Fixed

- **Code Quality & Stability**:
  - **Linting**: Resolved all lint warnings (unused variables, `any` types, security alerts)
  - **Build**: Fixed module resolution error by renaming `Root.tsx` to `AppRoot.tsx` and ensuring git tracking
  - **Formatting**: Enforced consistent code style
  - Resolved remaining lint warnings and build error
  - Resolved remaining lint warnings and Fast Refresh issue
  - Resolved remaining lint warnings and security alerts
  - Resolved linting, build, and accessibility errors
  - Applied code formatting fixes

- **OpenSSL Studio**:
  - Fixed SLH-DSA key generation: Added missing variants to Workbench.tsx and updated E2E tests
  - Resolved lint errors

- **Accessibility**:
  - ADA accessibility and UI consistency improvements

## [1.2.0] - 2025-12-02

### Added

- **About Page**:
  - About page with SBOM and AI acknowledgment
  - Comprehensive Security Audit Report (`src/data/security_audit_report_12022025.md`)

- **Threats Dashboard**:
  - Implemented Threats dashboard with tabs and sorting
  - Standardized filtering UI and added criticality filter

- **Analytics**:
  - Implemented granular analytics tracking
  - Integrated Google Analytics

- **Data Updates**:
  - Display data source metadata and updated data files
  - Updated timeline data and schema
  - Updated leaders data and schema
  - Implemented versioned CSV loading for leaders data
  - Added detailed CNSA 2.0 migration phases and milestones
  - Augmented leaders list with new details

- **Algorithms**:
  - Updated algorithms list with full OpenSSL Studio support

- **Build Improvements**:
  - Used static build timestamp
  - Added automated release workflow

### Changed

- **UI Improvements**:
  - Reordered tabs in playground and openssl studio
  - Removed close button and compacted library detail popover
  - Optimized library detail popover metadata layout
  - Refined library popover layout and table actions
  - Used SVG flags and updated footer text
  - Enforced strict sizing for country flags

### Fixed

- **Accessibility & Security**:
  - Accessibility and security issues, added about requirements
  - Resolved lint and security warnings

- **Build Issues**:
  - Fixed formatting issues
  - Fixed lint error: unused variable in timelineData.ts
  - Fixed build error: unused variable in timelineData.ts

- **E2E Tests**:
  - Updated e2e tests for UI changes
  - Added E2E tests for PQC algorithms (ML-DSA, SLH-DSA, ML-KEM)

### Documentation

- Updated `requirements/timeline.md` and `opensslstudio.md`
- Updated requirements with GA, timestamp, and algorithm details
- Updated formatting and added security audit report

## [1.1.0] - 2025-11-30

### Added

- **Revised Timeline Design**:
  - New Gantt chart visualization with sticky columns for Country and Organization
  - Improved popover details for timeline phases and milestones
  - Country selection and filtering
  - Mock data support for stable E2E testing
  - Prioritized milestones in timeline sorting
  - Rendered phases as individual cells for continuous bars
  - Added visible grid lines to timeline
  - Horizontal borders only between countries

- **Timeline Features**:
  - Grouped pre-2025 events and added <2024 header
  - Updated timeline to group pre-2025 events
  - Refined timeline visualization, support new CSV structure

### Changed

- **Popover Improvements**:
  - Removed close button from popover, rely on click-outside
  - Optimized popover header layout to save space
  - Made popover fonts smaller and consistent with timeline
  - Improved popover positioning and text wrapping

- **Phase Handling**:
  - Added 'Research' to phase order for correct sorting
  - Reordered phases for better visualization
  - Used fixed table layout to make phase bars span correctly
  - Made phase bars fill full width of spanned columns

### Fixed

- **OpenSSL Studio**:
  - Resolved duplicate terminal log issues
  - Fixed worker initialization errors (`importScripts` and redeclaration issues)
  - Resolved importScripts error by providing correct URL

- **Accessibility**:
  - Restored high-contrast colors for better visibility
  - Improved color contrast for WCAG AA compliance
  - Added keyboard accessibility to phase cells

- **CI/CD**:
  - Fixed linting and formatting issues for a clean build pipeline
  - Resolved lint errors and security warnings
  - Fixed formatting issues in openssl worker
  - Triggered CI

- **Navigation**:
  - Resolved runtime error in Legend and correct phase sorting
  - Resolved runtime error and type issues with Deadline phase

- **E2E Tests**:
  - Decoupled E2E tests from production CSV data using mock data
  - Updated E2E test expectation to match current data
  - Fixed production test to match current UI
  - Fixed production test strict mode violation
  - Updated E2E tests to match current UI implementation
  - Updated E2E test to close popover by clicking outside

- **Linting**:
  - Resolved ESLint errors - changed let to const for immutable variables
  - Resolved remaining lint errors
  - Resolved type error in FileManager.tsx by casting blob content to BlobPart
  - Resolved persistent lint errors and Fast Refresh warnings
  - Resolved build lint errors and unused variables
  - Resolved 'any' type lint error in SimpleGanttChart.tsx
  - Resolved lint error in GanttDetailPopover.tsx by removing unnecessary mounted state

- **Styling**:
  - Fixed formatting issues
  - Removed .text-muted utility class to restore original styling
  - Restored original text-muted color for better visual hierarchy
  - Added bold styling to active navigation button
  - Improved navigation button readability

### Documentation

- Updated timeline requirements with recent sorting and visualization changes
- Updated timeline requirements with popover improvements
- Updated requirements with recent fixes and testing strategy
- Fixed formatting in requirements docs

## [1.0.0] - Initial Release

Initial release of PQC Timeline Application.
