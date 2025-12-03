# Changelog

All notable changes to this project will be documented in this file.

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
