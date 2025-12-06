# Changelog

All notable changes to this project will be documented in this file.

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
