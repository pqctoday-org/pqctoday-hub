# Changelog

All notable changes to this project will be documented in this file.

## [1.8.4] - 2025-12-16

### Added

- **LMS / HSS (Hash-Based Signatures)**:
  - Unified "LMS (HSS)" button with Generate / Sign / Verify mode tabs
  - WASM-based key generation, signing, and verification
  - Parameters: LMS height (H5-H25), LM-OTS width (W1-W8)
  - Stateful signature warning for private key updates
  - Added `data-testid` attributes for E2E test reliability

### Changed

- **OpenSSL Studio**:
  - Now shows 13 operation types (added LMS/HSS)
  - "Run Command" button hidden for LMS (uses WASM buttons instead)
  - Updated documentation to reflect OpenSSL 3.6.0

### Fixed

- **LMS Signature Verification**:
  - Fixed signature size issue (trimmed trailing zeros from 5KB buffer)
  - Fixed verify mode key selection to prefer `.pub` over `.key` files
  - Filtered verify dropdown to only show public keys (`.pub`, `.pem`)

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

- **Playground**:
  - Improved WASM instance management
  - Better error handling for key generation
  - Refactored ML-DSA and ML-KEM WASM integration

- **5G Module**:
  - Fixed state propagation issues
  - Improved file data handling between steps

### Fixed

- Race conditions in KEM playground E2E tests
- WASM caching issues in liboqs modules
- TypeScript errors in 5G service
- E2E test stability improvements across multiple modules

### Added

- **TLS Module Enhancements**:
  - Certificate Inspector component with tree/raw view modes
  - TLS Comparison Table for side-by-side algorithm analysis
  - Improved client/server panel UI with better certificate management
  - Certificate generation scripts for development
  - Updated WASM binaries (OpenSSL 3.6.0)

### Changed

- Updated data files to 12/15/2025 versions (Timeline, Library, Leaders, Threats)
- Enhanced E2E tests for TLS module
- Updated requirements documentation

### Fixed

- Linting errors in TLS module (accessibility, TypeScript)
- Added .gitignore rules for certificate files

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

### Fixed

- **E2E Test Regressions**:
  - Fixed `timeline.spec.ts` country selector locator (changed from "All Countries" to "Region")
  - Fixed `compliance-sources.spec.ts` SSL errors in Firefox by enabling HTTPS error ignoring
  - Fixed `playground-kem-updated.spec.ts` race condition in HKDF key derivation switching
  - Fixed `playground-kem-additional.spec.ts` race conditions in HKDF normalization tests
  - Added proper waits for WASM operation completion and hybrid mode key selection
  - Fixed `useKemOperations.ts` to clear decapsulated secrets during WASM encapsulation

### Changed

- **Documentation**:
  - Updated SBOM in About page to match current package.json versions (Framer Motion, Lucide, Zustand, Vite, Prettier)
  - Updated Node.js requirement from v18 to v20 in README
  - Added TLS 1.3 Basics module to README feature list
  - Updated module count from 5 to 6 across documentation
  - Added TLSBasics directory to project structure documentation

## [1.7.0] - 2025-12-12

### Added

- **Dynamic Data Loading**:
  - Implemented dynamic selection of the latest CSV data files for algorithms and transitions.
  - Added "New" and "Updated" status badges to Library, Threats, Leaders, and Timeline modules.
- **Compliance**:
  - Added ENISA EUCC scraper (`scripts/scrapers/enisa.ts`) and requirements.

### Changed

- **Documentation**:
  - Updated `README.md` to accurately reflect the current project structure (including `scripts` at root).
- **Code Quality**:
  - Resolved `eslint` errors in scraper scripts (`anssi.ts`, `cc.ts`) and various components.
  - Fixed security warnings related to object injection and unsafe regex.

## [1.6.0] - 2025-12-09

### Added

- **Appearance Settings Refactor**:
  - Removed "System" theme option to simplify user experience.
  - Set default theme to **Light**.
  - Updated `About` page and Mobile About view to reflect theme changes.

- **Semantic Color Tokens**:
  - Global refactor of all Learning Modules (5G, DigitalAssets, DigitalID, PKIWorkshop) to use semantic color tokens (e.g., `primary`, `success`, `destructive`, `tertiary`) instead of hardcoded values.
  - Introduced `--color-tertiary` (Purple) for Profile C support.

- **5G Module Improvements**:
  - Enhanced E2E validation tests for 5G flows.

### Fixed

- **Navigation Loop**: Resolved a critical bug where new users were forced into a redirect loop to the About page (`WelcomeRedirect` removed).
- **Test Stability**: Fixed stale `useTheme` tests that referenced the deprecated "system" theme.
- **Linting**: Addressed various security (`detect-object-injection`) and React Hook warnings.

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

### Fixed

- **Accessibility**: Fixed label-control associations in ThreatsDashboard
- **Theme Consistency**: Removed hardcoded colors across multiple components

### Documentation

- Updated `requirements/timeline.md` with comprehensive mobile timeline specifications
- Updated `REQUIREMENTS.md` with responsive design breakpoint details
- Added mobile swipeable navigation requirements and UX specifications

## [1.4.0] - 2025-12-06

### Changed

- **OpenSSL Studio Redesign**:
  - **Layout**: Implemented a split-pane design with dedicated areas for Configuration (Left) and File Management (Right).
  - **Command Preview**: Moved to the top of the left pane, vertically centered, with an embedded "Run Command" button for a streamlined workflow.
  - **File Manager**:
    - Now permanently visible in the right pane.
    - Added "Size" column and compact timestamp formatting.
    - Implemented column sorting (Name, Type, Size, Date).
  - **Toolbar**: Simplified navigation by removing the redundant "Key Files" button.

### Documentation

- Updated `requirements/opensslstudio.md` with the new layout specifications and feature set.

## [1.3.0] - 2025-12-04

### Added

- **PKI Learning Module Enhancements**:
  - **File Naming**: Standardized naming for artifacts (e.g., `pkiworkshop_<timestamp>.csr`, `pkiworkshop_ca_<timestamp>.key`).
  - **OpenSSL Studio Sync**: Automatically syncs generated keys, CSRs, and certificates to the OpenSSL Studio file store.
  - **State Persistence**: Workshop progress and OpenSSL Studio files are now persisted to `localStorage`.
  - **UI Improvements**:
    - **CertSigner**: Refactored to a 4-step flow (CSR -> Profile -> Content -> Sign) with an educational process diagram.
    - **Attribute Source**: Added visual indicators for attributes from CSR vs. CA Profile.
    - **Constraints**: Moved constraints to a dedicated display row.
  - **Reset Functionality**: Added a "Reset Workshop" button to clear all state.
  - **CertParser**: Added artifact selection dropdown and format conversion (DER/P7B).

### Fixed

- **Code Quality & Stability**:
  - **Linting**: Resolved all lint warnings (unused variables, `any` types, security alerts).
  - **Build**: Fixed module resolution error by renaming `Root.tsx` to `AppRoot.tsx` and ensuring git tracking.
  - **Formatting**: Enforced consistent code style.

## [1.2.0] - 2025-12-02

### Changed

- **Threats Dashboard**: Reverted URL display feature due to data quality concerns.
- **Documentation**: Updated requirements and test plans.

### Added

- **Security**: Added comprehensive Security Audit Report (`src/data/security_audit_report_12022025.md`).
- **Maintenance**: Applied formatting fixes across the codebase.

## [1.1.0] - 2025-11-30

### Added

- **Revised Timeline Design**:
  - New Gantt chart visualization with sticky columns for Country and Organization.
  - Improved popover details for timeline phases and milestones.
  - Country selection and filtering.
  - Mock data support for stable E2E testing.

### Fixed

- **OpenSSL Studio**:
  - Resolved duplicate terminal log issues.
  - Fixed worker initialization errors (`importScripts` and redeclaration issues).
- **Accessibility**:
  - Restored high-contrast colors for better visibility.
- **CI/CD**:
  - Fixed linting and formatting issues for a clean build pipeline.
