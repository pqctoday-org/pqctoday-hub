# Changelog

All notable changes to this project will be documented in this file.

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
