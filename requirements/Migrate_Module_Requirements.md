# Migrate Module Requirements

## Overview

The **Migrate** module provides a comprehensive, verified reference database of cryptographic software, libraries, operating systems, and network infrastructure that support Post-Quantum Cryptography (PQC). It serves as a critical planning tool for organizations to identify "quantum-safe" alternatives for their current technology stack.

## Core Features

### 1. PQC Software Reference Database

**Goal**: Maintain an up-to-date, authoritative list of software with PQC support.

- **Data Source**: CSV-based data store (`src/data/quantum_safe_cryptographic_software_reference_*.csv`).
- **Fields**:
  - `software_name`: Unique identifier.
  - `category`: Taxonomy classification (e.g., OS, Library, Network).
  - `pqc_support`: Description of supported algorithms (ML-KEM, ML-DSA, etc.).
  - `fips_validated`: Status of FIPS 140-3 or other certifications.
  - `migration_priority`: Recommendation level (Critical, High, Medium).
  - `verification_status`: Audit status (Verified, Trusted Vendor).

### 2. Migration Dashboard (UI)

**Goal**: Provide an interactive interface to explore and filter the PQC software landscape.

- **Table View**: Sortable and filterable table of software entries.
- **Filtering**:
  - Filter by **Category** (Operating Systems, Libraries, etc.).
  - Filter by **Platform** (Linux, Windows, Mobile, etc.).
  - **Search**: Free-text search across name and description.
- **Detail View**: Expandable rows to show detailed "Product Brief", "Sources", and verification dates.

### 3. Change Tracking & Notifications

**Goal**: Highlight recent changes to the PQC landscape to keep users informed.

- **New Entry Detection**:
  - Automatically detect software added since the previous update.
  - Display a **Blue "New" Badge** next to the software name.
- **Update Detection**:
  - Detect changes in existing entries (e.g., new version, FIPS status update).
  - Display an **Amber "Updated" Badge**.
- **Logic**: Comparison is performed client-side by loading the two most recent CSV files (by date) and diffing them based on `software_name`.

### 4. Taxonomy & Categories

The module organizes software into clear, actionable categories:

- **Operating Systems**: Windows Server 2025, Android 16, iOS 26, etc.
- **Cryptographic Libraries**: OpenSSL, Bouncy Castle, liboqs, commercial SDKs.
- **Network Infrastructure**: Firewalls (Palo Alto, Fortinet), Routers (Cisco), VPNs.
- **Secure Communications**: Messaging apps (Signal), Email (Tuta), Browsers.
- **Identity & PKI**: HSMs (Thales, Entrust), PKI (EJBCA), Certificate Managers.

## Technical Implementation

- **Data format**: Standard CSV for easy editing and interoperability.
- **Frontend**: React + TypeScript.
- **State Management**: Client-side parsing (PapaParse) and filtering.
- **Versioning**: File-based versioning (`_date.csv`) enables historical tracking and comparison.

## Future Roadmap

- **Export**: Ability to export the filtered list as PDF or CSV.
- **Integration**: Link specific software entries to the "Playground" for hands-on testing.
- **Automated Feeds**: Ingest RSS/API feeds from NIST or vendors for real-time updates.
